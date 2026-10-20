import test from "node:test";
import assert from "node:assert/strict";
import {EXTERNAL_TEST_SUITES,externalTestSuite,buildExternalTestFile} from "../src/external-tests.js";
import {MAX_DRAFT_LENGTH} from "../src/workspace.js";

test("all nine qualified tasks have new independent source-authored edge cases",()=>{
  const names=["Mixed zero and signs","Negative threshold","Three negative factors",
    "Inclusive tolerance boundary","Negative value inside tolerance","Negative scaled inputs",
    "Signed off-diagonal","Negative upper entry","Signed off-diagonal"];
  let i=0;
  for(const lesson of ["08","09","13"])for(const variant of ["original","a","b"]){
    const suite=externalTestSuite(lesson,variant);
    assert.ok(suite.cases.length>=4);
    assert.equal(suite.cases.at(-1).name,names[i++]);
    assert.ok(suite.cases.at(-1).assertion.startsWith("@test "));
  }
  assert.equal(i,9);
});
test("focused export retains exact learner source and only the selected case",()=>{
  const src="count_above(v, t) = count(x -> x > t, v)\n# exactly my own source";
  const all=buildExternalTestFile("08","a",src);
  const chosen=buildExternalTestFile("08","a",src,"Negative threshold");
  assert.equal(chosen.filename,"amp-julia-lab-lesson-08-transfer-a-case-04-tests.jl");
  assert.ok(chosen.content.includes(src));
  assert.ok(chosen.content.includes("Negative threshold"));
  assert.ok(chosen.content.includes("@test count_above([-2, 0, 2], -1) == 2"));
  assert.ok(!chosen.content.includes("Empty input"));
  assert.equal((chosen.content.match(/@testset /g)||[]).length,2);
  assert.equal((all.content.match(/@testset /g)||[]).length,5);
  assert.match(chosen.content,/Focused reproduction only; rerun the full suite after repair/);
  assert.doesNotMatch(all.content,/Focused reproduction only/);
  assert.equal(all.filename,"amp-julia-lab-lesson-08-transfer-a-tests.jl");
  assert.equal(chosen.mime,all.mime);
});
test("all 9 task variants can create a standalone focused export",()=>{
  for(const [lesson,suites] of Object.entries(EXTERNAL_TEST_SUITES))for(const [variant,suite] of Object.entries(suites)){
    for(const [i,item] of suite.cases.entries()){
      const script=buildExternalTestFile(lesson,variant,"# test-only marker",item.name);
      assert.ok(script.filename.endsWith("-case-"+String(i+1).padStart(2,"0")+"-tests.jl"));
      assert.equal((script.content.match(/@testset /g)||[]).length,2);
      assert.ok(script.content.includes(item.assertion));
      for(const other of suite.cases.filter(c=>c.name!==item.name)){
        assert.ok(!script.content.includes('@testset "'+other.name+'"'));
      }
    }
  }
});
test("unknown, cross-task and malformed focused selections fail closed",()=>{
  for(const bad of ["Not a case","constructor","__proto__","Empty input identity",0,{}]){
    assert.throws(()=>buildExternalTestFile("08","a","count_above(v,t)=0",bad),RangeError);
  }
  assert.throws(()=>buildExternalTestFile("16","a","println(1)","Some case"),RangeError);
  assert.throws(()=>buildExternalTestFile("08","a","x".repeat(MAX_DRAFT_LENGTH+1),"Negative threshold"),RangeError);
});
test("default full suite remains stable and retains all regression cases",()=>{
  const x=buildExternalTestFile("13","a","backward_substitution(U,b)=U\\b");
  assert.equal((x.content.match(/@testset /g)||[]).length,5);
  assert.match(x.content,/Negative upper entry/);
  assert.match(x.content,/Identity matrix/);
  assert.equal(x.filename,"amp-julia-lab-lesson-13-transfer-a-tests.jl");
});
