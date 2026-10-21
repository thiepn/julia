import {TRACE_LESSONS,traceForCase,checkTracePrediction,readTracePosition,writeTracePosition,clearTracePosition} from "./program-trace-model.js";
const $=id=>document.getElementById(id);
let active=null,position=0,checked=false;
function renderHistory(trace){
  const tbody=$("trace-history");
  tbody.replaceChildren();
  trace.steps.slice(0,position).forEach(step=>{
    const tr=document.createElement("tr");
    const values=[String(step.index+1),step.context,String(step.before),String(step.after)];
    values.forEach((value,i)=>{
      const cell=document.createElement(i===0?"th":"td");
      if(i===0)cell.scope="row";
      cell.textContent=value;tr.append(cell);
    });
    tbody.append(tr);
  });
  $("trace-history-empty").hidden=position>0;
}
function render(){
  const trace=traceForCase(active);
  const finished=position===trace.steps.length;
  const step=trace.steps[position];
  $("trace-title").textContent=trace.title;
  $("trace-code").textContent=trace.source;
  $("trace-state-name").textContent=trace.state;
  $("trace-predict-label").textContent="Predict "+trace.state+" after this iteration";
  $("trace-iteration").textContent=finished?"Finished":"Iteration "+(position+1)+" of "+trace.steps.length;
  $("trace-context").textContent=finished?"All modeled iterations have been revealed.":step.context;
  $("trace-before").textContent=finished?String(trace.final):String(step.before);
  $("trace-branch-wrap").hidden=!trace.hasBranch||finished;
  $("trace-condition").textContent=trace.condition||"";
  $("trace-prediction-fields").hidden=finished;
  $("trace-finish").hidden=!finished;
  $("trace-finish").textContent=finished?"Final "+trace.state+" = "+trace.final+". This trace is not a Julia execution or coding grade.":"";
  $("trace-input").value="";
  $("trace-branch").value="";
  $("trace-check").disabled=finished;
  $("trace-next").disabled=!checked||finished;
  $("trace-next").textContent=position===trace.steps.length-1?"Finish trace":"Next iteration";
  $("trace-explanation").textContent="";
  $("trace-explanation").dataset.result="";
  $("trace-reset").disabled=position===0&&!checked;
  renderHistory(trace);
}
function showFeedback(message,result){
  $("trace-explanation").textContent=message;
  $("trace-explanation").dataset.result=result;
}
export function initProgramTrace(){
  $("trace-check").addEventListener("click",()=>{
    if(!active)return;
    const result=checkTracePrediction(active,position,$("trace-input").value,$("trace-branch").value);
    if(!result.valid){showFeedback(result.message,"invalid");return;}
    checked=true;
    $("trace-next").disabled=false;
    const parts=[result.valueCorrect?"Variable prediction correct.":"Variable prediction differs."];
    if(traceForCase(active).hasBranch)
      parts.push(result.branchCorrect?"Branch prediction correct.":"Branch prediction differs.");
    parts.push("Actual value: "+result.actual+".");
    if(result.actualBranch!==null)parts.push("Condition: "+String(result.actualBranch)+".");
    parts.push(result.explanation);
    parts.push("This checks the modeled step, not Julia code execution.");
    showFeedback(parts.join(" "),result.correct?"correct":"incorrect");
    $("trace-reset").disabled=false;
  });
  $("trace-next").addEventListener("click",()=>{
    if(!active||!checked)return;
    const trace=traceForCase(active);
    if(position>=trace.steps.length)return;
    position++;
    checked=false;
    $("trace-save-status").textContent=writeTracePosition(active,position)?"":"Browser storage unavailable. Trace position was not saved.";
    render();
  });
  $("trace-reset").addEventListener("click",()=>{
    if(!active||!window.confirm("Reset this program trace to its first iteration?"))return;
    if(!clearTracePosition(active)){
      showFeedback("Could not reset saved trace. Your current step is unchanged.","invalid");
      return;
    }
    position=0;checked=false;render();
    $("trace-save-status").textContent="Trace restarted for this example.";
  });
  $("trace-input").addEventListener("keydown",event=>{
    if(event.key==="Enter"&&!$("trace-check").disabled){event.preventDefault();$("trace-check").click();}
  });
}
export function showProgramTrace(lessonId){
  const caseId=TRACE_LESSONS[lessonId]||null;
  $("program-trace").hidden=!caseId;
  if(!caseId)return;
  if(active!==caseId){
    active=caseId;
    position=readTracePosition(active);
    checked=false;
    $("trace-save-status").textContent="";
    render();
  }
}
