import {DERIVATIVE_POINTS,DERIVATIVE_METHODS,MIN_EXPONENT,MAX_EXPONENT,derivativeSeries,compareAt,formatExperimentNumber,derivativeJuliaSource} from "./precision-model.js";
const KEY="amp-julia-lab:precision:v1";
const DEFAULT={x:1,k:3};
const $=id=>document.getElementById(id),NS="http://www.w3.org/2000/svg";
let state={...DEFAULT};
export function readPrecisionSettings(storage=globalThis.localStorage){
  try{
    const raw=JSON.parse(storage.getItem(KEY)||"null");
    return {x:typeof raw?.x==="number"&&Object.values(DERIVATIVE_POINTS).includes(raw.x)?raw.x:DEFAULT.x,
      k:Number.isInteger(raw?.k)&&raw.k>=MIN_EXPONENT&&raw.k<=MAX_EXPONENT?raw.k:DEFAULT.k};
  }catch{return {...DEFAULT};}
}
export function savePrecisionSettings(next,storage=globalThis.localStorage){
  if(!Object.values(DERIVATIVE_POINTS).includes(next?.x)||!Number.isInteger(next?.k)||next.k<MIN_EXPONENT||next.k>MAX_EXPONENT)return false;
  try{storage.setItem(KEY,JSON.stringify(next));return true;}catch{return false;}
}
const el=(tag,attributes)=>{const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attributes))e.setAttribute(k,String(v));return e;};
const methods=Object.keys(DERIVATIVE_METHODS);
function drawChart(data,k){
  const svg=$("precision-chart"),group=$("precision-chart-content");
  group.replaceChildren();
  // Y is log10 of absolute error; zero cannot be put on logarithmic scale.
  const left=38,right=535,top=18,bottom=207;
  const min=-17,max=0;
  const X=index=>left+(index/(MAX_EXPONENT-MIN_EXPONENT))*(right-left);
  const Y=err=>top+((max-Math.max(min,Math.min(max,Math.log10(err))))/(max-min))*(bottom-top);
  for(let n=0;n<=16;n+=4){
    const y=top+(n/17)*(bottom-top);
    group.append(el("line",{x1:left,x2:right,y1:y,y2:y,class:"precision-grid"}));
    const label=el("text",{x:left-6,y:y+4,"text-anchor":"end",class:"precision-tick"});
    label.textContent=n===0?"10⁰":"10⁻"+n;group.append(label);
  }
  for(const n of [1,4,8,12,16]){
    const label=el("text",{x:X(n-1),y:225,"text-anchor":"middle",class:"precision-tick"});
    label.textContent=String(n);group.append(label);
  }
  const chosenX=X(k-MIN_EXPONENT);
  group.append(el("line",{x1:chosenX,x2:chosenX,y1:top,y2:bottom,class:"precision-selection"}));
  for(const method of methods){
    let segment=[];
    const flush=()=>{
      if(segment.length)group.append(el("polyline",{points:segment.map(p=>p.join(",")).join(" "),class:"precision-line precision-"+method,fill:"none"}));
      segment=[];
    };
    for(let i=0;i<data.length;i++){
      const value=data[i].errors[method];
      if(value>0&&Number.isFinite(value)){
        const point=[X(i),Y(value)];
        segment.push(point);
        if(data[i].k===k)group.append(el("circle",{cx:point[0],cy:point[1],r:3.2,class:"precision-point precision-"+method}));
      }else flush();
    }
    flush();
  }
  const title=svg.querySelector("title");
  title.textContent="Absolute error of derivative estimates versus h = 10^-k, with selected k="+k+". Zero rounded errors omitted from logarithmic plot.";
}
function renderTable(row){
  const body=$("precision-comparison");
  body.replaceChildren();
  for(const method of methods){
    const tr=document.createElement("tr");
    tr.className="precision-row-"+method;
    const cells=[DERIVATIVE_METHODS[method],formatExperimentNumber(row.approximations[method]),
      formatExperimentNumber(row.errors[method]),row.rates[method]===null?"—":formatExperimentNumber(row.rates[method])];
    cells.forEach((value,i)=>{
      const td=document.createElement(i===0?"th":"td");
      if(i===0)td.scope="row";
      td.textContent=value;tr.append(td);
    });
    body.append(tr);
  }
}
function render(){
  const data=derivativeSeries(state.x),row=data[state.k-MIN_EXPONENT];
  $("precision-x").value=String(state.x);
  $("precision-step").value=String(state.k);
  $("precision-k").textContent=String(state.k);
  $("precision-h").textContent=row.h.toExponential(0);
  $("precision-reference").textContent=formatExperimentNumber(row.reference);
  $("precision-problem").textContent="f(x) = sin(x), f'(x) = cos(x) at x = "+state.x;
  const small=row.xPlusUnchanged?
    "x + h rounds to x in binary64; the forward numerator is zero.":row.xMinusUnchanged?
    "x − h rounds to x in binary64; the subtraction is unresolved.":state.k>=10?
    "Subtraction of nearby floating-point values may lose significant digits.":"Compare observed errors as h decreases; smaller h need not always improve accuracy.";
  $("precision-warning").textContent=small;
  $("precision-rate-definition").textContent="Observed order = log₁₀(E(10h) / E(h)); negative means the error grew. “—” indicates unavailable or zero rounded error.";
  $("precision-julia").textContent=derivativeJuliaSource(state.x,state.k);
  drawChart(data,state.k);
  renderTable(row);
}
function saveAndRender(){
  $("precision-save-status").textContent=savePrecisionSettings(state)?"":"Could not save experiment settings in this browser.";
  render();
}
export function initPrecisionLab(){
  state=readPrecisionSettings();
  $("precision-x").addEventListener("change",()=>{state.x=Number($("precision-x").value);saveAndRender();});
  $("precision-step").addEventListener("input",()=>{state.k=Number($("precision-step").value);saveAndRender();});
  $("precision-reset").addEventListener("click",()=>{state={...DEFAULT};saveAndRender();});
  $("precision-copy").addEventListener("click",async()=>{
    try{
      await navigator.clipboard.writeText(derivativeJuliaSource(state.x,state.k));
      $("precision-copy-status").textContent="Julia example copied. Run it in an external Julia compiler to compare results.";
    }catch{
      $("precision-copy-status").textContent="Clipboard unavailable. Select the Julia code and copy it manually.";
    }
  });
  render();
}
export function showPrecisionLab(id){$("precision-lab").hidden=!["09","10"].includes(id);}
