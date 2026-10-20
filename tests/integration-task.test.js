import test from "node:test";
import assert from "node:assert/strict";
import {lessons} from "../src/lessons.js";
import {readDraft,writeDraft,MAX_DRAFT_LENGTH} from "../src/workspace.js";
import {readTransferDraft,writeTransferDraft,clearTransferDraft} from "../src/transfer-drafts.js";
import {missionForLesson} from "../src/numerical-missions.js";
import {INTEGRATION_TASK,integrationForLesson,integrationCases,buildIntegrationTestFile} from "../src/integration-task.js";
const store=()=>{
  const m=new Map();return {m,getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};
};
test("integration is one independently scoped task with real prerequisite interfaces",()=>{
  assert.equal(lessons.length,16);
  for(const id of ["01","08","09","12","13","14","15","__proto__","constructor"])assert.equal(integrationForLesson(id),null);
  assert.equal(integrationForLesson("16"),INTEGRATION_TASK);
  assert.ok(INTEGRATION_TASK.task.includes("solve_checked(A,b)"));
  assert.ok(INTEGRATION_TASK.task.includes("solution_sensitivity(A,b,db)"));
  assert.match(INTEGRATION_TASK.starter,/function analyze_perturbation\(A,b,db\)/);
  assert.match(INTEGRATION_TASK.starter,/TODO/);
  assert.equal(integrationCases().length,5);
  assert.equal(new Set(integrationCases().map(c=>c.name)).size,5);
  for(const c of integrationCases()){
    assert.ok(c.assertion.startsWith("@test "));
    assert.ok(c.assertion.includes("analyze_perturbation("));
  }
});
test("original local drafts and both numerical mission drafts survive integration writes and resets",()=>{
  const s=store();
  const solver="solve_checked(A,b) = (x=A\\b,residual=0.0)";
  const sensitivity="solution_sensitivity(A,b,db) = (change=1.0,original_residual=0.0,perturbed_residual=0.0)";
  assert.equal(writeDraft("16","original source",s),true);
  assert.equal(writeTransferDraft("16","a","transfer source",s),true);
  assert.equal(writeTransferDraft("12","mission",solver,s),true);
  assert.equal(writeTransferDraft("16","mission",sensitivity,s),true);
  assert.equal(writeTransferDraft("16","integration","analyze_perturbation(A,b,db) = nothing",s),true);
  assert.equal(readTransferDraft("16","integration","",s),"analyze_perturbation(A,b,db) = nothing");
  assert.equal(readTransferDraft("12","mission","",s),solver);
  assert.equal(readTransferDraft("16","mission","",s),sensitivity);
  assert.equal(readDraft("16","",s),"original source");
  assert.equal(readTransferDraft("16","a","",s),"transfer source");
  assert.equal(clearTransferDraft("16","integration",s),true);
  assert.equal(readTransferDraft("16","integration","starter",s),"starter");
  assert.equal(readTransferDraft("12","mission","",s),solver);
  assert.equal(readTransferDraft("16","mission","",s),sensitivity);
  assert.equal(s.m.get("amp-julia-lab:transfer-draft:v1:16:mission"),sensitivity);
});
test("cross-lesson bundle exports three unchanged sources and five Julia Test cases",()=>{
  const integration="analyze_perturbation(A,b,db) = (base_residual=0.0,change=0.0,perturbed_residual=0.0)";
  const solver="solve_checked(A,b) = (x=A\\b,residual=0.0)";
  const sensitivity="solution_sensitivity(A,b,db) = (change=0.0,original_residual=0.0,perturbed_residual=0.0)";
  const file=buildIntegrationTestFile(integration,solver,sensitivity);
  assert.equal(file.filename,"amp-julia-lab-12-16-integration-tests.jl");
  assert.equal(file.mime,"text/plain;charset=utf-8");
  assert.ok(file.content.startsWith("using Test\nusing LinearAlgebra"));
  for(const s of [solver,sensitivity,integration])assert.equal(file.content.split(s).length-1,1);
  assert.ok(file.content.indexOf(solver)<file.content.indexOf(sensitivity));
  assert.ok(file.content.indexOf(sensitivity)<file.content.indexOf(integration));
  assert.equal((file.content.match(/@testset /g)||[]).length,6);
  for(const c of integrationCases()){
    assert.ok(file.content.includes(c.assertion));
    assert.ok(file.content.includes('@testset "'+c.name+'"'));
  }
  assert.match(file.content,/Independent Julia tests; no execution or grading/);
});
test("integration export never reads storage or executes injected learner source",()=>{
  const source='error("cannot run during JS export")';
  const file=buildIntegrationTestFile(source,source,source);
  assert.equal(file.content.split(source).length-1,3);
  assert.ok(file.content.includes("cannot run during JS export"));
  assert.equal(integrationForLesson("12"),null);
  assert.throws(()=>buildIntegrationTestFile(null,"abc","def"),RangeError);
  for(const i of [0,1,2]){
    const args=["valid source","valid source","valid source"];
    args[i]="x".repeat(MAX_DRAFT_LENGTH+1);
    assert.throws(()=>buildIntegrationTestFile(...args),RangeError);
  }
});
test("unknown integration task and blocked localStorage fail closed",()=>{
  const s=store();
  assert.equal(writeTransferDraft("12","integration","source",s),false);
  assert.equal(clearTransferDraft("12","integration",s),false);
  assert.equal(writeTransferDraft("__proto__","integration","source",s),false);
  const blocked={getItem(){throw Error("blocked")},setItem(){throw Error("blocked")},removeItem(){throw Error("blocked")}};
  assert.equal(readTransferDraft("16","integration",null,blocked),null);
  assert.equal(writeTransferDraft("16","integration","code",blocked),false);
  assert.equal(clearTransferDraft("16","integration",blocked),false);
  assert.equal(missionForLesson("12").starter.includes("TODO"),true);
  assert.equal(missionForLesson("16").starter.includes("TODO"),true);
});
