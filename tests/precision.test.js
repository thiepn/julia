import test from "node:test";
import assert from "node:assert/strict";
import {derivativeSample,derivativeSeries,compareAt,observedOrder,formatExperimentNumber,derivativeJuliaSource,DERIVATIVE_METHODS} from "../src/precision-model.js";
import {readPrecisionSettings,savePrecisionSettings} from "../src/precision-view.js";
const close=(x,y,tol=1e-10)=>assert.ok(Math.abs(x-y)<=tol,"Expected "+x+" ≈ "+y);
test("forward and stable identity agree at ordinary step sizes",()=>{
  for(const x of [0.5,1,2])for(const k of [1,2,3,4,5]){
    const s=derivativeSample(x,k);
    close(s.approximations.forward,s.approximations.stabilized,1e-10);
    close(s.reference,Math.cos(x));
    for(const m of Object.keys(DERIVATIVE_METHODS)){
      assert.ok(Number.isFinite(s.approximations[m]));
      assert.ok(s.errors[m]>=0);
    }
  }
});
test("central difference reduces truncation error faster than forward difference",()=>{
  const x=1;
  const a=derivativeSample(x,2),b=derivativeSample(x,3);
  assert.ok(a.errors.central<a.errors.forward);
  assert.ok(b.errors.central<b.errors.forward);
  const rows=derivativeSeries(x);
  assert.ok(rows[2].rates.forward>0.9&&rows[2].rates.forward<1.1);
  assert.ok(rows[2].rates.central>1.9&&rows[2].rates.central<2.1);
});
test("cancellation eventually defeats shrinking the step size",()=>{
  const s=derivativeSample(1,16);
  assert.equal(s.xPlusUnchanged,true);
  assert.equal(s.approximations.forward,0);
  close(s.errors.forward,Math.abs(Math.cos(1)));
  assert.ok(s.errors.stabilized<s.errors.forward);
  const rows=derivativeSeries(1);
  assert.equal(rows.length,16);
  assert.equal(rows[0].k,1);
  assert.equal(rows.at(-1).k,16);
  assert.deepEqual(compareAt(1,16),rows.at(-1));
  assert.ok(rows.some(r=>r.rates.forward!==null&&r.rates.forward<0));
});
test("log errors with rounded-zero observations are explicitly undefined",()=>{
  assert.equal(observedOrder(1e-2,1e-3),1);
  assert.equal(observedOrder(0,1e-4),null);
  assert.equal(observedOrder(1e-5,0),null);
  assert.equal(observedOrder(Infinity,1e-5),null);
  assert.equal(formatExperimentNumber(0),"0 (rounded)");
  assert.equal(formatExperimentNumber(null),"—");
  assert.equal(formatExperimentNumber(0.00123456),"0.00123456");
});
test("invalid evaluation settings are rejected and cannot become code",()=>{
  assert.throws(()=>derivativeSample(4,2),RangeError);
  assert.throws(()=>derivativeSample(1,0),RangeError);
  assert.throws(()=>derivativeSample(1,17),RangeError);
  assert.throws(()=>derivativeSample(1,2.3),RangeError);
  assert.throws(()=>derivativeSeries(NaN),RangeError);
  assert.throws(()=>derivativeJuliaSource(Infinity,1),RangeError);
});
test("generated Julia uses same formulas but is only a code example",()=>{
  const src=derivativeJuliaSource(1,4);
  assert.match(src,/h = 10\.0\^\(-k\)/);
  assert.match(src,/forward = \(f\(x \+ h\) - f\(x\)\) \/ h/);
  assert.match(src,/central = \(f\(x \+ h\) - f\(x - h\)\) \/ \(2h\)/);
  assert.match(src,/stabilized = cos\(x \+ h\/2\)/);
  assert.match(src,/k = 4/);
  assert.doesNotMatch(src,/eval\(/);
});
test("floating-point lab settings are isolated, validated and failure safe",()=>{
  const data=new Map();
  const storage={getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v)};
  assert.deepEqual(readPrecisionSettings(storage),{x:1,k:3});
  assert.equal(savePrecisionSettings({x:2,k:12},storage),true);
  assert.deepEqual(readPrecisionSettings(storage),{x:2,k:12});
  assert.equal(savePrecisionSettings({x:999,k:5},storage),false);
  assert.equal(savePrecisionSettings({x:1,k:100},storage),false);
  assert.deepEqual(readPrecisionSettings(storage),{x:2,k:12});
  storage.setItem("amp-julia-lab:precision:v1",JSON.stringify({x:"1",k:-5}));
  assert.deepEqual(readPrecisionSettings(storage),{x:1,k:3});
  const denied={getItem(){throw Error("denied")},setItem(){throw Error("denied")}};
  assert.deepEqual(readPrecisionSettings(denied),{x:1,k:3});
  assert.equal(savePrecisionSettings({x:1,k:3},denied),false);
});
