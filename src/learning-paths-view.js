import {learningPathEvidence} from "./learning-paths.js";
import {readFundamentalsAnswers} from "./fundamentals.js";
import {readAlgorithmAnswers} from "./algorithmic-learning.js";

// Derived revision guidance: no separate progress key, gate, hidden grade or inferred mastery.
export function initLearningPathsView({doc,mount}){
 const node=(tag,className,text)=>{const x=doc.createElement(tag);
  if(className)x.className=className;if(text!==undefined)x.textContent=text;return x;};
 mount.id="r2-learning-paths";
 mount.setAttribute("aria-labelledby","r2-learning-paths-title");
 const heading=node("h2",null,"Learning paths and revision");
 heading.id="r2-learning-paths-title";
 const basis=node("p","r2-paths-basis",
  "Recommendations use the latest saved answers to L4/L5 checks. One correct answer is not proof of mastery; unanswered work is not marked incorrect.");
 const summary=node("p","r2-paths-summary");summary.id="r2-paths-summary";
 summary.setAttribute("role","status");
 const priorityTitle=node("h3",null,"Targeted practice");
 const suggested=node("div","r2-paths-suggested");suggested.id="r2-paths-suggested";
 const pathHolder=node("div","r2-paths-paths");pathHolder.id="r2-paths-paths";
 mount.append(heading,basis,summary,priorityTitle,suggested,pathHolder);
 const storage=()=>{try{return doc.defaultView.localStorage;}catch{return{
  getItem(){throw Error("Storage blocked");},setItem(){throw Error("Storage blocked");}
 };}};
 let current=null;
 const names=new Map();
 const label=unit=>unit.attempted===0?"No saved answers":unit.incorrect>0?
  unit.correct+"/"+unit.total+" correct recorded · "+unit.incorrect+" incorrect":
  unit.correct===unit.total?"2/2 correct recorded (not a mastery assessment)":
  unit.correct+"/"+unit.total+" correct recorded · "+unit.unanswered+" unanswered";
 function openQuestion(unit,index){
  const prefix=unit.kind==="fundamentals"?"r2-fundamentals":"r2-algorithms";
  const select=doc.getElementById(prefix+"-topic");
  if(!select)return;
  select.value=unit.id;
  select.dispatchEvent(new doc.defaultView.Event("change",{bubbles:true}));
  const mount=doc.getElementById(prefix);
  const question=mount?.querySelectorAll(".r2-fundamentals-question")[index];
  const target=question||mount;
  if(!target)return;
  target.scrollIntoView({behavior:"instant",block:"start"});
  const heading=question?.querySelector("h5");
  if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
 }
 function reviewButton(unit){
  const action=node("button","r2-paths-action",
   unit.recommended?.reason==="incorrect"?"Retry question "+(unit.recommended.index+1):
   unit.recommended?"Try question "+(unit.recommended.index+1):"Review topic");
  action.type="button";action.dataset.skill=unit.id;
  action.dataset.kind=unit.kind;
  action.addEventListener("click",()=>openQuestion(unit,unit.recommended?.index??0));
  return action;
 }
 function refresh(){
  const plan=learningPathEvidence({
   fundamentals:readFundamentalsAnswers(storage()),
   algorithms:readAlgorithmAnswers(storage())
  });
  current=plan;
  names.clear();for(const unit of plan.units)names.set(unit.id,unit.title);
  summary.textContent=plan.recordedAnswers+" of "+plan.totalChecks+
   " saved answers · "+plan.correctAnswers+" currently correct · "+plan.review.length+" topics with incorrect answers";
  suggested.replaceChildren();
  if(!plan.suggestedPractice.length)
   suggested.append(node("p",null,
    "All authored L4/L5 checks currently have correct saved answers. This does not certify mastery."));
  for(const unit of plan.suggestedPractice){
   const item=node("article","r2-paths-priority");
   const title=node("h4",null,unit.title);
   const reason=node("p",null,unit.incorrect?
    "Review: "+unit.incorrect+" recorded incorrect answer"+(unit.incorrect===1?"":"s")+
    " · "+unit.correct+"/"+unit.total+" currently correct":
    "Not yet completed: "+unit.unanswered+" unanswered check"+(unit.unanswered===1?"":"s"));
   item.append(title,reason,reviewButton(unit));suggested.append(item);
  }
  pathHolder.replaceChildren();
  for(const path of plan.paths){
   const section=node("section","r2-paths-sequence");
   const h=node("h3",null,path.title);
   section.append(h);
   const list=node("ol","r2-paths-list");
   for(const unit of path.units){
    const row=node("li","r2-paths-unit");
    row.dataset.skill=unit.id;
    row.dataset.evidence=unit.status;
    const name=node("h4",null,unit.title);
    const status=node("p","r2-paths-state",label(unit));
    row.append(name,status);
    if(unit.prerequisites.length){
     const prereq=node("p","r2-paths-prereqs",
      "Suggested before: "+unit.prerequisites.map(id=>names.get(id)).join(", "));
     row.append(prereq);
     if(unit.prerequisiteNotes.length)
      row.append(node("p","r2-paths-prereq-note",
       "Prerequisite checks not all correct: "+unit.prerequisiteNotes.map(id=>names.get(id)).join(", ")));
    }
    row.append(reviewButton(unit));list.append(row);
   }
   section.append(list);pathHolder.append(section);
  }
 }
 refresh();
 return {refresh,getSnapshot:()=>current};
}
