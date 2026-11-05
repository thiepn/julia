import assert from "node:assert/strict";
import {TRANSFER_CASES,TRANSFER_STORAGE_KEY,readTransferAnswers,writeTransferAnswer,
 gradeTransferAnswer,transferEvidence} from "../src/transfer-assessments.js";
import {ASSESSMENTS} from "../src/assessments.js";
import {FUNDAMENTALS} from "../src/fundamentals.js";
import {ALGORITHM_UNITS} from "../src/algorithmic-learning.js";
import {LEARNING_PATHS} from "../src/learning-paths.js";
import {lessons} from "../src/lessons.js";
assert.deepEqual(TRANSFER_CASES.map(c=>c.id),
 ["nonuniform","root-transfer","regression","jacobi-transfer","difference"]);
const oldScripts=new Set(ASSESSMENTS.flatMap(c=>[...c.steps,...c.remediation]).map(q=>q.code));
const scripts=new Set(),ids=new Set();
for(const item of TRANSFER_CASES){
 assert.ok(item.explain.length>=300);assert.ok(item.proof.length>=280);
 assert.ok(item.precondition.length>=65);
 assert.equal(item.steps.length,3);assert.equal(item.justify.kind,"justification");
 for(const [i,q] of [...item.steps,item.justify].entries()){
  const id=item.id+(i<3?"-step-"+(i+1):"-justify");
  assert.equal(q.id,id);
  assert.ok(!ids.has(q.id));ids.add(q.id);
  assert.ok(!scripts.has(q.code));scripts.add(q.code);
  assert.ok(!oldScripts.has(q.code),"No exact L7 code recycled");
  assert.ok(q.code.includes("println("));
  assert.ok(q.stdout.length>0);
  assert.ok(q.ask.length>=35);
  assert.ok(q.reason.length>=45);
  assert.ok(q.hint.length>=30);
  assert.equal(q.options.length,4);
  assert.equal(new Set(q.options).size,4);
  assert.equal(q.feedback.length,4);
  if(q.kind==="output")assert.equal(q.options[q.key],q.stdout);
  else assert.ok(q.options[q.key].length>50);
  for(let k=0;k<4;k++){
   assert.ok(q.feedback[k].length>=18,id+" option "+k);
   const r=gradeTransferAnswer(q,String(k));
   assert.equal(r.valid,true);assert.equal(r.correct,k===q.key);
   assert.equal(r.feedback,q.feedback[k]);
  }
  assert.equal(gradeTransferAnswer(q,"4").valid,false);
  assert.equal(gradeTransferAnswer(q,"1e0").valid,false);
 }
}
assert.equal(ids.size,20);assert.equal(scripts.size,20);
assert.equal(lessons.length,16);assert.equal(FUNDAMENTALS.length,8);
assert.equal(ALGORITHM_UNITS.length,6);assert.equal(LEARNING_PATHS.length,2);
assert.equal(ASSESSMENTS.length,5);
const empty=transferEvidence();
assert.equal(empty.total,20);assert.equal(empty.answered,0);
assert.equal(empty.cases.every(c=>c.correct===0&&!c.justificationCorrect),true);
const a=TRANSFER_CASES[0],q=a.steps[0],justify=a.justify;
const wrong=String((q.key+1)%4);
const map=new Map([
 ["amp-julia-lab:v1",'{"01:0":2}'],
 ["amp-julia-lab:draft:v1:01","previous draft"],
 ["amp-julia-learn:quiz-v1",'{"01-predict":"1"}'],
 ["amp-julia-learn:fundamentals-v1",'{"types-1":"1"}'],
 ["amp-julia-learn:algorithms-v1",'{"contracts-1":"1"}'],
 ["amp-julia-learn:assessments-v1",'{"quadrature-step-1":"2"}']
]);
const store={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
const before=Object.fromEntries(map);
assert.deepEqual(readTransferAnswers(store),{});
assert.equal(writeTransferAnswer(q,wrong,store).saved,true);
assert.equal(transferEvidence(readTransferAnswers(store)).cases[0].incorrect,1);
assert.equal(writeTransferAnswer(justify,String(justify.key),store).saved,true);
assert.equal(transferEvidence(readTransferAnswers(store)).cases[0].justificationCorrect,true);
assert.equal(writeTransferAnswer(q,String(q.key),store).saved,true);
assert.equal(transferEvidence(readTransferAnswers(store)).cases[0].incorrect,0);
assert.equal(transferEvidence(readTransferAnswers(store)).cases[0].answered,2);
for(const [key,value] of Object.entries(before))assert.equal(map.get(key),value,"Old store modified "+key);
assert.equal(writeTransferAnswer({...q},"1",store).saved,false,"Reject noncanonical question objects");
map.set(TRANSFER_STORAGE_KEY,'{"bad":"1","nonuniform-step-1":"2","difference-justify":"8"}');
assert.deepEqual(readTransferAnswers(store),{"nonuniform-step-1":"2"});
map.set(TRANSFER_STORAGE_KEY,"corrupt");assert.deepEqual(readTransferAnswers(store),{});
const denied={getItem(){throw Error("Denied");},setItem(){throw Error("Denied");}};
assert.deepEqual(readTransferAnswers(denied),{});
assert.equal(writeTransferAnswer(q,String(q.key),denied).saved,false);
console.log("L8 UNIT PASS 5 independent cases, 20 unique scripts, 5 justifications, evidence-only, isolated progress");
