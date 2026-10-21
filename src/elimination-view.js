// Gaussian-elimination walkthrough: native HTML, computed locally in JavaScript.
// Neither these steps nor the Julia sample imply execution or coding mastery.
import {linearSystems,pivotModes,eliminationTrace,juliaExample,formatEliminationNumber} from "./elimination-model.js";
const STORAGE="amp-julia-lab:elimination:v1";
const $=id=>document.getElementById(id);
const defaults={systemId:"regular",pivotMode:"partial"};
let settings={...defaults},trace=null,position=0;
export function readEliminationSettings(storage=globalThis.localStorage){
  try{
    const saved=JSON.parse(storage.getItem(STORAGE)||"null");
    return {systemId:Object.hasOwn(linearSystems,saved?.systemId)?saved.systemId:defaults.systemId,
      pivotMode:Object.hasOwn(pivotModes,saved?.pivotMode)?saved.pivotMode:defaults.pivotMode};
  }catch{return {...defaults};}
}
export function storeEliminationSettings(value,storage=globalThis.localStorage){
  if(!Object.hasOwn(linearSystems,value?.systemId)||!Object.hasOwn(pivotModes,value?.pivotMode))return false;
  try{storage.setItem(STORAGE,JSON.stringify(value));return true;}catch{return false;}
}
function renderTable(step){
  const tbody=$("elim-matrix-body");
  tbody.replaceChildren();
  step.rows.forEach((row,i)=>{
    const tr=document.createElement("tr");
    if(step.highlight.includes(i))tr.className="elim-active-row";
    const th=document.createElement("th");
    th.scope="row";th.textContent="R"+(i+1);tr.append(th);
    row.forEach((number,j)=>{
      const td=document.createElement("td");td.textContent=formatEliminationNumber(number);
      if(j===row.length-1)td.className="elim-rhs";
      if(j===step.column)td.className+=(td.className?" ":"")+"elim-pivot-column";
      tr.append(td);
    });
    tbody.append(tr);
  });
}
function renderStep(){
  const step=trace.steps[position],atEnd=position===trace.steps.length-1;
  $("elim-stage").textContent="Step "+(position+1)+" of "+trace.steps.length;
  $("elim-operation").textContent=step.description;
  renderTable(step);
  $("elim-prev").disabled=position===0;
  $("elim-next").disabled=atEnd;
  $("elim-start").disabled=position===0;
  $("elim-end").disabled=atEnd;
  $("elim-solution").hidden=!atEnd;
  if(atEnd){
    if(trace.status==="solved"){
      $("elim-solution-text").textContent="x = ["+trace.solution.map(formatEliminationNumber).join(", ")+"]";
      $("elim-residual").textContent="||A·x − b||₂ = "+formatEliminationNumber(trace.residual);
    }else{
      $("elim-solution-text").textContent=trace.status==="zero-pivot"?"Elimination stopped at a zero pivot.":"No unique solution established.";
      $("elim-residual").textContent=trace.message;
    }
  }
}
function resetTrace(){
  trace=eliminationTrace(settings.systemId,settings.pivotMode);
  position=0;
  $("elim-julia").textContent=juliaExample(settings.systemId);
  $("elim-save-status").textContent=storeEliminationSettings(settings)?"":"Could not save explorer settings in this browser.";
  renderStep();
}
export function initEliminationLab(){
  settings=readEliminationSettings();
  $("elim-system").value=settings.systemId;
  $("elim-pivot").value=settings.pivotMode;
  $("elim-system").addEventListener("change",()=>{
    settings.systemId=$("elim-system").value;resetTrace();
  });
  $("elim-pivot").addEventListener("change",()=>{
    settings.pivotMode=$("elim-pivot").value;resetTrace();
  });
  $("elim-prev").addEventListener("click",()=>{if(position>0){position--;renderStep();}});
  $("elim-next").addEventListener("click",()=>{if(position<trace.steps.length-1){position++;renderStep();}});
  $("elim-start").addEventListener("click",()=>{position=0;renderStep();});
  $("elim-end").addEventListener("click",()=>{position=trace.steps.length-1;renderStep();});
  $("elim-copy").addEventListener("click",async()=>{
    try{
      await navigator.clipboard.writeText(juliaExample(settings.systemId));
      $("elim-copy-status").textContent="Julia example copied. Run it in a Julia compiler to verify the result.";
    }catch{
      $("elim-copy-status").textContent="Clipboard unavailable. Select the Julia example text and copy it manually.";
    }
  });
  // Initial state is read from storage; do not overwrite malformed/denied storage on mount.
  trace=eliminationTrace(settings.systemId,settings.pivotMode);
  $("elim-julia").textContent=juliaExample(settings.systemId);
  renderStep();
}
export function showEliminationLab(lessonId){
  $("elimination-lab").hidden=!["12","13"].includes(lessonId);
}
