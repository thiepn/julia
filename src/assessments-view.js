import {ASSESSMENTS,assessmentEvidence,readAssessmentAnswers,writeAssessmentAnswer,
 gradeAssessmentAnswer} from "./assessments.js";

// The learning stage only renders authored Julia and compares selected answers to
// checked source keys. No user code execution, no hidden generated assessment.
export function initAssessmentsView({doc,mount}){
 const el=(tag,cls,content)=>{const x=doc.createElement(tag);
  if(cls)x.className=cls;if(content!==undefined)x.textContent=content;return x;};
 mount.id="r2-assessments";mount.setAttribute("aria-labelledby","r2-assessments-title");
 const title=el("h2",null,"Multistep AMP assessments");title.id="r2-assessments-title";
 const scope=el("p","r2-assessment-scope",
  "Three connected reasoning steps per case. Incorrect answers unlock two new transfer problems; source runs in CI, not in this browser.");
 const label=el("label",null,"Assessment");label.htmlFor="r2-assessment-select";
 const select=el("select");select.id="r2-assessment-select";
 for(const item of ASSESSMENTS){
  const option=el("option",null,item.title);option.value=item.id;select.append(option);
 }
 const selection=el("div","r2-assessment-picker");selection.append(label,select);
 const counter=el("p","r2-assessment-progress");counter.id="r2-assessment-progress";
 counter.setAttribute("role","status");
 const header=el("h3");header.id="r2-assessment-heading";
 const context=el("div","r2-assessment-context");
 const principle=el("p","r2-assessment-principle");
 const stepHeading=el("h4",null,"Reasoning sequence");
 const stages=el("div","r2-assessment-steps");
 const remedy=el("section","r2-assessment-remedy");
 remedy.id="r2-assessment-remedy";
 mount.append(title,scope,selection,counter,header,context,principle,stepHeading,stages,remedy);
 let selectedId=ASSESSMENTS[0].id;
 const storage=()=>{try{return doc.defaultView.localStorage;}catch{
  return {getItem(){throw Error("Storage unavailable");},setItem(){throw Error("Storage unavailable");}};
 }};
 function renderQuestion(q,answers,kind){
  const card=el("article","r2-assessment-question");
  card.dataset.question=q.id;card.dataset.kind=kind;
  const h=el("h5",null,q.label);h.id="r2-assessment-label-"+q.id;
  const code=el("pre","r2-assessment-code");code.append(el("code",null,q.code));
  const opts=el("div","r2-assessment-options");
  opts.setAttribute("role","group");opts.setAttribute("aria-labelledby",h.id);
  const hint=el("details","r2-assessment-hint");
  hint.append(el("summary",null,"Hint"),el("p",null,q.hint));
  const output=el("p","r2-assessment-answer");
  output.setAttribute("aria-live","polite");output.setAttribute("role","status");
  function show(response,savedOk){
   const grade=gradeAssessmentAnswer(q,response);
   output.dataset.status=grade.correct?"correct":"retry";
   output.textContent=(grade.correct?"Correct. ":"Review this step. ")+grade.feedback+
    " Verified Julia output: "+q.stdout+
    (!savedOk?" This answer was not saved locally.":"");
   for(const option of opts.children)
    option.setAttribute("aria-pressed",String(option.dataset.index===String(response)));
  }
  q.options.forEach((text,index)=>{
   const button=el("button","r2-assessment-option",text);
   button.type="button";button.dataset.index=String(index);
   button.setAttribute("aria-pressed",String(answers[q.id]===String(index)));
   button.addEventListener("click",()=>{
    const result=writeAssessmentAnswer(q,String(index),storage());
    show(String(index),result.saved);
    updateIndicators();
    if(kind==="step")renderRemediation();
   });
   opts.append(button);
  });
  card.append(h,code,opts,hint,output);
  if(answers[q.id]!==undefined)show(answers[q.id],true);
  return card;
 }
 function updateIndicators(){
  const saved=readAssessmentAnswers(storage());
  const stats=assessmentEvidence(saved);
  const current=stats.find(x=>x.id===selectedId);
  const completed=stats.reduce((n,x)=>n+x.answered,0);
  const correct=stats.reduce((n,x)=>n+x.correct,0);
  counter.textContent=current.answered+" of 3 case steps answered · "+current.correct+
    " currently correct · "+completed+" of 15 answered across cases ("+correct+
    " correct). No mastery claim.";
 }
 function renderRemediation(){
  const caseItem=ASSESSMENTS.find(x=>x.id===selectedId),saved=readAssessmentAnswers(storage());
  const current=assessmentEvidence(saved).find(x=>x.id===caseItem.id);
  remedy.replaceChildren();
  if(!current.remediationRecommended)return;
  const h=el("h4",null,"New remediation problems");
  const explain=el("p",null,
   "One or more case steps currently have incorrect answers. Apply the same concepts to these different problems.");
  const items=el("div","r2-assessment-remedy-grid");
  caseItem.remediation.forEach(q=>items.append(renderQuestion(q,saved,"remediation")));
  remedy.append(h,explain,items);
 }
 function renderCase(){
  const item=ASSESSMENTS.find(x=>x.id===selectedId)||ASSESSMENTS[0];
  header.textContent=item.title;
  context.replaceChildren(...item.context.split("\n\n").map(p=>el("p",null,p)));
  principle.textContent=item.invariant;
  const saved=readAssessmentAnswers(storage());
  stages.replaceChildren(...item.steps.map(q=>renderQuestion(q,saved,"step")));
  renderRemediation();updateIndicators();
 }
 select.addEventListener("change",()=>{selectedId=select.value;renderCase();});
 renderCase();
 return {showLesson(){/* Cases stay selectable across the 16 unchanged lessons. */},
   selectCase(id){if(ASSESSMENTS.some(q=>q.id===id)){
     selectedId=id;select.value=id;renderCase();return true;
   }return false;},
   refresh:renderCase};
}
