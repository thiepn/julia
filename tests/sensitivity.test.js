import test from "node:test";
import assert from "node:assert/strict";
import {DIAGONAL_SCALES,PERTURBATIONS,RHS_PRESETS,DEFAULT_SENSITIVITY,validSensitivity,sensitivitySample,sensitivityComparison,numericalString,conditioningJuliaExample} from "../src/sensitivity-model.js";
import {readSensitivitySettings,writeSensitivitySettings} from "../src/sensitivity-view.js";
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol,"Expected "+a+" near "+b);
test("AMP task: same tiny right-hand-side change gives 1e-6 versus about 1 solution difference",()=>{
  const well=sensitivitySample({scale:1,delta:1e-6,rhs:"exercise"});
  const ill=sensitivitySample({scale:1e-6,delta:1e-6,rhs:"exercise"});
  near(well.errorNorm,1e-6,1e-9);
  near(ill.errorNorm,1,1e-8);
  assert.equal(well.conditionNumber,1);
  assert.equal(ill.conditionNumber,1e6);
  assert.deepEqual(ill.x,[1,2000000]);
  near(ill.residualOriginalNorm,1e-6,1e-12);
  near(ill.residualPerturbedNorm,0,1e-12);
});
test("condition number bounds relative change but does not predict every particular amplification",()=>{
  for(const scale of DIAGONAL_SCALES){
    for(const rhs of Object.keys(RHS_PRESETS)){
      const sample=sensitivitySample({scale,rhs,delta:1e-6});
      assert.ok(sample.amplification<=sample.conditionNumber*(1+1e-8));
      assert.ok(sample.relativeSolution<=sample.relativeBound*(1+1e-8));
      near(sample.residualOriginalNorm,1e-6,1e-10);
      near(sample.residualPerturbedNorm,0,1e-10);
    }
  }
  const directed=sensitivitySample({scale:1e-6,delta:1e-6,rhs:"direction"});
  near(directed.amplification,1e6,1e-7);
  near(directed.relativeSolution,1,1e-8);
  const canonical=sensitivitySample(DEFAULT_SENSITIVITY);
  near(canonical.amplification,Math.sqrt(5)/2,1e-7);
  assert.ok(canonical.relativeSolution<1e-5);
  assert.ok(canonical.errorNorm>0.99);
});
test("no perturbation has zero residual and undefined amplification, not a numerical grade",()=>{
  for(const rhs of Object.keys(RHS_PRESETS)){
    const sample=sensitivitySample({scale:1e-6,delta:0,rhs});
    assert.equal(sample.errorNorm,0);
    assert.equal(sample.relativeData,0);
    assert.equal(sample.relativeSolution,0);
    assert.equal(sample.relativeBound,0);
    assert.equal(sample.amplification,null);
    assert.equal(numericalString(sample.amplification),"—");
    assert.equal(sample.residualOriginalNorm,0);
  }
});
test("comparison rows retain monotone absolute sensitivity and correct condition numbers",()=>{
  const rows=sensitivityComparison({rhs:"exercise",delta:1e-6});
  assert.equal(rows.length,5);
  assert.deepEqual(rows.map(r=>r.scale),DIAGONAL_SCALES);
  for(let i=0;i<rows.length;i++){
    near(rows[i].conditionNumber,1/rows[i].scale,1e-10);
    if(i>0)assert.ok(rows[i].errorNorm>rows[i-1].errorNorm);
  }
  assert.equal(PERTURBATIONS.length,4);
});
test("invalid and prototype-key data cannot become experiment state",()=>{
  assert.equal(validSensitivity(DEFAULT_SENSITIVITY),true);
  assert.equal(validSensitivity({...DEFAULT_SENSITIVITY,scale:0}),false);
  assert.equal(validSensitivity({...DEFAULT_SENSITIVITY,rhs:"constructor"}),false);
  assert.equal(validSensitivity({...DEFAULT_SENSITIVITY,delta:NaN}),false);
  assert.throws(()=>sensitivitySample({scale:1,delta:0.0000001,rhs:"exercise"}),RangeError);
  assert.throws(()=>sensitivityComparison({rhs:"__proto__",delta:1e-6}),RangeError);
  assert.throws(()=>conditioningJuliaExample({scale:1,delta:0,rhs:"constructor"}),RangeError);
});
test("Julia handoff uses actual selected matrix and b but does not execute it",()=>{
  const code=conditioningJuliaExample({scale:1e-6,delta:1e-6,rhs:"exercise"});
  assert.match(code,/using LinearAlgebra/);
  assert.match(code,/A = \[1\.0 0\.0; 0\.0 0\.000001\]/);
  assert.match(code,/b = \[1\.0, 2\.0\]/);
  assert.match(code,/delta_b = \[0\.0, 0\.000001\]/);
  assert.match(code,/x = A \\ b/);
  assert.match(code,/cond\(A\)/);
  assert.equal(numericalString(1e-6),"1.000e-6");
});
test("independent local settings validate data and recover safely when storage is denied",()=>{
  const data=new Map();
  const store={getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v)};
  assert.deepEqual(readSensitivitySettings(store),DEFAULT_SENSITIVITY);
  const changed={scale:0.01,delta:0.0001,rhs:"direction"};
  assert.equal(writeSensitivitySettings(changed,store),true);
  assert.deepEqual(readSensitivitySettings(store),changed);
  assert.equal(writeSensitivitySettings({...changed,rhs:"__proto__"},store),false);
  store.setItem("amp-julia-lab:sensitivity:v1",JSON.stringify({...changed,scale:0}));
  assert.deepEqual(readSensitivitySettings(store),DEFAULT_SENSITIVITY);
  const denied={getItem(){throw Error("denied")},setItem(){throw Error("denied")}};
  assert.deepEqual(readSensitivitySettings(denied),DEFAULT_SENSITIVITY);
  assert.equal(writeSensitivitySettings(changed,denied),false);
});
