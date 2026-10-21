import {filenameStem,verifyPdf,bundleEntries,makeZip} from "./submission-package.js";
export function initSubmissionWorkflow({doc=document,download,getDraft,getIdentity,
  embedActive=()=>true,disableEmbed=()=>{}}={}){
  if(typeof download!=="function"||typeof getDraft!=="function"||typeof getIdentity!=="function")
    throw Error("Submission needs the existing download and draft actions.");
  const el=id=>doc.getElementById(id),form=el("submission-workflow");
  const name=el("submission-name"),number=el("submission-number"),task=el("submission-task");
  const pdfInput=el("submission-pdf"),confirm=el("submission-confirm");
  const status=el("submission-status"),list=el("submission-items");
  const includeResults=el("submission-include-results"),runStatus=el("submission-run-state");
  const restricted=embedActive();
  const privateStatus=el("submission-private-state");
  privateStatus.textContent=restricted
    ?"Disable JDoodle and reload before entering your name or matriculation number."
    :"Submission fields stay in this browser session; no automatic upload.";
  form.querySelectorAll("input,select,button").forEach(control=>{
    if(control.id!=="submission-disable-embed")control.disabled=restricted;
  });
  el("submission-disable-embed").hidden=!restricted;
  el("submission-disable-embed").addEventListener("click",disableEmbed);
  const printSheet=el("submission-print"),printTitle=el("submission-print-title");
  const printSource=el("submission-print-source"),printMeta=el("submission-print-meta");
  let prepared=null,lastRun=null,staged=[],beforePrintTitle=null;
  const context=()=>({code:getDraft(),identity:getIdentity()});
  function validContext(){
    const {code,identity}=context();
    if(!code||!code.trim()||new TextEncoder().encode(code).length>50000)
      throw Error("Write a Julia program in the existing editor (maximum 50 KB).");
    const stem=filenameStem({name:name.value,number:number.value,task:task.value});
    return {code,identity,stem};
  }
  function showItems(){
    list.replaceChildren();
    for(const [index,pair] of staged.entries()){
      const li=doc.createElement("li"),text=doc.createElement("span"),remove=doc.createElement("button");
      text.textContent=pair.stem+".jl + .pdf"+(pair.results?" + local results":"");
      remove.textContent="Remove";remove.type="button";remove.className="secondary";
      remove.setAttribute("aria-label","Remove "+pair.stem+" from ZIP");
      remove.addEventListener("click",()=>{staged.splice(index,1);showItems();status.textContent="Pair removed from in-memory bundle.";});
      li.append(text,remove);list.append(li);
    }
    el("submission-download-zip").disabled=staged.length===0;
    el("submission-count").textContent=staged.length+" code/PDF pair"+(staged.length===1?"":"s")+" ready";
  }
  function refreshRun(){
    const {code,identity}=context();
    const valid=lastRun&&lastRun.identity===identity&&lastRun.code===code&&lastRun.ok;
    runStatus.textContent=valid?"Successful local Julia execution available: "+
      lastRun.figures.length+" figure(s) and actual stdout/stderr.":
      "No successful local execution for the current draft.";
    includeResults.disabled=!valid;
    if(!valid)includeResults.checked=false;
  }
  function invalidateRun(){lastRun=null;refreshRun();}
  function onRun({code,identity,ok,stdout,stderr,figures}){
    lastRun={code,identity,ok:ok===true,
      output:["Julia execution (local; not graded)",stdout?"stdout:\n"+stdout:"",
        stderr?"stderr:\n"+stderr:""].filter(Boolean).join("\n\n"),
      figures:(figures||[]).slice(0,3).map(f=>({type:f.blob.type,blob:f.blob}))};
    refreshRun();
  }
  function onSourceChange(){
    prepared=null;
    pdfInput.value="";confirm.checked=false;
    status.textContent="PDF pairing reset after the code or lesson changed.";
    invalidateRun();
  }
  const resetPending=()=>{prepared=null;pdfInput.value="";confirm.checked=false;};
  doc.defaultView.addEventListener("afterprint",()=>{
    if(beforePrintTitle!==null){doc.title=beforePrintTitle;beforePrintTitle=null;}
  });
  el("submission-print-button").addEventListener("click",()=>{
    try{
      const snapshot=validContext();
      prepared={...snapshot,task:task.value.trim(),name:name.value.trim(),number:number.value.trim()};
      pdfInput.value="";confirm.checked=false;
      printTitle.textContent=snapshot.stem+".jl";
      printMeta.textContent="AMP WS 2026/27 · Übung "+prepared.task[0]+" · Aufgabe "+prepared.task;
      printSource.textContent=snapshot.code;
      beforePrintTitle=doc.title;
      doc.title=snapshot.stem;
      doc.defaultView.print();
      status.textContent="Save as PDF, then select that PDF below. The browser cannot read the print dialog.";
    }catch(error){status.textContent=error.message;}
  });
  for(const input of [name,number,task])input.addEventListener("input",()=>{
    resetPending();status.textContent="Filename changed. Print a PDF for the updated filename.";
  });
  el("submission-stage").addEventListener("click",async()=>{
    try{
      const snapshot=validContext();
      if(!prepared||snapshot.code!==prepared.code||snapshot.identity!==prepared.identity||
        snapshot.stem!==prepared.stem||task.value.trim()!==prepared.task)
        throw Error("Print the PDF from this exact current source before staging it.");
      if(!confirm.checked)throw Error("Confirm that the selected PDF contains the code shown in the print preview.");
      const pdf=await verifyPdf(pdfInput.files?.[0]);
      // Recheck after asynchronous reading; no stale filename or editor state.
      const now=validContext();
      if(now.code!==prepared.code||now.identity!==prepared.identity||now.stem!==prepared.stem)
        throw Error("The code or filename changed during PDF verification.");
      if(staged.length>=8)throw Error("Maximum eight Julia/PDF pairs per ZIP.");
      if(staged.some(p=>p.stem.toLowerCase()===snapshot.stem.toLowerCase()))
        throw Error("That task filename is already in the bundle. Remove it before replacing.");
      const results=includeResults.checked&&lastRun&&lastRun.ok&&
        lastRun.code===snapshot.code&&lastRun.identity===snapshot.identity
        ?{output:lastRun.output,figures:lastRun.figures.map(f=>({...f}))}:null;
      if(includeResults.checked&&!results)throw Error("Run the current source successfully before including results.");
      staged.push({stem:snapshot.stem,code:snapshot.code,pdf,results});
      showItems();resetPending();
      status.textContent="Pair staged locally. Add another task or download the ZIP.";
    }catch(error){status.textContent=error.message;}
  });
  el("submission-download-zip").addEventListener("click",async()=>{
    try{
      const contents=await bundleEntries(staged);
      const zip=await makeZip(contents);
      const kind=[...new Set(staged.map(p=>p.stem.match(/Aufgabe-([12])-/)?.[1]))];
      const prefix=kind.length===1?"AMP_Uebung-"+kind[0]:"AMP_Uebungen";
      download({filename:prefix+"_Julia_Abgabe.zip",mime:"application/zip",content:zip});
      status.textContent="ZIP downloaded. Check the files, code PDF and submission requirements before uploading to ILIAS.";
    }catch(error){status.textContent="ZIP not created: "+error.message;}
  });
  el("submission-clear").addEventListener("click",()=>{
    staged=[];resetPending();showItems();status.textContent="In-memory submission bundle cleared.";
  });
  showItems();refreshRun();
  if(restricted)el("submission-download-zip").disabled=true;
  return {onSourceChange,onRun,invalidateRun,stagedCount:()=>staged.length};
}
