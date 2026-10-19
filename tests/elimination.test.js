import test from "node:test";
import assert from "node:assert/strict";
import {linearSystems,pivotModes,eliminationTrace,residualNorm,formatEliminationNumber,juliaExample} from "../src/elimination-model.js";
import {readEliminationSettings,storeEliminationSettings} from "../src/elimination-view.js";
const close=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<=tol,"Expected "+a+" near "+b);
test("all four 3×3 examples are finite and support both pivot modes",()=>{
  assert.equal(Object.keys(linearSystems).length,4);
  assert.deepEqual(Object.keys(pivotModes),["partial","none"]);
  for(const key of Object.keys(linearSystems)){
    for(const mode of Object.keys(pivotModes)){
      const trace=eliminationTrace(key,mode);
      assert.equal(trace.systemId,key);
      assert.equal(trace.pivotMode,mode);
      assert.ok(trace.steps.length>=2);
      assert.equal(trace.steps[0].kind,"initial");
      assert.ok(trace.steps.every(step=>step.rows.length===3&&step.rows.every(r=>r.length===4&&r.every(Number.isFinite))));
    }
  }
});
test("regular system recovers solution and low residual; back-substitution is visible",()=>{
  const a=eliminationTrace("regular","none"),b=eliminationTrace("regular","partial");
  for(const trace of [a,b]){
    assert.equal(trace.status,"solved");
    trace.solution.forEach((x,i)=>close(x,[2,3,-1][i]));
    assert.ok(trace.residual<1e-10);
    assert.equal(trace.steps.at(-1).kind,"complete");
    assert.equal(trace.steps.filter(s=>s.kind==="substitute").length,3);
    assert.equal(trace.steps[0].rows[0][0],2);
    const prev=trace.steps.at(-2).rows;
    assert.equal(trace.steps.at(-1).rows[0][0],prev[0][0]);
    close(residualNorm(linearSystems.regular.a,linearSystems.regular.b,trace.solution),trace.residual);
  }
});
test("zero pivot fails without swaps but partial pivoting succeeds",()=>{
  const without=eliminationTrace("swap","none");
  assert.equal(without.status,"zero-pivot");
  assert.equal(without.solution,null);
  assert.equal(without.steps.at(-1).kind,"blocked");
  assert.match(without.message,/partial pivoting/);
  const withPivot=eliminationTrace("swap","partial");
  assert.equal(withPivot.status,"solved");
  assert.ok(withPivot.steps.some(s=>s.kind==="swap"));
  withPivot.solution.forEach((x,i)=>close(x,[1,2,-1][i]));
  assert.ok(withPivot.residual<1e-10);
});
test("small leading pivot exhibits numerical sensitivity without invented accuracy",()=>{
  const none=eliminationTrace("small","none"),partial=eliminationTrace("small","partial");
  assert.equal(none.status,"solved");
  assert.equal(partial.status,"solved");
  assert.ok(none.residual>1e-10);
  assert.ok(partial.residual<none.residual);
  partial.solution.forEach((x,i)=>close(x,[1,2,3][i]));
});
test("singular matrix never reports a unique solution",()=>{
  const partial=eliminationTrace("singular","partial");
  const none=eliminationTrace("singular","none");
  for(const result of [partial,none]){
    assert.notEqual(result.status,"solved");
    assert.equal(result.solution,null);
    assert.equal(result.residual,null);
    assert.equal(result.steps.at(-1).kind,"blocked");
  }
});
test("generated Julia is valid source text, not execution evidence",()=>{
  const src=juliaExample("regular");
  assert.match(src,/using LinearAlgebra/);
  assert.match(src,/A = \[2\.0 1\.0 -1\.0; -3\.0 -1\.0 2\.0; -2\.0 1\.0 2\.0\]/);
  assert.match(src,/x = A \\ b/);
  assert.match(src,/norm\(A\*x - b\)/);
  assert.throws(()=>juliaExample("unknown"),RangeError);
  assert.equal(formatEliminationNumber(1.23456789),"1.23457");
  assert.throws(()=>eliminationTrace("regular","constructor"),RangeError);
  assert.throws(()=>residualNorm([[1,0],[0,1]],[1,2],[1]),TypeError);
});
test("settings are local, validated, and recover safely from denied storage",()=>{
  const map=new Map();
  const storage={getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,v)};
  const fallback={systemId:"regular",pivotMode:"partial"};
  assert.deepEqual(readEliminationSettings(storage),fallback);
  assert.equal(storeEliminationSettings({systemId:"swap",pivotMode:"none"},storage),true);
  assert.deepEqual(readEliminationSettings(storage),{systemId:"swap",pivotMode:"none"});
  assert.equal(storeEliminationSettings({systemId:"__proto__",pivotMode:"none"},storage),false);
  storage.setItem("amp-julia-lab:elimination:v1",JSON.stringify({systemId:"constructor",pivotMode:"evil"}));
  assert.deepEqual(readEliminationSettings(storage),fallback);
  const denied={getItem(){throw Error("denied")},setItem(){throw Error("denied")}};
  assert.deepEqual(readEliminationSettings(denied),fallback);
  assert.equal(storeEliminationSettings(fallback,denied),false);
});
