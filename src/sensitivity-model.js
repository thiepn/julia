// Source-aligned Lesson 16 conditioning and sensitivity experiment.
// Fixed diagonal 2x2 problems evaluated in JS binary64; no Julia code execution.
export const DIAGONAL_SCALES=Object.freeze([1,0.1,0.01,0.001,0.000001]);
export const PERTURBATIONS=Object.freeze([0,0.000001,0.00001,0.0001]);
export const RHS_PRESETS=Object.freeze({
  exercise:{label:"AMP exercise b = [1, 2]",b:[1,2]},
  direction:{label:"Direction comparison b = [1, 0]",b:[1,0]}
});
export const DEFAULT_SENSITIVITY=Object.freeze({scale:0.000001,delta:0.000001,rhs:"exercise"});
export function validSensitivity(settings){
  return !!settings&&typeof settings==="object"&&
    DIAGONAL_SCALES.includes(settings.scale)&&
    PERTURBATIONS.includes(settings.delta)&&
    Object.hasOwn(RHS_PRESETS,settings.rhs);
}
const norm=v=>Math.hypot(...v);
export function sensitivitySample(settings=DEFAULT_SENSITIVITY){
  if(!validSensitivity(settings))throw new RangeError("Unsupported conditioning experiment");
  const {scale,delta,rhs}=settings;
  const b=RHS_PRESETS[rhs].b;
  const db=[0,delta];
  const bPerturbed=[b[0],b[1]+delta];
  // Exact algebraic solution formulas for the selected diagonal matrix,
  // evaluated using finite-precision JavaScript Number arithmetic.
  const x=[b[0],b[1]/scale],xPerturbed=[bPerturbed[0],bPerturbed[1]/scale];
  const solutionDifference=xPerturbed.map((v,i)=>v-x[i]);
  const errorNorm=norm(solutionDifference);
  const residualOriginal=[xPerturbed[0]-b[0],scale*xPerturbed[1]-b[1]];
  const residualPerturbed=[xPerturbed[0]-bPerturbed[0],scale*xPerturbed[1]-bPerturbed[1]];
  const rightSideChange=norm(db);
  const relativeData=rightSideChange/norm(b);
  const relativeSolution=errorNorm/norm(x);
  const cond=1/scale; // exact 2-norm condition number for diag(1,scale), 0<scale<=1.
  const amplification=relativeData===0?null:relativeSolution/relativeData;
  return {scale,delta,rhs,b:[...b],db,bPerturbed,x,xPerturbed,solutionDifference,
    errorNorm,residualOriginalNorm:norm(residualOriginal),
    residualPerturbedNorm:norm(residualPerturbed),relativeData,relativeSolution,
    conditionNumber:cond,relativeBound:cond*relativeData,amplification,
    referenceAbsoluteChange:scale===1?Math.abs(delta):Math.abs(delta)/scale,
    isIllConditioned:cond>=1000};
}
export function sensitivityComparison({rhs="exercise",delta=0.000001}={}){
  if(!Object.hasOwn(RHS_PRESETS,rhs)||!PERTURBATIONS.includes(delta))
    throw new RangeError("Unsupported comparison");
  return DIAGONAL_SCALES.map(scale=>sensitivitySample({scale,delta,rhs}));
}
export function numericalString(value){
  if(value===null || !Number.isFinite(value))return "—";
  if(value===0 || Math.abs(value)<1e-14)return "0";
  if(Math.abs(value)>=0.001 && Math.abs(value)<1000000)return String(Number(value.toPrecision(7)));
  return value.toExponential(3);
}
export function conditioningJuliaExample(settings=DEFAULT_SENSITIVITY){
  if(!validSensitivity(settings))throw new RangeError("Unsupported Julia example");
  const {scale,delta,rhs}=settings;
  const b=RHS_PRESETS[rhs].b;
  return "using LinearAlgebra\n"+
    "A = [1.0 0.0; 0.0 "+scale+"]\n"+
    "b = ["+b[0]+".0, "+b[1]+".0]\n"+
    "delta_b = [0.0, "+delta+"]\n"+
    "x = A \\ b\n"+
    "x_perturbed = A \\ (b + delta_b)\n"+
    "println(\"solution change: \", norm(x_perturbed - x))\n"+
    "println(\"residual against original b: \", norm(A*x_perturbed - b))\n"+
    "println(\"relative solution change: \", norm(x_perturbed-x)/norm(x))\n"+
    "println(\"condition number: \", cond(A))\n";
}
