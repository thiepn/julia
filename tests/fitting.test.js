import test from "node:test";
import assert from "node:assert/strict";
import {fittingDatasets,DEFAULT_FIT,validFitSettings,leastSquaresReference,analyzeFit,sumSquaredResiduals,formatFitNumber,fitJuliaExample} from "../src/fitting-model.js";
import {readFitSettings,writeFitSettings} from "../src/fitting-view.js";
const near=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<=tol,"Expected "+a+" near "+b);

test("least squares recovers exact line with zero residual and zero gradient",()=>{
  const fit=leastSquaresReference("exact");
  assert.equal(fit.unique,true);
  near(fit.intercept,1);near(fit.slope,2);near(fit.minimumSSE,0);
  const evaluated=analyzeFit({...DEFAULT_FIT,intercept:1,slope:2});
  near(evaluated.sse,0);near(evaluated.residualNorm,0);
  evaluated.gradient.forEach(g=>near(g,0));
  assert.equal(evaluated.residuals.length,5);
  near(evaluated.optimalityGap,0);
});
test("noisy and outlier data have distinct source-backed finite minimizers",()=>{
  const noisy=leastSquaresReference("noisy");
  near(noisy.intercept,0.9);near(noisy.slope,2.04);near(noisy.minimumSSE,0.572);
  const outlier=leastSquaresReference("outlier");
  near(outlier.intercept,-0.6);near(outlier.slope,3.6);near(outlier.minimumSSE,25.6);
  assert.notDeepEqual([outlier.intercept,outlier.slope],[noisy.intercept,noisy.slope]);
  for(const [name,ref] of [["noisy",noisy],["outlier",outlier]]){
    const value=analyzeFit({...DEFAULT_FIT,dataset:name,intercept:ref.intercept,slope:ref.slope});
    near(value.sse,ref.minimumSSE);
    value.gradient.forEach(g=>near(g,0));
    assert.ok(analyzeFit({...DEFAULT_FIT,dataset:name}).sse>=ref.minimumSSE);
  }
});
test("rank deficient repeated x values disclose a family rather than unique solution",()=>{
  const ref=leastSquaresReference("singular");
  assert.equal(ref.unique,false);near(ref.targetMean,4);near(ref.minimumSSE,20);
  for(const [intercept,slope] of [[4,0],[2,1],[0,2],[-2,3]]){
    const s=analyzeFit({...DEFAULT_FIT,dataset:"singular",intercept,slope});
    near(s.sse,20);near(s.optimalityGap,0);
    s.gradient.forEach(g=>near(g,0));
  }
  const off=analyzeFit({...DEFAULT_FIT,dataset:"singular"});
  assert.ok(off.sse>ref.minimumSSE);
});
test("objective and analytic gradient agree with independent finite perturbations",()=>{
  const setting={...DEFAULT_FIT,dataset:"noisy",intercept:1.1,slope:1.8};
  const base=analyzeFit(setting),h=1e-6;
  for(const [name,position] of [["intercept",0],["slope",1]]){
    const plus=analyzeFit({...setting,[name]:setting[name]+h}).sse;
    const minus=analyzeFit({...setting,[name]:setting[name]-h}).sse;
    near((plus-minus)/(2*h),base.gradient[position],1e-7);
  }
  near(sumSquaredResiduals(fittingDatasets.noisy.points,setting.intercept,setting.slope),base.sse);
  near(base.residualNorm**2,base.sse);
});
test("invalid and prototype-key settings are rejected rather than executed",()=>{
  assert.equal(validFitSettings(DEFAULT_FIT),true);
  assert.equal(validFitSettings({...DEFAULT_FIT,dataset:"constructor"}),false);
  assert.equal(validFitSettings({...DEFAULT_FIT,slope:Infinity}),false);
  assert.equal(validFitSettings({...DEFAULT_FIT,intercept:10}),false);
  assert.equal(validFitSettings({...DEFAULT_FIT,showResiduals:"yes"}),false);
  assert.throws(()=>leastSquaresReference("__proto__"),RangeError);
  assert.throws(()=>analyzeFit({...DEFAULT_FIT,dataset:"constructor"}),RangeError);
  assert.throws(()=>sumSquaredResiduals([[1,NaN]],1,1),TypeError);
  assert.equal(formatFitNumber(0),"0");
});
test("browser local settings are isolated and fail safely if denied or malformed",()=>{
  const map=new Map(),storage={getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,v)};
  assert.deepEqual(readFitSettings(storage),DEFAULT_FIT);
  const custom={dataset:"outlier",intercept:-0.6,slope:3.6,showResiduals:false};
  assert.equal(writeFitSettings(custom,storage),true);
  assert.deepEqual(readFitSettings(storage),custom);
  assert.equal(writeFitSettings({...custom,dataset:"constructor"},storage),false);
  assert.deepEqual(readFitSettings(storage),custom);
  storage.setItem("amp-julia-lab:fit:v1",JSON.stringify({...custom,slope:"3.6"}));
  assert.deepEqual(readFitSettings(storage),DEFAULT_FIT);
  const denied={getItem(){throw Error("denied")},setItem(){throw Error("denied")}};
  assert.deepEqual(readFitSettings(denied),DEFAULT_FIT);
  assert.equal(writeFitSettings(custom,denied),false);
});
test("Julia sample uses the selected data but is never executed by the browser",()=>{
  const source=fitJuliaExample("outlier");
  assert.match(source,/using LinearAlgebra/);
  assert.match(source,/A = hcat\(ones\(length\(t\)\), t\)/);
  assert.match(source,/rank\(A\)/);
  assert.match(source,/coeff = A \\ y/);
  assert.match(source,/17\.0/);
  assert.throws(()=>fitJuliaExample("invalid"),RangeError);
});
