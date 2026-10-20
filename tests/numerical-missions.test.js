import test from "node:test";
import assert from "node:assert/strict";
import {lessons} from "../src/lessons.js";
import {missionForLesson,NUMERICAL_MISSIONS} from "../src/numerical-missions.js";
import {readTransferDraft,writeTransferDraft,clearTransferDraft} from "../src/transfer-drafts.js";
import {readDraft,writeDraft,MAX_DRAFT_LENGTH} from "../src/workspace.js";
import {transferForLesson} from "../src/transfer-cases.js";
import {externalTestSuite,buildExternalTestFile} from "../src/external-tests.js";
const store=()=>{
  const m=new Map();
  return {m,getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};
};
test("exactly four original numerical lessons have distinct function-building missions",()=>{
  assert.deepEqual(Object.keys(NUMERICAL_MISSIONS).sort(),["12","14","15","16"]);
  assert.equal(lessons.length,16);
  const seen=new Set();
  for(const lesson of ["12","14","15","16"]){
    const m=missionForLesson(lesson),l=lessons.find(x=>x.id===lesson);
    assert.ok(l);
    assert.ok(m.title.startsWith("Numerical mission"));
    assert.ok(m.task.length>160&&m.task!==l.challenge&&m.task!==transferForLesson(lesson,"a").task);
    assert.ok(m.starter.includes('error("TODO:'));
    assert.ok(m.checks.length>80&&m.plan.length>30&&m.verify.length>40);
    const suite=externalTestSuite(lesson,"mission");
    assert.equal(suite.cases.length,4);
    assert.ok(m.starter.includes("function "+suite.title+"("));
    assert.equal(new Set(suite.cases.map(c=>c.name)).size,4);
    for(const item of suite.cases){
      assert.match(item.assertion,/^@test /);
      assert.ok(item.assertion.includes(suite.title+"("));
    }
    seen.add(suite.title);
    assert.equal(externalTestSuite(lesson,"original"),null);
    assert.equal(externalTestSuite(lesson,"a"),null);
    assert.equal(externalTestSuite(lesson,"b"),null);
  }
  assert.equal(seen.size,4);
  for(const lesson of ["01","08","09","13","17","__proto__","constructor"])
    assert.equal(missionForLesson(lesson),null);
});
test("mission drafts use existing per-task writer without colliding with any original or transfer draft",()=>{
  const s=store();
  assert.equal(writeDraft("12","println(:original)",s),true);
  assert.equal(writeTransferDraft("12","a","println(:transfer)",s),true);
  assert.equal(writeTransferDraft("12","mission","println(:mission)",s),true);
  assert.equal(writeTransferDraft("14","mission","println(:other)",s),true);
  assert.equal(readDraft("12","",s),"println(:original)");
  assert.equal(readTransferDraft("12","a","",s),"println(:transfer)");
  assert.equal(readTransferDraft("12","mission","",s),"println(:mission)");
  assert.equal(readTransferDraft("14","mission","",s),"println(:other)");
  assert.equal(clearTransferDraft("12","mission",s),true);
  assert.equal(readTransferDraft("12","mission","starter",s),"starter");
  assert.equal(readTransferDraft("12","a","",s),"println(:transfer)");
  assert.equal(readDraft("12","",s),"println(:original)");
  assert.ok([...s.m.keys()].some(k=>k==="amp-julia-lab:transfer-draft:v1:14:mission"));
});
test("unknown mission variants, storage failures and too-large drafts fail closed",()=>{
  const s=store();
  for(const [lesson,variant] of [["08","mission"],["13","mission"],["constructor","mission"],["__proto__","mission"],["12","c"],["12","constructor"]]){
    assert.equal(writeTransferDraft(lesson,variant,"abc",s),false);
    assert.equal(clearTransferDraft(lesson,variant,s),false);
  }
  assert.equal(writeTransferDraft("12","mission","x".repeat(MAX_DRAFT_LENGTH+1),s),false);
  assert.equal(writeTransferDraft("12","mission",null,s),false);
  const blocked={getItem(){throw Error("blocked")},setItem(){throw Error("blocked")},removeItem(){throw Error("blocked")}};
  assert.equal(readTransferDraft("12","mission","starter",blocked),"starter");
  assert.equal(writeTransferDraft("12","mission","source",blocked),false);
  assert.equal(clearTransferDraft("12","mission",blocked),false);
});
test("mission Julia Test export preserves source and exposes four independent named cases",()=>{
  for(const lesson of ["12","14","15","16"]){
    const code=missionForLesson(lesson).starter;
    const full=buildExternalTestFile(lesson,"mission",code);
    assert.equal(full.filename,"amp-julia-lab-lesson-"+lesson+"-transfer-mission-tests.jl");
    assert.ok(full.content.includes(code));
    assert.equal((full.content.match(/@testset /g)||[]).length,5);
    assert.ok(full.content.startsWith("using Test\nusing LinearAlgebra"));
    const suite=externalTestSuite(lesson,"mission");
    for(const [i,item] of suite.cases.entries()){
      const selected=buildExternalTestFile(lesson,"mission",code,item.name);
      assert.equal(selected.filename,"amp-julia-lab-lesson-"+lesson+"-transfer-mission-case-"+String(i+1).padStart(2,"0")+"-tests.jl");
      assert.equal((selected.content.match(/@testset /g)||[]).length,2);
      assert.ok(selected.content.includes(item.assertion));
    }
    assert.throws(()=>buildExternalTestFile(lesson,"mission",code,"__proto__"),RangeError);
  }
});
test("mission source is a genuine incomplete Julia function, not a fabricated solver",()=>{
  for(const id of ["12","14","15","16"]){
    const starter=missionForLesson(id).starter;
    assert.match(starter,/^using LinearAlgebra\nfunction /);
    assert.match(starter,/error\("TODO: implement [a-z_]+"/);
    assert.ok(starter.endsWith("\nend\n"));
    assert.doesNotMatch(starter,/^\s*return\s*\(.*residual=/m);
  }
});
