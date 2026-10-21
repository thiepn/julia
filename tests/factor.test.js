import test from "node:test";
import assert from "node:assert/strict";
import {FACTORIZATION_CASES,FACTORIZATION_MODES,factorTrace,frobeniusDifference,fmt,juliaFactorExample} from "../src/factor-model.js";
import {readFactorSettings,saveFactorSettings} from "../src/factor-view.js";
const near=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<=tol,"Expected "+a+" near "+b);

test("five original matrix examples support both independent factorization traces",()=>{
  assert.equal(Object.keys(FACTORIZATION_CASES).length,5);
  assert.deepEqual(Object.keys(FACTORIZATION_MODES),["qr","cholesky"]);
  for(const key of Object.keys(FACTORIZATION_CASES)){
    for(const method of Object.keys(FACTORIZATION_MODES)){
      const t=factorTrace(key,method);
      assert.equal(t.caseId,key);assert.equal(t.mode,method);
      assert.equal(t.steps[0].kind,"start");
      assert.ok(t.steps.length>=2);
      assert.equal(t.steps[0].q.length,2);
      assert.ok(t.steps.every(s=>s.q.length===2&&s.r.length===2&&s.l.length===2));
      // Snapshots must be independent, so later factor edits never change past snapshots.
      assert.equal(t.steps[0].q[0][0],null);
      assert.equal(t.steps[0].l[0][0],null);
    }
  }
});
test("positive-definite input supports QR with low reconstruction AND orthogonality errors",()=>{
  const t=factorTrace("spd","qr");
  assert.equal(t.status,"complete");
  assert.equal(t.steps.length,6);
  assert.deepEqual(t.steps.map(s=>s.kind),["start","first","projection","subtract","second","complete"]);
  assert.ok(t.metrics.reconstruction<1e-12);
  assert.ok(t.metrics.orthogonality<1e-12);
  assert.ok(t.steps[1].q[0][0]>0);
  assert.equal(t.steps[1].r[0][1],null);
  assert.notEqual(t.steps.at(-1).r[0][1],null);
});
test("positive-definite input supports Cholesky using sqrt pivots",()=>{
  const t=factorTrace("spd","cholesky");
  assert.equal(t.status,"complete");
  assert.equal(t.steps.length,6);
  near(t.steps[1].l[0][0],2);
  near(t.steps[2].l[1][0],1);
  assert.equal(t.steps[3].l[1][1],null);
  near(t.steps[4].l[1][1],Math.sqrt(2));
  assert.ok(t.metrics.reconstruction<1e-12);
  assert.equal(t.metrics.orthogonality,undefined);
});
test("matrix property failures explicitly stop the attempted method",()=>{
  const notSym=factorTrace("nonsymmetric","cholesky");
  assert.equal(notSym.status,"not-symmetric");
  assert.match(notSym.reason,/a₁₂ and a₂₁ differ/);
  assert.equal(notSym.metrics,null);
  assert.equal(factorTrace("nonsymmetric","qr").status,"complete");
  const indefinite=factorTrace("indefinite","cholesky");
  assert.equal(indefinite.status,"not-positive-definite");
  assert.match(indefinite.steps.at(-1).note,/Schur-complement/);
  assert.equal(factorTrace("indefinite","qr").status,"complete");
  const rankQR=factorTrace("rankdef","qr");
  assert.equal(rankQR.status,"rank-deficient");
  assert.equal(rankQR.metrics,null);
  assert.equal(rankQR.steps.at(-1).kind,"blocked");
  assert.equal(factorTrace("rankdef","cholesky").status,"not-positive-definite");
});
test("near-dependence can degrade QR orthogonality despite tiny reconstruction error",()=>{
  const nearQR=factorTrace("close","qr");
  assert.equal(nearQR.status,"complete");
  assert.ok(nearQR.metrics.reconstruction<1e-12);
  assert.ok(nearQR.metrics.orthogonality>1e-9);
  assert.ok(factorTrace("close","cholesky").status==="complete");
});
test("matrix Frobenius comparison validates dimensions and format",()=>{
  near(frobeniusDifference([[1,2],[3,4]],[[1,2],[3,4]]),0);
  near(frobeniusDifference([[1,2],[3,4]],[[2,2],[3,4]]),1);
  assert.throws(()=>frobeniusDifference([[1,2]],[[1,2]]),TypeError);
  assert.throws(()=>factorTrace("constructor","qr"),RangeError);
  assert.throws(()=>factorTrace("spd","__proto__"),RangeError);
  assert.equal(fmt(null),"—");
  assert.equal(fmt(0),"0");
});
test("Julia samples preserve selected matrices and use relevant library methods",()=>{
  const qr=juliaFactorExample("nonsymmetric","qr");
  assert.match(qr,/using LinearAlgebra/);
  assert.match(qr,/A = \[2\.0 1\.0; 0\.0 3\.0\]/);
  assert.match(qr,/F = qr\(A\)/);
  assert.match(qr,/norm\(Q'\*Q - I\)/);
  const chol=juliaFactorExample("spd","cholesky");
  assert.match(chol,/isposdef\(A\)/);
  assert.match(chol,/cholesky\(A\)/);
  assert.match(chol,/norm\(A - L\*L'\)/);
  assert.throws(()=>juliaFactorExample("bogus","qr"),RangeError);
});
test("factor preferences are private, validated, and storage failures are handled",()=>{
  const data=new Map();
  const s={getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v)};
  assert.deepEqual(readFactorSettings(s),{caseId:"spd",mode:"qr"});
  assert.equal(saveFactorSettings({caseId:"indefinite",mode:"cholesky"},s),true);
  assert.deepEqual(readFactorSettings(s),{caseId:"indefinite",mode:"cholesky"});
  assert.equal(saveFactorSettings({caseId:"constructor",mode:"qr"},s),false);
  s.setItem("amp-julia-lab:factor:v1",JSON.stringify({caseId:"__proto__",mode:"constructor"}));
  assert.deepEqual(readFactorSettings(s),{caseId:"spd",mode:"qr"});
  const denied={getItem(){throw Error("denied")},setItem(){throw Error("denied")}};
  assert.deepEqual(readFactorSettings(denied),{caseId:"spd",mode:"qr"});
  assert.equal(saveFactorSettings({caseId:"spd",mode:"qr"},denied),false);
});
