import {TRANSFER_CASES,readTransferAnswers,writeTransferAnswer,
 transferEvidence,gradeTransferAnswer} from "./transfer-assessments.js";

// L8 only presents pre-authored source and checks selected reasoning; no browser execution.
export function initTransferAssessmentView({doc,mount}){
 const make=(tag,cls,value)=>{const e=doc.createElement(tag);
  if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e;};
 mount.id="r2-transfer";mount.setAttribute("aria-labelledby","r2-transfer-title");
 const h=make("h2",null,"Independent AMP transfer");h.id="r2-transfer-title";
 const overview=make("p","r2-transfer-overview",
  "Each case has three independent calculations and one mathematical justification. Results describe recorded answers, not proven mastery.");
 const picker=make("select");picker.id="r2-transfer-select";
 const pickerLabel=make("label",null,"Transfer problem");pickerLabel.htmlFor=picker.id;
 const pickerRow=make("div","r2-transfer-picker");pickerRow.append(pickerLabel,picker);
 for(const item of TRANSFER_CASES){const option=make("option",null,item.title);option.value=item.id;picker.append(option);}
 const status=make("p","r2-transfer-status");status.id="r2-transfer-status";
 status.setAttribute("role","status");
 const title=make("h3");title.id="r2-transfer-case-title";
 const exposition=make("div","r2-transfer-exposition");
 const assumption=make("p","r2-transfer-assumption");
 const workHeading=make("h4",null,"Independent calculations");
 const questions=make("div","r2-transfer-questions");
 const whyHeading=make("h4",null,"Mathematical justification");
 const justification=make("div","r2-transfer-justification");
 mount.append(h,overview,pickerRow,status,title,exposition,assumption,
  workHeading,questions,whyHeading,justification);
 let active=TRANSFER_CASES[0].id;
 const storage=()=>{try{return doc.defaultView.localStorage;}catch{return{
  getItem(){throw Error("Storage denied");},setItem(){throw Error("Storage denied");}};}};
 function updateStatus(){
  const evidence=transferEvidence(readTransferAnswers(storage()));
  const current=evidence.cases.find(c=>c.id===active);
  status.textContent=current.answered+" of 4 answered in this case · "+current.correct+
   " currently correct · "+evidence.answered+" of 20 answered across all transfer cases. "+
   (current.justificationCorrect?"Justification currently correct.":"Justification not yet correct.");
 }
 function questionCard(q,answers){
  const card=make("section","r2-transfer-question");
  card.dataset.question=q.id;card.dataset.kind=q.kind;
  const heading=make("h5",null,q.ask);heading.id="r2-transfer-q-"+q.id;
  const source=make("pre","r2-transfer-code");
  source.append(make("code",null,q.code));
  const answersGroup=make("div","r2-transfer-options");
  answersGroup.setAttribute("role","group");answersGroup.setAttribute("aria-labelledby",heading.id);
  const hint=make("details","r2-transfer-hint");hint.append(make("summary",null,"Hint"),
   make("p",null,q.hint));
  const feedback=make("p","r2-transfer-feedback");
  feedback.setAttribute("role","status");feedback.setAttribute("aria-live","polite");
  function display(response,saved){
   const result=gradeTransferAnswer(q,response);
   feedback.dataset.status=result.correct?"correct":"review";
   feedback.textContent=(result.correct?"Correct. ":"Review the reasoning. ")+result.feedback+
    " Julia reference output: "+q.stdout+(!saved?" Answer was not saved locally.":"");
   for(const option of answersGroup.children)option.setAttribute("aria-pressed",
    String(option.dataset.index===String(response)));
  }
  q.options.forEach((text,index)=>{
   const button=make("button","r2-transfer-option",text);
   button.type="button";button.dataset.index=String(index);
   button.setAttribute("aria-pressed",String(answers[q.id]===String(index)));
   button.addEventListener("click",()=>{
    const result=writeTransferAnswer(q,String(index),storage());
    display(String(index),result.saved);updateStatus();
   });
   answersGroup.append(button);
  });
  card.append(heading,source,answersGroup,hint,feedback);
  if(answers[q.id]!==undefined)display(answers[q.id],true);
  return card;
 }
 function render(){
  const item=TRANSFER_CASES.find(x=>x.id===active)||TRANSFER_CASES[0];
  const saved=readTransferAnswers(storage());
  title.textContent=item.title;
  exposition.replaceChildren(make("p",null,item.explain),make("p",null,item.proof));
  assumption.textContent=item.precondition;
  questions.replaceChildren(...item.steps.map(q=>questionCard(q,saved)));
  justification.replaceChildren(questionCard(item.justify,saved));
  updateStatus();
 }
 picker.addEventListener("change",()=>{active=picker.value;render();});
 render();
 return {showLesson(){/* Independent cases remain available across all lessons. */},
  selectCase(id){if(!TRANSFER_CASES.some(x=>x.id===id))return false;active=id;picker.value=id;render();return true;},
  refresh:render};
}
