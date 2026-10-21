// Pure browser-side mathematical experiment, independent of the Julia runtime.
// Uses JavaScript Number (IEEE 754 binary64); never asserts Julia code executed.
export const matrixPresets=Object.freeze({
  identity:{label:"Identity",values:[1,0,0,1]},
  stretch:{label:"Stretch (2, 1/2)",values:[2,0,0,0.5]},
  shear:{label:"Horizontal shear",values:[1,1,0,1]},
  rotation:{label:"Quarter turn",values:[0,-1,1,0]},
  singular:{label:"Singular projection",values:[1,0,0,0]}
});
export const normNames=Object.freeze({one:"ℓ₁",two:"ℓ₂",infinity:"ℓ∞"});
const normKinds=Object.keys(normNames);
export function vectorNorm(v,kind="two"){
  if(!Array.isArray(v)||v.length!==2||!v.every(Number.isFinite)||!normKinds.includes(kind))throw new TypeError("Invalid vector or norm");
  if(kind==="one")return Math.abs(v[0])+Math.abs(v[1]);
  if(kind==="infinity")return Math.max(Math.abs(v[0]),Math.abs(v[1]));
  return Math.hypot(...v);
}
export function matrixTimesVector(a,v){
  if(!Array.isArray(a)||a.length!==4||!a.every(Number.isFinite)||!Array.isArray(v)||v.length!==2||!v.every(Number.isFinite))throw new TypeError("Invalid 2×2 transformation");
  return [a[0]*v[0]+a[1]*v[1],a[2]*v[0]+a[3]*v[1]];
}
export function determinant(a){
  if(!Array.isArray(a)||a.length!==4||!a.every(Number.isFinite))throw new TypeError("Invalid matrix");
  return a[0]*a[3]-a[1]*a[2];
}
export function matrixInverse(a){
  const d=determinant(a);
  if(Math.abs(d)<1e-12)return null;
  return [a[3]/d,-a[1]/d,-a[2]/d,a[0]/d];
}
export function normBoundary(kind="two",samples=96){
  if(!normKinds.includes(kind)||!Number.isInteger(samples)||samples<12||samples>512)throw new RangeError("Invalid boundary sampling");
  return Array.from({length:samples+1},(_,i)=>{
    const t=i*2*Math.PI/samples, v=[Math.cos(t),Math.sin(t)];
    const n=vectorNorm(v,kind);
    return v.map(x=>x/n);
  });
}
export function explore({kind="two",matrix="stretch",x=1,y=1}={}){
  if(!normKinds.includes(kind)||!Object.hasOwn(matrixPresets,matrix)||![x,y].every(v=>Number.isFinite(v)&&v>=-3&&v<=3))throw new RangeError("Invalid experiment settings");
  const A=matrixPresets[matrix].values;
  const input=[x,y],output=matrixTimesVector(A,input);
  const inverse=matrixInverse(A);
  const reference=normBoundary(kind);
  return {kind,matrix,input,output,inputNorm:vectorNorm(input,kind),
    outputNorm:vectorNorm(output,kind),det:determinant(A),
    invertible:inverse!==null,
    reference,
    direct:reference.map(v=>matrixTimesVector(A,v)),
    inverseImage:inverse?reference.map(v=>matrixTimesVector(inverse,v)):null};
}
export function displayNumber(value){
  if(!Number.isFinite(value))return "undefined";
  if(Math.abs(value)<1e-10)value=0;
  return String(Number(value.toFixed(4)));
}
