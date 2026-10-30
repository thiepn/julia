// L7 original AMP multistep assessments. Browser reads text and grades keyed options;
// genuine Julia runs every authored code/output pair in CI only.
import quadrature from "./assessment-quadrature.js";
import bracketing from "./assessment-bracketing.js";
import elimination from "./assessment-elimination.js";
import stability from "./assessment-stability.js";
import newton from "./assessment-newton.js";

export const ASSESSMENTS=Object.freeze([quadrature,bracketing,elimination,stability,newton].map(item=>
 Object.freeze({...item,topics:Object.freeze([...item.topics]),
  steps:Object.freeze(item.steps.map((q,i)=>Object.freeze({...q,id:item.id+"-step-"+(i+1),
   options:Object.freeze([...q.options]),feedback:Object.freeze([...q.feedback])}))),
  remediation:Object.freeze(item.remediation.map((q,i)=>Object.freeze({...q,id:item.id+"-remedy-"+(i+1),
   options:Object.freeze([...q.options]),feedback:Object.freeze([...q.feedback])})))
 })));
export const ASSESSMENT_STORAGE_KEY="amp-julia-learn:assessments-v1";
const questions=ASSESSMENTS.flatMap(item=>[...item.steps,...item.remediation]);
const indexed=new Map(questions.map(q=>[q.id,q]));
if(indexed.size!==25||ASSESSMENTS.some(c=>c.steps.length!==3||c.remediation.length!==2))
 throw Error("Incomplete L7 assessment source");
export function gradeAssessmentAnswer(q,response){
 if(!q||indexed.get(q.id)!==q)return {valid:false,correct:false,feedback:"Question unavailable."};
 const index=Number(response);
 if(!Number.isInteger(index)||String(index)!==String(response)||index<0||index>=q.options.length)
  return {valid:false,correct:false,feedback:"Select an answer."};
 return {valid:true,correct:index===q.correct,feedback:q.feedback[index]};
}
export function readAssessmentAnswers(storage=globalThis.localStorage){
 try{
  const raw=JSON.parse(storage.getItem(ASSESSMENT_STORAGE_KEY)||"{}");
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return {};
  const cleaned={};
  for(const [id,response] of Object.entries(raw)){
   const question=indexed.get(id);
   if(question&&typeof response==="string"&&gradeAssessmentAnswer(question,response).valid)
    cleaned[id]=response;
  }
  return cleaned;
 }catch{return {};}
}
export function writeAssessmentAnswer(question,response,storage=globalThis.localStorage){
 const grade=gradeAssessmentAnswer(question,response);
 if(!grade.valid)return {...grade,saved:false};
 try{
  const prior=readAssessmentAnswers(storage);prior[question.id]=String(response);
  storage.setItem(ASSESSMENT_STORAGE_KEY,JSON.stringify(prior));
  return {...grade,saved:true};
 }catch{return {...grade,saved:false};}
}
// Explicitly latest-recorded answer evidence; no attempt history or inferred mastery.
export function assessmentEvidence(answers={}){
 return ASSESSMENTS.map(item=>{
  const stages=item.steps.map(q=>{
   const response=Object.hasOwn(answers,q.id)?answers[q.id]:undefined;
   const grade=typeof response==="string"?gradeAssessmentAnswer(q,response):{valid:false,correct:false};
   return {id:q.id,attempted:grade.valid,correct:grade.valid&&grade.correct};
  });
  const wrong=stages.filter(x=>x.attempted&&!x.correct).length;
  return {id:item.id,total:stages.length,answered:stages.filter(x=>x.attempted).length,
   correct:stages.filter(x=>x.correct).length,wrong,remediationRecommended:wrong>0};
 });
}
