import assert from "node:assert/strict";
import {lessons} from "../src/lessons.js";
import {LEARNING_EXAMPLES,examplesForLesson} from "../src/learning-examples.js";

const pilot=["01","02","03"];
assert.deepEqual(Object.keys(LEARNING_EXAMPLES),pilot);
const seen=new Set();
for(const id of pilot){
  const lesson=lessons.find(x=>x.id===id);
  assert.ok(lesson,"Canonical lesson "+id+" exists");
  const cases=examplesForLesson(id);
  assert.equal(cases.length,6,id+" has six authored examples");
  assert.equal(cases[0].code,lesson.example,id+" retains its original example verbatim");
  for(const example of cases){
    assert.match(example.id,new RegExp("^"+id+"-\\d{2}$"));
    assert.ok(!seen.has(example.id),"Unique example ID: "+example.id);
    seen.add(example.id);
    for(const key of ["title","code","output","explanation","pitfall"])
      assert.ok(typeof example[key]==="string"&&example[key].trim().length>0,example.id+" "+key);
    assert.ok(example.explanation.length>=90,example.id+" requires a substantive explanation");
    assert.ok(example.pitfall.length>=60,example.id+" requires a concrete misconception");
    assert.equal(example.steps.length,3,example.id+" requires three explanatory steps");
    assert.ok(example.steps.every(s=>typeof s==="string"&&s.length>=24));
    assert.ok(example.code.includes("println("),example.id+" must print its comparison output");
    assert.ok(!/eval\s*\(|Function\s*\(/.test(example.code),"No dynamic interpreter examples");
  }
}
assert.equal(examplesForLesson("04"),null,"Unconverted lessons keep canonical lesson example");
assert.equal(seen.size,18);
console.log("L2 SCHEMA PASS 18 original examples / 3 lessons; canonical lesson sources unchanged");
