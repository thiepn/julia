// Step-by-step original matrix factorization examples, browser-side only.
import {FACTORIZATION_CASES,FACTORIZATION_MODES,factorTrace,fmt,juliaFactorExample} from "./factor-model.js";
const KEY="amp-julia-lab:factor:v1";
const $=id=>document.getElementById(id);
const DEFAULT=Object.freeze({caseId:"spd",mode:"qr"});
let settings={...DEFAULT},trace=null,stepIndex=0;
export function readFactorSettings(storage=globalThis.localStorage){
  try{
    const item=JSON.parse(storage.getItem(KEY)||"null");
    return {caseId:Object.hasOwn(FACTORIZATION_CASES,item?.caseId)?item.caseId:DEFAULT.caseId,
      mode:Object.hasOwn(FACTORIZATION_MODES,item?.mode)?item.mode:DEFAULT.mode};
  }catch{return {...DEFAULT};}
}
export function saveFactorSettings(value,storage=globalThis.localStorage){
  if(!Object.hasOwn(FACTORIZATION_CASES,value?.caseId)||!Object.hasOwn(FACTORIZATION_MODES,value?.mode))return false;
  try{storage.setItem(KEY,JSON.stringify(value));return true;}catch{return false;}
}
function matrixToDom(id,matrix){
  const tbody=$(id);
  tbody.replaceChildren();
  matrix.forEach(row=>{
    const tr=document.createElement("tr");
    row.forEach(n=>{
      const td=document.createElement("td");
      td.textContent=fmt(n);
      tr.append(td);
    });
    tbody.append(tr);
  });
}
function redraw(){
  const step=trace.steps[stepIndex],atEnd=stepIndex===trace.steps.length-1;
  $("factor-progress").textContent="Step "+(stepIndex+1)+" of "+trace.steps.length;
  $("factor-operation").textContent=step.operation;
  $("factor-explanation").textContent=step.note;
  matrixToDom("factor-a",trace.a);
  matrixToDom("factor-left",settings.mode==="qr"?step.q:step.l);
  matrixToDom("factor-right",step.r);
  $("factor-left-label").textContent=settings.mode==="qr"?"Q":"L";
  $("factor-right-group").hidden=settings.mode!=="qr";
  $("factor-first").disabled=stepIndex===0;
  $("factor-prev").disabled=stepIndex===0;
  $("factor-next").disabled=atEnd;
  $("factor-last").disabled=atEnd;
  $("factor-result").hidden=!atEnd;
  if(atEnd){
    if(trace.status==="complete"){
      $("factor-status").textContent="Factorization completed for this 2×2 example.";
      $("factor-reconstruction").textContent="||A − "+(settings.mode==="qr"?"QR":"LL'")+"||F = "+fmt(trace.metrics.reconstruction);
      $("factor-orthogonality").hidden=settings.mode!=="qr";
      $("factor-orthogonality").textContent=settings.mode==="qr"?"||Q'Q − I||F = "+fmt(trace.metrics.orthogonality):"";
      $("factor-warning").textContent=settings.mode==="qr"&&trace.metrics.orthogonality>1e-9
        ?"Computed Q is noticeably nonorthogonal in binary64 for nearly dependent columns; a small reconstruction error alone is insufficient.":"";
    }else{
      $("factor-status").textContent="Factorization stopped: "+trace.status.replaceAll("-"," ")+".";
      $("factor-reconstruction").textContent="";
      $("factor-orthogonality").hidden=true;
      $("factor-warning").textContent=trace.reason;
    }
  }
}
function resetTrace(){
  trace=factorTrace(settings.caseId,settings.mode);
  stepIndex=0;
  $("factor-julia").textContent=juliaFactorExample(settings.caseId,settings.mode);
  $("factor-save-status").textContent=saveFactorSettings(settings)?"":"Could not save settings in this browser.";
  redraw();
}
export function initFactorLab(){
  settings=readFactorSettings();
  $("factor-case").value=settings.caseId;
  $("factor-method").value=settings.mode;
  $("factor-case").addEventListener("change",()=>{settings.caseId=$("factor-case").value;resetTrace();});
  $("factor-method").addEventListener("change",()=>{settings.mode=$("factor-method").value;resetTrace();});
  $("factor-prev").addEventListener("click",()=>{if(stepIndex>0){stepIndex--;redraw();}});
  $("factor-next").addEventListener("click",()=>{if(stepIndex<trace.steps.length-1){stepIndex++;redraw();}});
  $("factor-first").addEventListener("click",()=>{stepIndex=0;redraw();});
  $("factor-last").addEventListener("click",()=>{stepIndex=trace.steps.length-1;redraw();});
  $("factor-reset").addEventListener("click",()=>{
    settings={...DEFAULT};
    $("factor-case").value=settings.caseId;
    $("factor-method").value=settings.mode;
    resetTrace();
  });
  $("factor-copy").addEventListener("click",async()=>{
    try{
      await navigator.clipboard.writeText(juliaFactorExample(settings.caseId,settings.mode));
      $("factor-copy-status").textContent="Julia example copied; run it separately to verify Julia behavior.";
    }catch{
      $("factor-copy-status").textContent="Clipboard unavailable. Select the Julia code and copy it manually.";
    }
  });
  trace=factorTrace(settings.caseId,settings.mode);
  $("factor-julia").textContent=juliaFactorExample(settings.caseId,settings.mode);
  redraw();
}
export function showFactorLab(lessonId){$("factor-lab").hidden=lessonId!=="14";}
