import {FUNDAMENTALS,gradeFundamentalsCheck} from "./fundamentals.js";
import {ALGORITHM_UNITS,gradeAlgorithmCheck} from "./algorithmic-learning.js";

// Curated study order only. Prerequisites are suggestions, never access gates or claims of mastery.
const foundationOrder=["variables","types","strings","conditions","loops","functions","arrays","broadcasting"];
const algorithmOrder=["contracts","invariants","vector-scans","matrix-methods","root-finding","numerical-safety"];
const prerequisiteMap={
 "variables":[],
 "types":["variables"],
 "strings":["variables"],
 "conditions":["variables","types"],
 "loops":["conditions"],
 "functions":["variables","conditions"],
 "arrays":["variables"],
 "broadcasting":["arrays","types"],
 "contracts":["functions","conditions"],
 "invariants":["loops","functions"],
 "vector-scans":["arrays","loops","invariants"],
 "matrix-methods":["arrays","vector-scans"],
 "root-finding":["conditions","loops","functions"],
 "numerical-safety":["types","contracts"]
};
export const LEARNING_PATHS=Object.freeze([
 Object.freeze({id:"foundations",title:"Julia foundations",items:Object.freeze([...foundationOrder])}),
 Object.freeze({id:"algorithms",title:"AMP algorithmic reasoning",items:Object.freeze([...algorithmOrder])})
]);
const byId=new Map([
 ...FUNDAMENTALS.map(item=>[item.id,{...item,kind:"fundamentals"}]),
 ...ALGORITHM_UNITS.map(item=>[item.id,{...item,kind:"algorithms"}])
]);
const position=new Map(LEARNING_PATHS.flatMap(path=>path.items).map((id,i)=>[id,i]));
if(byId.size!==14||position.size!==14||[...byId.keys()].some(id=>!position.has(id)))
 throw Error("Learning path inventory must cover each authored unit exactly once.");
for(const [id,dependencies] of Object.entries(prerequisiteMap))
 for(const dependency of dependencies)
  if(!position.has(dependency)||position.get(dependency)>=position.get(id))
   throw Error("Prerequisites must refer to earlier authored units: "+id+" -> "+dependency);

export function learningPathEvidence({fundamentals={},algorithms={}}={}){
 const answersByKind={fundamentals,algorithms};
 const gradeByKind={fundamentals:gradeFundamentalsCheck,algorithms:gradeAlgorithmCheck};
 const units=LEARNING_PATHS.flatMap(path=>path.items).map(id=>{
  const item=byId.get(id),answers=answersByKind[item.kind]||{};
  const checks=item.checks.map((question,index)=>{
   const answer=Object.hasOwn(answers,question.id)?answers[question.id]:undefined;
   const valid=typeof answer==="string"&&gradeByKind[item.kind](question,answer).valid;
   const correct=valid&&gradeByKind[item.kind](question,answer).correct;
   return {id:question.id,index,attempted:valid,correct};
  });
  const attempted=checks.filter(c=>c.attempted).length;
  const correct=checks.filter(c=>c.correct).length;
  const incorrect=checks.filter(c=>c.attempted&&!c.correct);
  const unanswered=checks.filter(c=>!c.attempted);
  // No recorded correct answer is a durable mastery certificate. We only describe answer evidence.
  const status=incorrect.length?"review":!attempted?"unattempted":correct===checks.length?
   "all-correct-recorded":"partially-answered";
  const recommended=incorrect[0]||unanswered[0]||null;
  return {id,title:item.title,kind:item.kind,prerequisites:[...prerequisiteMap[id]],
   checks,attempted,correct,incorrect:incorrect.length,unanswered:unanswered.length,
   total:checks.length,status,recommended:recommended?{index:recommended.index,
    id:recommended.id,reason:recommended.attempted?"incorrect":"unanswered"}:null};
 });
 const byUnit=new Map(units.map(unit=>[unit.id,unit]));
 for(const unit of units)
  unit.prerequisiteNotes=unit.prerequisites.filter(id=>{
   const prerequisite=byUnit.get(id);
   return prerequisite.correct!==prerequisite.total;
  });
 const priorities=units.filter(unit=>unit.incorrect>0).sort((a,b)=>
  b.incorrect-a.incorrect||position.get(a.id)-position.get(b.id));
 const nextUnanswered=units.filter(unit=>unit.incorrect===0&&unit.unanswered>0)
  .sort((a,b)=>position.get(a.id)-position.get(b.id));
 const plan=LEARNING_PATHS.map(path=>({
  id:path.id,title:path.title,units:path.items.map(id=>byUnit.get(id))
 }));
 return {paths:plan,units,review:priorities,
  suggestedPractice:[...priorities,...nextUnanswered].slice(0,3),
  recordedAnswers:units.reduce((count,u)=>count+u.attempted,0),
  correctAnswers:units.reduce((count,u)=>count+u.correct,0),
  totalChecks:units.reduce((count,u)=>count+u.total,0)};
}
