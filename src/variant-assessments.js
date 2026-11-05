import quartic from "./variant-quartic.js";
import contraction from "./variant-contraction.js";
import euler from "./variant-euler.js";
import power from "./variant-power.js";
import conditioning from "./variant-conditioning.js";

export const VARIANT_CASES=Object.freeze([quartic,contraction,euler,power,conditioning].map(c=>
 Object.freeze({...c,questions:Object.freeze(c.questions.map(q=>Object.freeze({...q,id:c.id+"-"+q.id,
  options:Object.freeze(q.options),feedback:Object.freeze(q.feedback)})))})));
export const VARIANT_STORAGE_KEY="amp-julia-learn:variants-v1";
const indexed=new Map(VARIANT_CASES.flatMap(c=>c.questions).map(q=>[q.id,q]));
if(indexed.size!==15||VARIANT_CASES.length!==5)throw Error("L9 inventory must contain 15 unique questions.");
export function gradeVariantAnswer(q,selection){
 if(!q||indexed.get(q.id)!==q)return {valid:false,correct:false,feedback:"Question unavailable."};
 const n=Number(selection);
 if(!Number.isInteger(n)||String(n)!==String(selection)||n<0||n>=q.options.length)
  return {valid:false,correct:false,feedback:"Choose a valid answer."};
 return {valid:true,correct:n===q.correct,feedback:q.feedback[n]};
}
export function readVariantAnswers(storage=globalThis.localStorage){
 try{
  const data=JSON.parse(storage.getItem(VARIANT_STORAGE_KEY)||"{}");
  if(!data||typeof data!=="object"||Array.isArray(data))return {};
  const clean={};
  for(const [id,answer] of Object.entries(data)){
   const q=indexed.get(id);
   if(q&&typeof answer==="string"&&gradeVariantAnswer(q,answer).valid)clean[id]=answer;
  }
  return clean;
 }catch{return {};}
}
export function writeVariantAnswer(q,selection,storage=globalThis.localStorage){
 const grade=gradeVariantAnswer(q,selection);
 if(!grade.valid)return {...grade,saved:false};
 try{
  const record=readVariantAnswers(storage);
  record[q.id]=String(selection);
  storage.setItem(VARIANT_STORAGE_KEY,JSON.stringify(record));
  return {...grade,saved:true};
 }catch{return {...grade,saved:false};}
}
export function variantEvidence(answers={}){
 return VARIANT_CASES.map(c=>{
  const checks=c.questions.map(q=>{
   const answer=Object.hasOwn(answers,q.id)?answers[q.id]:undefined;
   const grade=typeof answer==="string"?gradeVariantAnswer(q,answer):{valid:false,correct:false};
   return {id:q.id,attempted:grade.valid,correct:grade.valid&&grade.correct};
  });
  return {id:c.id,title:c.title,total:checks.length,
   answered:checks.filter(q=>q.attempted).length,
   correct:checks.filter(q=>q.correct).length,
   incorrect:checks.filter(q=>q.attempted&&!q.correct).length};
 });
}
