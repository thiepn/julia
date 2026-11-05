import {VARIANT_CASES,gradeVariantAnswer,readVariantAnswers,writeVariantAnswer,variantEvidence} from "./variant-assessments.js";
import {buildLearnerReview} from "./learner-review.js";

// Static authored code is displayed, never executed in the browser.
export function initVariantReviewView({doc,mount}){
 const make=(tag,cls,t)=>{const n=doc.createElement(tag);if(cls)n.className=cls;
  if(t!==undefined)n.textContent=t;return n;};
 mount.id="r2-variants";mount.setAttribute("aria-labelledby","r2-variants-title");
 const heading=make("h2",null,"AMP variants and error guarantees");heading.id="r2-variants-title";
 const intro=make("p","r2-variants-intro",
  "Three independent checks per case. Compare computed errors with theorem-based limits and review the assumptions.");
 const label=make("label",null,"Variant case");label.htmlFor="r2-variants-select";
 const picker=make("select");picker.id=label.htmlFor;
 for(const item of VARIANT_CASES){const opt=make("option",null,item.title);opt.value=item.id;picker.append(opt);}
 const controls=make("div","r2-variants-controls");controls.append(label,picker);
 const progress=make("p","r2-variants-progress");progress.id="r2-variants-progress";progress.setAttribute("role","status");
 const title=make("h3");title.id="r2-variants-case-title";
 const context=make("p","r2-variants-context"),assumption=make("p","r2-variants-assumption");
 assumption.id="r2-variants-assumption";
 const questions=make("div","r2-variants-questions");
 questions.id="r2-variants-questions";
 const reviewHeading=make("h3",null,"Saved-answer review export");
 const reviewExplain=make("p","r2-variants-review-explain",
  "Exports only validated latest L3–L9 answer selections and their current correctness. No learner code, drafts, original L1 grades, attempt history or mastery claims.");
 const exportButton=make("button","r2-variants-export","Export review JSON");
 exportButton.id="r2-variants-export";exportButton.type="button";
 const exportStatus=make("p","r2-variants-export-status");exportStatus.id="r2-variants-export-status";
 exportStatus.setAttribute("role","status");
 mount.append(heading,intro,controls,progress,title,context,assumption,questions,
  reviewHeading,reviewExplain,exportButton,exportStatus);
 let chosen=VARIANT_CASES[0].id;
 const storage=()=>{try{return doc.defaultView.localStorage;}catch{return {
  unavailable:true,getItem(){throw Error("Storage blocked");},setItem(){throw Error("Storage blocked");}
 };}};
 function updateProgress(){
  const stats=variantEvidence(readVariantAnswers(storage()));
  const item=stats.find(x=>x.id===chosen);
  progress.textContent=item.answered+" of "+item.total+" answers saved · "+item.correct+
   " currently correct · "+item.incorrect+" incorrect · "+stats.reduce((n,x)=>n+x.answered,0)+
   " of 15 recorded across cases. No mastery inference.";
 }
 function renderQuestion(q,answers){
  const card=make("article","r2-variant-question");card.dataset.question=q.id;
  const h=make("h4",null,q.prompt);h.id="r2-variant-"+q.id;
  const pre=make("pre","r2-variant-code");pre.append(make("code",null,q.code));
  const options=make("div","r2-variant-options");options.setAttribute("role","group");
  options.setAttribute("aria-labelledby",h.id);
  const hint=make("details","r2-variant-hint");
  hint.append(make("summary",null,"Hint"),make("p",null,q.hint));
  const feedback=make("p","r2-variant-feedback");feedback.setAttribute("aria-live","polite");
  feedback.setAttribute("role","status");
  function display(selected,saved){
   const r=gradeVariantAnswer(q,selected);
   feedback.dataset.result=r.correct?"correct":"review";
   feedback.textContent=(r.correct?"Correct. ":"Review. ")+r.feedback+
    " Verified Julia output: "+q.output+(!saved?" Answer not saved locally.":"");
   for(const button of options.children)
    button.setAttribute("aria-pressed",String(button.dataset.index===String(selected)));
  }
  q.options.forEach((choice,index)=>{
   const button=make("button","r2-variant-option",choice);button.type="button";
   button.dataset.index=String(index);
   button.setAttribute("aria-pressed",String(answers[q.id]===String(index)));
   button.addEventListener("click",()=>{
    const grade=writeVariantAnswer(q,String(index),storage());
    display(String(index),grade.saved);updateProgress();
   });
   options.append(button);
  });
  card.append(h,pre,options,hint,feedback);
  if(answers[q.id]!==undefined)display(answers[q.id],true);
  return card;
 }
 function show(){
  const item=VARIANT_CASES.find(c=>c.id===chosen)||VARIANT_CASES[0];
  const answers=readVariantAnswers(storage());
  title.textContent=item.title;context.textContent=item.context;
  assumption.textContent="Required assumption: "+item.assumption;
  questions.replaceChildren(...item.questions.map(q=>renderQuestion(q,answers)));
  updateProgress();
 }
 picker.addEventListener("change",()=>{chosen=picker.value;show();});
 exportButton.addEventListener("click",()=>{
  try{
   const local=storage();
   if(local.unavailable){exportStatus.textContent="Browser storage unavailable; export cannot read saved answers.";return;}
   const data=buildLearnerReview(local,new Date().toISOString());
   const blob=new doc.defaultView.Blob([JSON.stringify(data,null,2)+"\n"],{type:"application/json"});
   const url=doc.defaultView.URL.createObjectURL(blob);
   const a=make("a");a.href=url;a.download="julia-learn-review-v1.json";
   doc.body.append(a);a.click();a.remove();
   doc.defaultView.setTimeout(()=>doc.defaultView.URL.revokeObjectURL(url),1000);
   exportStatus.textContent=data.summary.recorded+" validated latest answers included in the JSON download.";
  }catch{exportStatus.textContent="Review export failed; saved answers were not changed.";}
 });
 show();
 return {showLesson(){},selectCase(id){
  if(!VARIANT_CASES.some(c=>c.id===id))return false;
  chosen=id;picker.value=id;show();return true;
 },refresh:show};
}
