import test from "node:test";
import assert from "node:assert/strict";
import {matrixPresets,normNames,vectorNorm,matrixTimesVector,determinant,matrixInverse,normBoundary,explore,displayNumber} from "../src/numerical-model.js";
import {settingsFromStorage,saveExperiment} from "../src/numerical-view.js";

const near=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<=tol,String(a)+" != "+String(b));
test("Euclidean, one and infinity norms match AMP definitions",()=>{
  assert.equal(vectorNorm([-3,4],"one"),7);
  assert.equal(vectorNorm([-3,4],"two"),5);
  assert.equal(vectorNorm([-3,4],"infinity"),4);
  assert.equal(vectorNorm([0,0],"two"),0);
  assert.throws(()=>vectorNorm([1],"two"),/Invalid vector/);
  assert.throws(()=>vectorNorm([1,2],"four"),/Invalid vector/);
});
test("matrix actions, determinant, and singular inverse are correct",()=>{
  assert.deepEqual(matrixTimesVector(matrixPresets.stretch.values,[2,-2]),[4,-1]);
  assert.deepEqual(matrixTimesVector(matrixPresets.shear.values,[2,3]),[5,3]);
  assert.deepEqual(matrixTimesVector(matrixPresets.rotation.values,[1,2]),[-2,1]);
  assert.equal(determinant(matrixPresets.stretch.values),1);
  assert.equal(determinant(matrixPresets.singular.values),0);
  assert.equal(matrixInverse(matrixPresets.singular.values),null);
  const inverse=matrixInverse(matrixPresets.shear.values);
  assert.deepEqual(matrixTimesVector(inverse,matrixTimesVector(matrixPresets.shear.values,[2,-3])),[2,-3]);
});
test("every norm boundary point has p-norm one",()=>{
  for(const kind of Object.keys(normNames)){
    const points=normBoundary(kind,96);
    assert.equal(points.length,97);
    points.forEach(v=>near(vectorNorm(v,kind),1));
    near(points[0][0],points[points.length-1][0]);
    near(points[0][1],points[points.length-1][1]);
  }
});
test("the direct and inverse images are not silently conflated",()=>{
  const view=explore({kind:"two",matrix:"stretch",x:1,y:1});
  near(view.inputNorm,Math.sqrt(2));
  near(view.outputNorm,Math.hypot(2,0.5));
  assert.equal(view.invertible,true);
  for(let i=0;i<view.reference.length;i++)
    near(vectorNorm(matrixTimesVector(matrixPresets.stretch.values,view.inverseImage[i]),"two"),1);
  near(view.reference[24][1],1);
  near(view.direct[24][1],0.5);
  near(view.inverseImage[24][1],2);
  assert.equal(explore({matrix:"singular"}).inverseImage,null);
  assert.equal(explore({matrix:"singular"}).invertible,false);
});
test("invalid presets and nonfinite coordinates fail closed",()=>{
  assert.throws(()=>explore({matrix:"constructor"}),/Invalid experiment/);
  assert.throws(()=>explore({x:Infinity}),/Invalid experiment/);
  assert.throws(()=>explore({x:4}),/Invalid experiment/);
  assert.throws(()=>normBoundary("two",4),/Invalid boundary/);
  assert.equal(displayNumber(1.234567),"1.2346");
  assert.equal(displayNumber(-1e-16),"0");
});
test("experiment persistence is separate and resilient to malformed stored data",()=>{
  const m=new Map(),storage={getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v)};
  assert.deepEqual(settingsFromStorage(storage),{kind:"two",matrix:"stretch",x:1,y:1});
  const setting={kind:"one",matrix:"rotation",x:-2,y:2.5};
  assert.equal(saveExperiment(setting,storage),true);
  assert.deepEqual(settingsFromStorage(storage),setting);
  storage.setItem("amp-julia-lab:numerical-explorer:v1",JSON.stringify({kind:"bad",matrix:"constructor",x:999,y:null}));
  assert.deepEqual(settingsFromStorage(storage),{kind:"two",matrix:"stretch",x:1,y:1});
  const denied={getItem(){throw Error("storage disabled")},setItem(){throw Error("storage disabled")}};
  assert.deepEqual(settingsFromStorage(denied),{kind:"two",matrix:"stretch",x:1,y:1});
  assert.equal(saveExperiment(setting,denied),false);
});
