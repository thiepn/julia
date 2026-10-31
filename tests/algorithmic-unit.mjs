import assert from "node:assert/strict";
import {ALGORITHM_UNITS,ALGORITHM_ANSWERS_KEY,gradeAlgorithmCheck,readAlgorithmAnswers,writeAlgorithmAnswer} from "../src/algorithmic-learning.js";
import {lessons} from "../src/lessons.js";
assert.equal(ALGORITHM_UNITS.length,6);
const seen=new Set();
for(const unit of ALGORITHM_UNITS){
 assert.ok(unit.explain.length>500);assert.equal(unit.explain.split("\n\n").length,2);
 assert.ok(unit.invariant.length>90);
 assert.equal(unit.examples.length,2);assert.equal(unit.checks.length,2);
 for(const e of unit.examples){
  assert.ok(e.code.includes("println("));assert.ok(e.output.trim());
  assert.equal(e.trace.length,3);assert.ok(e.reason.length>65);assert.ok(e.pitfall.length>50);
 }
 for(const q of unit.checks){
  assert.ok(!seen.has(q.id));seen.add(q.id);
  assert.equal(q.choices.length,4);assert.equal(q.feedback.length,4);
  assert.equal(new Set(q.choices).size,4);
  assert.equal(q.choices[q.correct],q.output);
  q.choices.forEach((_,index)=>{
   const r=gradeAlgorithmCheck(q,String(index));assert.equal(r.correct,index===q.correct);
   assert.equal(r.feedback,q.feedback[index]);assert.ok(r.feedback.length>10);
  });
  assert.equal(gradeAlgorithmCheck(q,"99").valid,false);
 }
}
assert.equal(seen.size,12);assert.equal(lessons.length,16);
const map=new Map();
const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
const old=["amp-julia-lab:v1","amp-julia-lab:draft:v1:01","amp-julia-learn:quiz-v1","amp-julia-learn:fundamentals-v1"];
for(const key of old)map.set(key,"retain:"+key);
const q=ALGORITHM_UNITS[0].checks[0];
assert.equal(writeAlgorithmAnswer(q,String(q.correct),storage).saved,true);
assert.equal(readAlgorithmAnswers(storage)[q.id],String(q.correct));
for(const key of old)assert.equal(map.get(key),"retain:"+key);
map.set(ALGORITHM_ANSWERS_KEY,"not-json");assert.deepEqual(readAlgorithmAnswers(storage),{});
const denied={getItem(){throw Error("denied");},setItem(){throw Error("denied");}};
assert.deepEqual(readAlgorithmAnswers(denied),{});assert.equal(writeAlgorithmAnswer(q,String(q.correct),denied).saved,false);
console.log("L5 UNIT PASS six chapters, 12 examples, 12 checks, independent storage");
