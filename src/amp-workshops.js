// AMP UE02 experiments displayed without additional grading or progress stores.
import {ROOT_CASES,ROOT_SWEEPS,rootSample,rootSweep,numberText,rootCsv,rootJuliaSource} from "./amp-root-model.js";
import {CONDITION_FUNCTIONS,CONDITION_INPUTS,CONDITION_EPS,conditionSample,conditionSweep,conditionJuliaSource} from "./amp-condition-model.js";
import {missionsForLesson,ampMission,buildAmpJuliaTests} from "./amp-missions.js";

const E=(doc,id)=>doc.getElementById(id), SVG="http://www.w3.org/2000/svg";
function populate(select,entries){
  select.replaceChildren();
  for(const [value,label] of entries){
    const option=select.ownerDocument.createElement("option");
    option.value=value;option.textContent=label;select.append(option);
  }
}
function tableRows(tbody,rows){
  const doc=tbody.ownerDocument;
  tbody.replaceChildren();
  for(const values of rows){
    const tr=doc.createElement("tr");
    for(const [index,value] of values.entries()){
      const cell=doc.createElement(index===0?"th":"td");
      if(index===0)cell.scope="row";
      cell.textContent=typeof value==="number"?numberText(value):String(value);
      tr.append(cell);
    }
    tbody.append(tr);
  }
}
function plotSweep(svg,items,label){
  const doc=svg.ownerDocument;
  svg.replaceChildren();
  const title=doc.createElementNS(SVG,"title");
  title.textContent=label+" versus perturbation size; both axes logarithmic.";
  svg.append(title);
  const good=items.filter(x=>Number.isFinite(x.metric)&&x.metric>0);
  const left=72,right=565,top=18,bottom=191;
  const xs=items.map(x=>Math.log10(x.delta));
  const ys=good.map(x=>Math.log10(x.metric));
  const xMin=Math.min(...xs),xMax=Math.max(...xs);
  let yMin=Math.min(...ys),yMax=Math.max(...ys);
  if(!Number.isFinite(yMin)){yMin=-15;yMax=1;}
  if(yMax===yMin){yMin-=1;yMax+=1;}
  const X=delta=>left+(Math.log10(delta)-xMin)/(xMax-xMin)*(right-left);
  const Y=value=>bottom-(Math.log10(value)-yMin)/(yMax-yMin)*(bottom-top);
  function node(tag,attrs,textValue){
    const el=doc.createElementNS(SVG,tag);
    for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));
    if(textValue!==undefined)el.textContent=String(textValue);
    svg.append(el);return el;
  }
  for(let i=0;i<=4;i++){
    const y=top+i*(bottom-top)/4;
    node("line",{x1:left,x2:right,y1:y,y2:y,class:"amp-grid-line"});
    node("text",{x:left-7,y:y+4,"text-anchor":"end",class:"amp-svg-label"},
      "10^"+Number((yMax-i*(yMax-yMin)/4).toFixed(1)));
  }
  items.forEach(item=>{
    const x=X(item.delta);
    node("text",{x,y:bottom+20,"text-anchor":"middle",class:"amp-svg-label"},
      "10^"+Math.round(Math.log10(item.delta)));
  });
  if(good.length){
    node("polyline",{points:good.map(p=>X(p.delta)+","+Y(p.metric)).join(" "),class:"amp-line"});
    good.forEach(p=>node("circle",{cx:X(p.delta),cy:Y(p.metric),r:4,class:"amp-point"}));
  }
}
export function initAmpWorkshops({doc=document,download,getDraft}={}){
  if(typeof download!=="function"||typeof getDraft!=="function")throw Error("Missing existing workspace actions.");
  const rootSection=E(doc,"amp-root-workshop"),conditionSection=E(doc,"amp-condition-workshop"),
    missionSection=E(doc,"amp-mission-workshop");
  const rootCases=Object.entries(ROOT_CASES).map(([id,c])=>[id,c.label]);
  const rootModes=Object.entries(ROOT_SWEEPS).map(([id,c])=>[id,c.label]);
  populate(E(doc,"amp-root-case"),rootCases);
  populate(E(doc,"amp-root-mode"),rootModes);
  populate(E(doc,"amp-condition-case"),Object.entries(CONDITION_FUNCTIONS).map(([id,c])=>[id,c.label]));
  populate(E(doc,"amp-condition-x"),CONDITION_INPUTS.map(x=>[String(x),String(x)]));
  E(doc,"amp-root-case").value="near";
  E(doc,"amp-root-mode").value="near";
  E(doc,"amp-condition-case").value="composition";
  E(doc,"amp-condition-x").value="0.8";
  let lessonId=null;
  function rootRender(){
    const selected=ROOT_CASES[E(doc,"amp-root-case").value];
    if(!selected)return;
    const example=rootSample(selected.a,selected.b);
    tableRows(E(doc,"amp-root-summary"),[
      ["a",example.a],["b",example.b],["Discriminant a² − b",example.discriminant],
      ["Direct subtraction a − √D",example.naive],
      ["Rationalized root b/(a + √D)",example.stable],
      ["Relative result discrepancy",example.relativeDiscrepancy],
      ["Relative condition in a",example.conditionA],
      ["Relative condition in b",example.conditionB]
    ]);
    const mode=E(doc,"amp-root-mode").value,rows=rootSweep(mode);
    const values=rows.map(r=>[r.delta,r.naive,r.stable,r.relativeDiscrepancy,r.conditionMax]);
    tableRows(E(doc,"amp-root-sweep-table"),values);
    plotSweep(E(doc,"amp-root-chart"),rows,
      mode==="near"?"Relative root conditioning":"Relative discrepancy between direct and rationalized roots");
    E(doc,"amp-root-chart-label").textContent=mode==="near"?
      "Horizontal: δ in b = 9 − δ. Vertical: maximum relative condition number.":
      "Horizontal: δ in b = δ. Vertical: relative difference between direct and stable root.";
    E(doc,"amp-root-julia").textContent=rootJuliaSource(mode);
  }
  function conditionRender(){
    const id=E(doc,"amp-condition-case").value,x=Number(E(doc,"amp-condition-x").value);
    if(!CONDITION_FUNCTIONS[id]||!CONDITION_INPUTS.includes(x))return;
    const sample=conditionSample(id,x,CONDITION_EPS[1]);
    E(doc,"amp-condition-formula").textContent="f(x) = "+CONDITION_FUNCTIONS[id].formula;
    E(doc,"amp-condition-kappa").textContent=numberText(sample.analytic);
    tableRows(E(doc,"amp-condition-table"),conditionSweep(id,x).map(d=>
      [d.epsilon,d.observed,d.difference]));
    E(doc,"amp-condition-julia").textContent=conditionJuliaSource(id,x);
  }
  function missionRender(){
    const mission=ampMission(E(doc,"amp-mission-choice").value);
    if(!mission)return;
    E(doc,"amp-mission-task").textContent=mission.task;
    E(doc,"amp-mission-starter").textContent=mission.starter;
    const tasks=E(doc,"amp-mission-cases");tasks.replaceChildren();
    for(const item of mission.checks){
      const li=doc.createElement("li");li.textContent=item.name;tasks.append(li);
    }
    E(doc,"amp-mission-status").textContent="";
  }
  const rootControls=["amp-root-case","amp-root-mode"];
  rootControls.forEach(id=>E(doc,id).addEventListener("change",rootRender));
  ["amp-condition-case","amp-condition-x"].forEach(id=>E(doc,id).addEventListener("change",conditionRender));
  E(doc,"amp-mission-choice").addEventListener("change",missionRender);
  E(doc,"amp-root-download-julia").addEventListener("click",()=>{
    download({filename:"amp-root-"+E(doc,"amp-root-mode").value+".jl",
      mime:"text/plain;charset=utf-8",content:rootJuliaSource(E(doc,"amp-root-mode").value)});
    E(doc,"amp-root-status").textContent="Julia experiment downloaded; run it locally for genuine output.";
  });
  E(doc,"amp-root-download-csv").addEventListener("click",()=>{
    download({filename:"amp-root-"+E(doc,"amp-root-mode").value+".csv",
      mime:"text/csv;charset=utf-8",content:rootCsv(E(doc,"amp-root-mode").value)});
    E(doc,"amp-root-status").textContent="Browser-calculated comparison exported as CSV, not Julia results.";
  });
  E(doc,"amp-condition-download").addEventListener("click",()=>{
    const id=E(doc,"amp-condition-case").value,x=Number(E(doc,"amp-condition-x").value);
    download({filename:"amp-relative-condition-"+id+".jl",
      mime:"text/plain;charset=utf-8",content:conditionJuliaSource(id,x)});
    E(doc,"amp-condition-status").textContent="Julia experiment downloaded for local execution.";
  });
  E(doc,"amp-mission-copy").addEventListener("click",async()=>{
    const mission=ampMission(E(doc,"amp-mission-choice").value);
    try{
      await navigator.clipboard.writeText(mission.starter);
      E(doc,"amp-mission-status").textContent="Starter copied. Paste into the existing lesson code editor.";
    }catch{E(doc,"amp-mission-status").textContent="Clipboard unavailable. Select the displayed starter code.";}
  });
  E(doc,"amp-mission-tests").addEventListener("click",()=>{
    const mission=ampMission(E(doc,"amp-mission-choice").value);
    if(!mission||mission.lesson!==lessonId)return;
    try{
      download(buildAmpJuliaTests(mission.id,getDraft()));
      E(doc,"amp-mission-status").textContent="Julia Test file downloaded from the current editor. Run locally; tests have not run in the browser.";
    }catch{E(doc,"amp-mission-status").textContent="Cannot build tests from the current draft. Check source size.";}
  });
  rootRender();conditionRender();
  return {showForLesson(id){
    lessonId=id;
    rootSection.hidden=!["09","16"].includes(id);
    conditionSection.hidden=!["09","16"].includes(id);
    const missions=missionsForLesson(id);
    missionSection.hidden=missions.length===0;
    if(missions.length){
      populate(E(doc,"amp-mission-choice"),missions.map(m=>[m.id,m.title]));
      missionRender();
    }
    E(doc,"amp-root-status").textContent="";
    E(doc,"amp-condition-status").textContent="";
  }};
}
