import {hasPngSignature,safeSvgDocument} from "./plot-preview.js";
export const LOCAL_RUNNER_URL="http://127.0.0.1:8765/run";
const MAX_BASE64=7_000_000;
function decodeBase64(encoded) {
  if(typeof encoded!=="string"||encoded.length>MAX_BASE64||!/^[-A-Za-z0-9+/]*={0,2}$/.test(encoded))throw Error("Invalid figure data.");
  const binary=atob(encoded);
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return bytes;
}
export function decodeLocalFigure(data,dom=document){
  if(!data||!/^[-\w.]{1,100}\.(png|svg)$/i.test(data.name)||!["image/png","image/svg+xml"].includes(data.mimeType))throw Error("Invalid output figure.");
  if((data.mimeType==="image/png")!==/\.png$/i.test(data.name))throw Error("Figure type mismatch.");
  const bytes=decodeBase64(data.base64);
  if(bytes.length===0||bytes.length>5*1024*1024)throw Error("Figure size invalid.");
  if(data.mimeType==="image/png"){
    if(!hasPngSignature(bytes))throw Error("Invalid PNG output.");
    return new Blob([bytes],{type:"image/png"});
  }
  const svg=new TextDecoder("utf-8",{fatal:true}).decode(bytes);
  return new Blob([safeSvgDocument(svg,new dom.defaultView.DOMParser(),new dom.defaultView.XMLSerializer())],{type:"image/svg+xml"});
}
export function initLocalRunner({doc=document, fetcher=fetch, endpoint=LOCAL_RUNNER_URL,
  getDraft, getIdentity, embedActive=()=>true, onResult=()=>{}, onClear=()=>{}}={}){
  const token=doc.querySelector("#local-runner-token"),run=doc.querySelector("#local-runner-run");
  const status=doc.querySelector("#local-runner-status"),output=doc.querySelector("#local-runner-output");
  const images=doc.querySelector("#local-runner-images");
  let activeRequest=0,busy=false,objects=[];
  const release=()=>{for(const url of objects)URL.revokeObjectURL(url);objects=[];images.replaceChildren();};
  function clear(){
    activeRequest++;
    release();output.textContent="";status.textContent="No execution in this task.";
    run.disabled=false;busy=false;
    onClear();
  }
  async function submit(){
    if(busy)return;
    if(embedActive()){
      status.textContent="Disable the JDoodle embed in Compiler settings and reload before local execution. Its third-party script could otherwise read your session code.";
      return;
    }
    if(!token.value||token.value.length<16){status.textContent="Enter the access code printed by your local runner.";return;}
    const code=getDraft(),identity=getIdentity();
    if(typeof code!=="string"||!code.trim()||new TextEncoder().encode(code).length>50000){
      status.textContent="The draft must contain Julia code and fit within 50 KB.";return;
    }
    const request=++activeRequest;
    busy=true;run.disabled=true;release();output.textContent="";
    status.textContent="Running on your computer…";
    try{
      const response=await fetcher(endpoint,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token.value},body:JSON.stringify({code}),cache:"no-store"});
      const json=await response.json();
      if(request!==activeRequest||identity!==getIdentity()||code!==getDraft())return;
      if(!response.ok)throw Error(json.error||"The local runner returned HTTP "+response.status);
      const list=Array.isArray(json.figures)?json.figures.slice(0,3):[];
      const accepted=[];
      for(const data of list){
        try{
          const imageBlob=decodeLocalFigure(data,doc);
          const src=URL.createObjectURL(imageBlob);
          objects.push(src);
          accepted.push({name:data.name,blob:imageBlob});
          const fig=doc.createElement("figure"),img=doc.createElement("img");
          img.src=src;img.alt="Julia output: "+data.name;
          const cap=doc.createElement("figcaption");cap.textContent=data.name;
          fig.append(img,cap);images.append(fig);
        }catch{status.textContent="Figure rejected: unsupported or unsafe output.";}
      }
      output.textContent=[json.stdout,json.stderr].filter(Boolean).join("\n")||"(No printed output)";
      onResult({code,identity,ok:json.ok===true,stdout:json.stdout||"",stderr:json.stderr||"",figures:accepted});
      if(!status.textContent.startsWith("Figure rejected")){
        status.textContent=json.timedOut?"Execution timed out after 120 seconds.":json.ok?
          "Executed with local Julia. Results are not graded.":"Julia exited with an error (exit code "+json.exitCode+").";
      }
    }catch(error){
      if(request===activeRequest && identity===getIdentity()){
        status.textContent="Could not connect to local Julia: "+String(error.message||error);
      }
    }finally{
      if(request===activeRequest){busy=false;run.disabled=false;}
    }
  }
  run.addEventListener("click",submit);
  doc.querySelector("#local-runner-clear").addEventListener("click",clear);
  return {clear,run:submit};
}
