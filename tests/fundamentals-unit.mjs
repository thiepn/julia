import assert from "node:assert/strict";
import {FUNDAMENTALS,FUNDAMENTALS_STORAGE_KEY,fundamentalsFor,
 gradeFundamentalsCheck,readFundamentalsAnswers,writeFundamentalsAnswer} from "../src/fundamentals.js";
import {lessons} from "../src/lessons.js";

assert.deepEqual(FUNDAMENTALS.map(c=>c.id),
 ["variables","types","strings","conditions","loops","functions","arrays","broadcasting"]);
const allKeys=new Set();
for(const unit of FUNDAMENTALS){
 assert.ok(unit.explain.length>=650,unit.id+" needs substantive explanations");
 assert.ok(unit.explain.includes("\n\n"),unit.id+" must explain in paragraphs");
 assert.equal(unit.concepts.length,3);
 assert.equal(unit.examples.length,2);
 assert.equal(unit.checks.length,2);
 for(const ex of unit.examples){
  assert.ok(ex.title.length>5);
  assert.ok(ex.code.includes("println("));
  assert.ok(ex.output.trim().length>0);
  assert.equal(ex.steps.length,3);
  assert.ok(ex.steps.every(x=>x.length>=16));
  assert.ok(ex.why.length>=65);
  assert.ok(ex.trap.length>=45);
 }
 for(const q of unit.checks){
  assert.ok(!allKeys.has(q.id));allKeys.add(q.id);
  assert.ok(q.id.startsWith(unit.id+"-"));
  assert.equal(q.options.length,4);
  assert.equal(new Set(q.options).size,4);
  assert.equal(q.feedback.length,4);
  assert.ok(q.hint.length>18);
  assert.equal(q.output.trim().length>0);
  assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);
  q.options.forEach((_,i)=>{
   const result=gradeFundamentalsCheck(q,String(i));
   assert.equal(result.correct,i===q.answer,q.id+" answer "+i);
   assert.equal(result.feedback,q.feedback[i]);
   assert.ok(result.feedback.length>=15);
  });
  assert.equal(gradeFundamentalsCheck(q,"1e9").valid,false);
  assert.equal(gradeFundamentalsCheck(q,"4").valid,false);
 }
}
assert.equal(allKeys.size,16);
assert.equal(fundamentalsFor("invalid"),null);
assert.equal(lessons.length,16,"canonical lesson count unchanged");
const original=new Map([
 ["amp-julia-lab:v1",'{"01:0":2}'],
 ["amp-julia-lab:draft:v1:01","personal script"],
 ["amp-julia-learn:quiz-v1",'{"01-predict":"1"}']
]);
const storage={getItem:k=>original.get(k)??null,setItem:(k,v)=>original.set(k,v)};
assert.deepEqual(readFundamentalsAnswers(storage),{});
const q=FUNDAMENTALS[0].checks[0];
assert.equal(writeFundamentalsAnswer(q,"wrong",storage).saved,false);
assert.equal(writeFundamentalsAnswer(q,String(q.answer),storage).saved,true);
assert.equal(readFundamentalsAnswers(storage)[q.id],String(q.answer));
assert.equal(original.get("amp-julia-lab:v1"),'{"01:0":2}');
assert.equal(original.get("amp-julia-lab:draft:v1:01"),"personal script");
assert.equal(original.get("amp-julia-learn:quiz-v1"),'{"01-predict":"1"}');
original.set(FUNDAMENTALS_STORAGE_KEY,'{"invalid":"1","variables-1":"2","types-1":"10"}');
assert.deepEqual(readFundamentalsAnswers(storage),{"variables-1":"2"});
original.set(FUNDAMENTALS_STORAGE_KEY,"not-json");
assert.deepEqual(readFundamentalsAnswers(storage),{});
const denied={getItem(){throw Error("No access");},setItem(){throw Error("No access");}};
assert.deepEqual(readFundamentalsAnswers(denied),{});
assert.equal(writeFundamentalsAnswer(q,String(q.answer),denied).saved,false);
console.log("L4 FUNDAMENTALS UNIT PASS 8 chapters, 16 examples, 16 checks, content, grading and isolated storage");
