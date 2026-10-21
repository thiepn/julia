import test from "node:test";
import assert from "node:assert/strict";
import {ROOT_CASES,ROOT_SWEEPS,rootSample,rootSweep,rootCsv,rootJuliaSource} from "../src/amp-root-model.js";
import {CONDITION_FUNCTIONS,CONDITION_INPUTS,CONDITION_EPS,conditionSample,conditionSweep,conditionJuliaSource} from "../src/amp-condition-model.js";
import {AMP_MISSIONS,ampMission,missionsForLesson,buildAmpJuliaTests} from "../src/amp-missions.js";
test("ill-conditioning and cancellation are different numerical phenomena",()=>{
  const well=rootSample(2,3),close=rootSample(3,9-1e-8),tiny=rootSample(3,1e-12);
  assert.ok(Math.abs(well.stable-1)<1e-12);
  assert.ok(close.conditionMax>10000,"near double root is sensitive");
  assert.ok(close.relativeDiscrepancy<1e-8);
  assert.ok(tiny.conditionMax<2,"tiny root can be well conditioned");
  assert.ok(tiny.relativeDiscrepancy>1e-4,"direct subtraction can still be unstable");
  assert.ok(tiny.stable>0);
  assert.throws(()=>rootSample(0,1));
  assert.throws(()=>rootSample(1,2));
  assert.throws(()=>rootSample(2,0));
  assert.throws(()=>rootSample(2,NaN));
  assert.equal(rootSample(4,16).conditionMax,Infinity);
});
test("original parameter sweeps have finite independent values and valid exports",()=>{
  assert.deepEqual(Object.keys(ROOT_CASES),["separated","near","cancellation","middle"]);
  assert.deepEqual(Object.keys(ROOT_SWEEPS),["near","cancellation"]);
  for(const mode of Object.keys(ROOT_SWEEPS)){
    const samples=rootSweep(mode),csv=rootCsv(mode),julia=rootJuliaSource(mode);
    assert.equal(samples.length,ROOT_SWEEPS[mode].deltas.length);
    assert.ok(samples.every(s=>s.stable>0 && Number.isFinite(s.metric)));
    assert.equal(csv.split("\n").length,samples.length+2);
    assert.match(csv,/relative_condition_max/);
    assert.match(julia,/using PrettyTables/);
    assert.match(julia,/pretty_table\(rows; column_labels/);
  }
  assert.throws(()=>rootSweep("__proto__"));
  assert.throws(()=>rootJuliaSource("invalid"));
});
test("relative conditioning finite differences approach analytic for original functions",()=>{
  for(const id of Object.keys(CONDITION_FUNCTIONS)){
    for(const x of CONDITION_INPUTS){
      const samples=conditionSweep(id,x);
      assert.equal(samples.length,CONDITION_EPS.length);
      assert.ok(samples.every(s=>Number.isFinite(s.analytic)&&Number.isFinite(s.observed)));
      const example=conditionJuliaSource(id,x);
      assert.match(example,/fprime/);
      assert.match(example,/analytic relative condition/);
    }
  }
  assert.ok(Math.abs(conditionSample("affine",1.5,1e-8).analytic-1.2)<1e-12);
  assert.ok(Math.abs(conditionSample("composition",0.8,1e-6).observed-
                     conditionSample("composition",0.8,1e-6).analytic)<1e-4);
  assert.throws(()=>conditionSample("evil",1,1e-4));
  assert.throws(()=>conditionSample("affine",NaN,1e-4));
});
test("three Julia practice contracts reuse source code without shadow grades",()=>{
  assert.equal(Object.keys(AMP_MISSIONS).length,3);
  assert.equal(missionsForLesson("09").length,2);
  assert.equal(missionsForLesson("16").length,1);
  assert.deepEqual(missionsForLesson("01"),[]);
  assert.equal(ampMission("__proto__"),null);
  for(const [id,mission] of Object.entries(AMP_MISSIONS)){
    const script=buildAmpJuliaTests(id,mission.starter);
    assert.match(script.content,/using Test/);
    assert.equal((script.content.match(/@testset /g)||[]).length,5);
    assert.match(script.content,/TODO:/);
    assert.match(script.filename,/\.jl$/);
    assert.equal(mission.checks.length,4);
  }
  assert.throws(()=>buildAmpJuliaTests("bad","x"));
  assert.throws(()=>buildAmpJuliaTests("stable_change","x".repeat(50001)));
});
