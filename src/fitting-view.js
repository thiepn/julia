// Visual least-squares teaching lab. All calculations remain local JavaScript.
import {fittingDatasets,DEFAULT_FIT,validFitSettings,analyzeFit,formatFitNumber,fitJuliaExample} from "./fitting-model.js";
const KEY="amp-julia-lab:fit:v1";
const NS="http://www.w3.org/2000/svg";
const $=id=>document.getElementById(id);
let settings={...DEFAULT_FIT};
export function readFitSettings(storage=globalThis.localStorage){
  try{
    const value=JSON.parse(storage.getItem(KEY)||"null");
    return validFitSettings(value)?{...value}:{...DEFAULT_FIT};
  }catch{return {...DEFAULT_FIT};}
}
export function writeFitSettings(settings,storage=globalThis.localStorage){
  if(!validFitSettings(settings))return false;
  try{storage.setItem(KEY,JSON.stringify(settings));return true;}catch{return false;}
}
function svgNode(name,attrs={}){
  const node=document.createElementNS(NS,name);
  for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));
  return node;
}
function draw(data){
  const svg=$("fit-chart"),g=$("fit-chart-content");
  g.replaceChildren();
  const [left,right,top,bottom]=[50,570,14,296];
  const xs=data.points.map(p=>p[0]),xMin=Math.min(...xs)-0.65,xMax=Math.max(...xs)+0.65;
  const lineEndpoints=(intercept,slope)=>[intercept+slope*xMin,intercept+slope*xMax];
  const values=[...data.points.map(p=>p[1]),...lineEndpoints(data.intercept,data.slope),
    ...lineEndpoints(data.reference.intercept,data.reference.slope)];
  const low=Math.min(...values),high=Math.max(...values),pad=Math.max(1,(high-low)*0.13);
  const yMin=low-pad,yMax=high+pad;
  const px=x=>left+((x-xMin)/(xMax-xMin))*(right-left);
  const py=y=>bottom-((y-yMin)/(yMax-yMin))*(bottom-top);
  for(let k=0;k<=4;k++){
    const y=top+k*(bottom-top)/4;
    g.append(svgNode("line",{x1:left,x2:right,y1:y,y2:y,class:"fit-grid"}));
    const text=svgNode("text",{x:left-7,y:y+4,"text-anchor":"end",class:"fit-tick"});
    text.textContent=formatFitNumber(yMax-k*(yMax-yMin)/4);g.append(text);
  }
  for(const x of new Set(xs)){
    const label=svgNode("text",{x:px(x),y:318,"text-anchor":"middle",class:"fit-tick"});
    label.textContent=String(x);g.append(label);
  }
  if(data.showResiduals){
    for(const point of data.residuals){
      g.append(svgNode("line",{x1:px(point.x),x2:px(point.x),y1:py(point.y),y2:py(point.predicted),class:"fit-residual"}));
    }
  }
  const drawLine=(intercept,slope,clazz)=>{
    g.append(svgNode("line",{x1:px(xMin),x2:px(xMax),y1:py(intercept+slope*xMin),y2:py(intercept+slope*xMax),class:clazz}));
  };
  drawLine(data.reference.intercept,data.reference.slope,"fit-reference-line");
  drawLine(data.intercept,data.slope,"fit-candidate-line");
  for(const [x,y] of data.points)g.append(svgNode("circle",{cx:px(x),cy:py(y),r:4.5,class:"fit-observation"}));
  svg.querySelector("title").textContent="Least-squares data and current line; "+
    (data.reference.unique?"unique least-squares comparison":"one of multiple least-squares minimizers")+
    ". Squared residual sum "+formatFitNumber(data.sse)+".";
}
function renderTable(data){
  const tbody=$("fit-data-rows");
  tbody.replaceChildren();
  for(const point of data.residuals){
    const tr=document.createElement("tr");
    for(const value of [point.x,point.y,point.predicted,point.residual]){
      const cell=document.createElement("td");cell.textContent=formatFitNumber(value);tr.append(cell);
    }
    tbody.append(tr);
  }
}
function render(){
  const result=analyzeFit(settings);
  $("fit-dataset").value=settings.dataset;
  $("fit-intercept").value=String(settings.intercept);
  $("fit-slope").value=String(settings.slope);
  $("fit-residuals").checked=settings.showResiduals;
  $("fit-intercept-value").textContent=formatFitNumber(settings.intercept);
  $("fit-slope-value").textContent=formatFitNumber(settings.slope);
  $("fit-sse").textContent=formatFitNumber(result.sse);
  $("fit-norm").textContent=formatFitNumber(result.residualNorm);
  $("fit-gradient").textContent="("+result.gradient.map(formatFitNumber).join(", ")+")";
  $("fit-optimum-sse").textContent=formatFitNumber(result.reference.minimumSSE);
  $("fit-gap").textContent=formatFitNumber(result.optimalityGap);
  $("fit-reference-title").textContent=result.reference.unique?"Unique least-squares fit":"No unique coefficient vector";
  $("fit-reference-text").textContent=result.reference.unique
    ? "Intercept "+formatFitNumber(result.reference.intercept)+", slope "+formatFitNumber(result.reference.slope)
    : "All intercept/slope pairs with intercept + "+formatFitNumber(result.reference.atX)+"·slope = "+
      formatFitNumber(result.reference.targetMean)+" minimize SSE. The dashed horizontal line shows one of them.";
  $("fit-apply").disabled=!result.reference.unique;
  $("fit-julia").textContent=fitJuliaExample(settings.dataset);
  draw(result);renderTable(result);
}
function changed(){
  $("fit-storage-status").textContent=writeFitSettings(settings)?"":"Settings could not be saved in this browser.";
  render();
}
export function initFittingLab(){
  settings=readFitSettings();
  $("fit-dataset").addEventListener("change",()=>{settings.dataset=$("fit-dataset").value;changed();});
  for(const field of ["intercept","slope"]){
    $("fit-"+field).addEventListener("input",()=>{
      settings[field]=Number($("fit-"+field).value);changed();
    });
  }
  $("fit-residuals").addEventListener("change",()=>{settings.showResiduals=$("fit-residuals").checked;changed();});
  $("fit-apply").addEventListener("click",()=>{
    const ref=analyzeFit(settings).reference;
    if(!ref.unique)return;
    settings.intercept=Math.max(-3,Math.min(6,Math.round(ref.intercept*100)/100));
    settings.slope=Math.max(-1,Math.min(5,Math.round(ref.slope*100)/100));
    changed();
    $("fit-apply-feedback").textContent="Rounded to slider precision (0.01). Exact least-squares coefficients appear in the comparison above.";
  });
  $("fit-reset").addEventListener("click",()=>{
    settings={...DEFAULT_FIT};changed();
    $("fit-apply-feedback").textContent="";
  });
  $("fit-copy").addEventListener("click",async()=>{
    try{
      await navigator.clipboard.writeText(fitJuliaExample(settings.dataset));
      $("fit-copy-status").textContent="Julia example copied. Run it externally to compare results.";
    }catch{
      $("fit-copy-status").textContent="Clipboard unavailable. Select the Julia example and copy manually.";
    }
  });
  render();
}
export function showFittingLab(lessonId){
  $("fitting-lab").hidden=lessonId!=="15";
}
