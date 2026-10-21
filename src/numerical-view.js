// Native SVG visualization of exact 2D linear-algebra formulas using JS Numbers.
// No code execution, grading, JDoodle messaging, or learner-record writes.
import {explore,matrixPresets,normNames,displayNumber} from "./numerical-model.js";
const KEY="amp-julia-lab:numerical-explorer:v1";
const fallback={kind:"two",matrix:"stretch",x:1,y:1};
let settings={...fallback};
const $=id=>document.getElementById(id);
const NS="http://www.w3.org/2000/svg";
function svgElement(name,attrs){
  const element=document.createElementNS(NS,name);
  for(const [key,value] of Object.entries(attrs))element.setAttribute(key,String(value));
  return element;
}
function renderLine(group,x1,y1,x2,y2,className){
  group.append(svgElement("line",{x1,y1:-y1,x2,y2:-y2,class:className}));
}
function pointsPath(points){
  return points.map((p,i)=>(i?"L":"M")+p[0].toFixed(4)+" "+(-p[1]).toFixed(4)).join(" ");
}
function drawVector(group,point,classname){
  renderLine(group,0,0,point[0],point[1],classname+"-line");
  group.append(svgElement("circle",{cx:point[0],cy:-point[1],r:0.17,class:classname}));
}
export function settingsFromStorage(storage=globalThis.localStorage){
  try{
    const raw=JSON.parse(storage.getItem(KEY)||"null");
    if(raw&&typeof raw==="object" && !Array.isArray(raw)){
      const kind=Object.hasOwn(normNames,raw.kind)?raw.kind:fallback.kind;
      const matrix=Object.hasOwn(matrixPresets,raw.matrix)?raw.matrix:fallback.matrix;
      const x=typeof raw.x==="number"&&Number.isFinite(raw.x)&&raw.x>=-3&&raw.x<=3?raw.x:fallback.x;
      const y=typeof raw.y==="number"&&Number.isFinite(raw.y)&&raw.y>=-3&&raw.y<=3?raw.y:fallback.y;
      return {kind,matrix,x,y};
    }
  }catch{}
  return {...fallback};
}
export function saveExperiment(settings,storage=globalThis.localStorage){
  try{storage.setItem(KEY,JSON.stringify(settings));return true;}catch{return false;}
}
function redraw(){
  const data=explore(settings);
  const svg=$("numerical-plot"),group=$("numerical-plot-content");
  if(!svg||!group)return;
  group.replaceChildren();
  const grid=svgElement("g",{class:"numeric-grid"});
  for(let i=-6;i<=6;i++){
    renderLine(grid,i,-7,i,7,i===0?"axis":"gridline");
    renderLine(grid,-7,i,7,i,i===0?"axis":"gridline");
  }
  group.append(grid);
  group.append(svgElement("path",{d:pointsPath(data.reference),class:"numeric-reference"}));
  group.append(svgElement("path",{d:pointsPath(data.direct),class:"numeric-direct"}));
  if(data.inverseImage)group.append(svgElement("path",{d:pointsPath(data.inverseImage),class:"numeric-inverse"}));
  drawVector(group,data.input,"numeric-vector-input");
  drawVector(group,data.output,"numeric-vector-output");
  const coords=v=>"("+v.map(displayNumber).join(", ")+")";
  $("num-vector").textContent=coords(data.input);
  $("num-mapped").textContent=coords(data.output);
  $("num-length").textContent=displayNumber(data.inputNorm);
  $("num-mapped-length").textContent=displayNumber(data.outputNorm);
  $("num-determinant").textContent=displayNumber(data.det);
  $("num-norm-name").textContent=normNames[data.kind];
  $("num-norm-mapped-name").textContent=normNames[data.kind];
  $("num-matrix-name").textContent=matrixPresets[data.matrix].label;
  $("num-x-value").textContent=displayNumber(data.input[0]);
  $("num-y-value").textContent=displayNumber(data.input[1]);
  $("num-inverse-state").textContent=data.invertible
    ?"Inverse image shown: the set of v with ||A·v|| = 1."
    :"A is singular: no inverse exists; ||A·v|| is not a norm.";
  $("num-inverse-legend").hidden=!data.invertible;
  svg.querySelector("title").textContent=
    "Norm boundary, direct image and "+(data.invertible?"inverse image":"non-invertible transformation")+
    "; input v="+coords(data.input)+", A·v="+coords(data.output);
}
export function initNumericalExplorer(){
  settings=settingsFromStorage();
  $("num-norm").value=settings.kind;
  $("num-matrix").value=settings.matrix;
  $("num-x").value=String(settings.x);
  $("num-y").value=String(settings.y);
  for(const [id,prop] of [["num-norm","kind"],["num-matrix","matrix"],["num-x","x"],["num-y","y"]]){
    const el=$(id);
    el.addEventListener(prop==="x"||prop==="y"?"input":"change",()=>{
      settings[prop]=(prop==="x"||prop==="y")?Number(el.value):el.value;
      $("num-storage-status").textContent=saveExperiment(settings)?"":"Experiment settings could not be saved in this browser.";
      redraw();
    });
  }
  $("num-reset").addEventListener("click",()=>{
    settings={...fallback};
    $("num-norm").value=settings.kind;
    $("num-matrix").value=settings.matrix;
    $("num-x").value=String(settings.x);
    $("num-y").value=String(settings.y);
    $("num-storage-status").textContent=saveExperiment(settings)?"":"Experiment settings could not be saved in this browser.";
    redraw();
  });
  redraw();
}
export function showNumericalExplorer(lessonId){
  const section=$("numerical-explorer");
  if(section)section.hidden=!["05","06"].includes(lessonId);
}
