// Browser-only Lesson 16 conditioning explorer; never updates lesson mastery.
import {DIAGONAL_SCALES,PERTURBATIONS,RHS_PRESETS,DEFAULT_SENSITIVITY,
  validSensitivity,sensitivitySample,sensitivityComparison,numericalString,conditioningJuliaExample} from "./sensitivity-model.js";
const KEY="amp-julia-lab:sensitivity:v1";
const $=id=>document.getElementById(id), NS="http://www.w3.org/2000/svg";
let settings={...DEFAULT_SENSITIVITY};
export function readSensitivitySettings(storage=globalThis.localStorage){
  try{
    const value=JSON.parse(storage.getItem(KEY)||"null");
    return validSensitivity(value)?{...value}:{...DEFAULT_SENSITIVITY};
  }catch{return {...DEFAULT_SENSITIVITY};}
}
export function writeSensitivitySettings(value,storage=globalThis.localStorage){
  if(!validSensitivity(value))return false;
  try{storage.setItem(KEY,JSON.stringify(value));return true;}catch{return false;}
}
function makeSvg(tag,attributes={}){
  const node=document.createElementNS(NS,tag);
  for(const [name,value] of Object.entries(attributes))node.setAttribute(name,String(value));
  return node;
}
function comparisonPlot(rows){
  const svg=$("sensitivity-chart"),content=$("sensitivity-plot");
  content.replaceChildren();
  const left=76,right=565,top=16,bottom=198;
  const valid=rows.filter(row=>row.errorNorm>0);
  const exponents=valid.map(r=>Math.log10(r.errorNorm));
  const lo=valid.length?Math.floor(Math.min(...exponents))-0.5:-7;
  const hi=valid.length?Math.ceil(Math.max(...exponents))+0.5:1;
  const X=i=>left+(right-left)*i/(rows.length-1);
  const Y=value=>bottom-(Math.log10(value)-lo)/(hi-lo)*(bottom-top);
  for(let i=0;i<=4;i++){
    const y=top+i*(bottom-top)/4, exp=hi-i*(hi-lo)/4;
    content.append(makeSvg("line",{x1:left,y1:y,x2:right,y2:y,class:"sensitivity-grid"}));
    const label=makeSvg("text",{x:left-8,y:y+4,"text-anchor":"end",class:"sensitivity-chart-label"});
    label.textContent="10^"+numericalString(exp);content.append(label);
  }
  for(const [i,item] of rows.entries()){
    const label=makeSvg("text",{x:X(i),y:220,"text-anchor":"middle",class:"sensitivity-chart-label"});
    label.textContent=numericalString(item.scale);content.append(label);
  }
  if(valid.length){
    const points=rows.map((r,i)=>r.errorNorm>0?[X(i),Y(r.errorNorm)]:null).filter(Boolean);
    if(points.length>1)content.append(makeSvg("polyline",{points:points.map(p=>p.join(",")).join(" "),class:"sensitivity-line"}));
    rows.forEach((r,i)=>{
      if(r.errorNorm>0)content.append(makeSvg("circle",{
        cx:X(i),cy:Y(r.errorNorm),r:DIAGONAL_SCALES[i]===settings.scale?6:3.5,
        class:DIAGONAL_SCALES[i]===settings.scale?"sensitivity-point selected":"sensitivity-point"}));
    });
  }
  svg.querySelector("title").textContent="Calculated absolute solution changes versus diagonal scale. "+
    (valid.length?"Logarithmic vertical scale.":"Zero perturbation; all changes are zero and cannot be plotted on a logarithmic scale.");
  $("sensitivity-chart-note").textContent=valid.length
    ?"Vertical: log scale of ||x̃ − x||₂. Horizontal: second diagonal entry."
    :"Zero perturbation produces no solution change; logarithmic values are undefined at zero.";
}
function renderComparison(rows){
  const tbody=$("sensitivity-comparison");
  tbody.replaceChildren();
  rows.forEach(row=>{
    const tr=document.createElement("tr");
    if(row.scale===settings.scale)tr.className="sensitivity-selected";
    const cells=[row.scale,row.conditionNumber,row.errorNorm,row.relativeSolution,row.amplification];
    cells.forEach((value,i)=>{
      const cell=document.createElement(i===0?"th":"td");
      if(i===0)cell.scope="row";
      cell.textContent=numericalString(value);
      tr.append(cell);
    });
    tbody.append(tr);
  });
}
function render(){
  const d=sensitivitySample(settings),rows=sensitivityComparison({delta:settings.delta,rhs:settings.rhs});
  $("sensitivity-scale").value=String(settings.scale);
  $("sensitivity-delta").value=String(settings.delta);
  $("sensitivity-rhs").value=settings.rhs;
  $("sensitivity-matrix").textContent="A = diag(1, "+numericalString(d.scale)+")";
  $("sensitivity-b").textContent="b = ["+d.b.join(", ")+"]";
  $("sensitivity-deltab").textContent="δb = [0, "+numericalString(d.delta)+"]";
  $("sensitivity-x").textContent="["+d.x.map(numericalString).join(", ")+"]";
  $("sensitivity-xnew").textContent="["+d.xPerturbed.map(numericalString).join(", ")+"]";
  $("sensitivity-dx").textContent="["+d.solutionDifference.map(numericalString).join(", ")+"]";
  $("sensitivity-absolute").textContent=numericalString(d.errorNorm);
  $("sensitivity-residual").textContent=numericalString(d.residualOriginalNorm);
  $("sensitivity-residual-perturbed").textContent=numericalString(d.residualPerturbedNorm);
  $("sensitivity-relb").textContent=numericalString(d.relativeData);
  $("sensitivity-relx").textContent=numericalString(d.relativeSolution);
  $("sensitivity-cond").textContent=numericalString(d.conditionNumber);
  $("sensitivity-bound").textContent=numericalString(d.relativeBound);
  $("sensitivity-amplification").textContent=numericalString(d.amplification);
  $("sensitivity-direction").textContent=d.delta===0
    ?"No perturbation was applied; the amplification ratio is undefined."
    :settings.rhs==="exercise"?
      "For this b, the observed relative amplification need not approach κ₂(A), even when the absolute solution change grows."
      :"Here the right-hand side lies along the stable coordinate, while δb points along the sensitive coordinate. The observed relative amplification reaches κ₂(A) in exact arithmetic.";
  $("sensitivity-julia").textContent=conditioningJuliaExample(settings);
  renderComparison(rows);
  comparisonPlot(rows);
}
function onChange(){
  $("sensitivity-storage").textContent=writeSensitivitySettings(settings)?"":"Experiment settings could not be saved in this browser.";
  render();
}
export function initSensitivityLab(){
  settings=readSensitivitySettings();
  $("sensitivity-scale").addEventListener("change",()=>{settings.scale=Number($("sensitivity-scale").value);onChange();});
  $("sensitivity-delta").addEventListener("change",()=>{settings.delta=Number($("sensitivity-delta").value);onChange();});
  $("sensitivity-rhs").addEventListener("change",()=>{settings.rhs=$("sensitivity-rhs").value;onChange();});
  $("sensitivity-reset").addEventListener("click",()=>{settings={...DEFAULT_SENSITIVITY};onChange();});
  $("sensitivity-copy").addEventListener("click",async()=>{
    try{
      await navigator.clipboard.writeText(conditioningJuliaExample(settings));
      $("sensitivity-copy-result").textContent="Julia example copied. Run in a Julia compiler to compare results.";
    }catch{
      $("sensitivity-copy-result").textContent="Clipboard unavailable. Select and copy the displayed Julia example.";
    }
  });
  render();
}
export function showSensitivityLab(lessonId){$("sensitivity-lab").hidden=lessonId!=="16";}
