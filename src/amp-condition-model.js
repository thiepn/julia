// Finite-perturbation practice for AMP relative conditioning. Original examples.
export const CONDITION_FUNCTIONS=Object.freeze({
  affine:{label:"Shifted square (x + 1)²",formula:"(x + 1)²",f:x=>(x+1)**2,df:x=>2*(x+1),
    julia:"f(x) = (x + 1)^2\nfprime(x) = 2*(x + 1)"},
  cosine:{label:"Cosine",formula:"cos(x)",f:Math.cos,df:x=>-Math.sin(x),
    julia:"f(x) = cos(x)\nfprime(x) = -sin(x)"},
  composition:{label:"Composition sin(x² + 1)",formula:"sin(x² + 1)",f:x=>Math.sin(x*x+1),
    df:x=>2*x*Math.cos(x*x+1),
    julia:"f(x) = sin(x^2 + 1)\nfprime(x) = 2*x*cos(x^2 + 1)"}
});
export const CONDITION_INPUTS=Object.freeze([0.2,0.8,1.5,2.5]);
export const CONDITION_EPS=Object.freeze([1e-2,1e-4,1e-6,1e-8]);
export function conditionSample(functionId,x,epsilon){
  if(!Object.hasOwn(CONDITION_FUNCTIONS,functionId)||!CONDITION_INPUTS.includes(x)||!CONDITION_EPS.includes(epsilon))
    throw new RangeError("Unsupported condition input");
  const {f,df}=CONDITION_FUNCTIONS[functionId];
  const base=f(x),changed=f(x*(1+epsilon));
  const analytic=base===0?Infinity:Math.abs(x*df(x)/base);
  const observed=base===0?Infinity:Math.abs((changed-base)/(epsilon*base));
  return {functionId,x,epsilon,base,changed,analytic,observed,
    difference:Number.isFinite(analytic)?Math.abs(observed-analytic):Infinity};
}
export function conditionSweep(functionId,x){
  return CONDITION_EPS.map(epsilon=>conditionSample(functionId,x,epsilon));
}
export function conditionJuliaSource(functionId,x){
  if(!Object.hasOwn(CONDITION_FUNCTIONS,functionId)||!CONDITION_INPUTS.includes(x))
    throw new RangeError("Unknown relative condition exercise");
  const f=CONDITION_FUNCTIONS[functionId];
  return [f.julia,"x = "+x,"f0 = f(x)",
    "kappa = abs(x*fprime(x)/f0)",
    "println(\"analytic relative condition: \", kappa)",
    "for epsilon in [1e-2, 1e-4, 1e-6, 1e-8]",
    "    finite = abs((f(x*(1+epsilon))-f0)/(epsilon*f0))",
    "    println((epsilon=epsilon, finite=finite))",
    "end"].join("\n");
}
