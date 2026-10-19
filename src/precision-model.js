// Float64 experiment for the derivative of sin(x); runs in the browser, NOT Julia.
// cos(x) is used as a Float64 reference, not an exact real-number oracle.
export const DERIVATIVE_POINTS=Object.freeze({"0.5":0.5,"1":1,"2":2});
export const DERIVATIVE_METHODS=Object.freeze({
  forward:"Forward difference",
  central:"Central difference",
  stabilized:"Stable forward identity"
});
export const MIN_EXPONENT=1,MAX_EXPONENT=16;
const validPoint=x=>typeof x==="number"&&Object.values(DERIVATIVE_POINTS).includes(x);
const validExponent=k=>Number.isInteger(k)&&k>=MIN_EXPONENT&&k<=MAX_EXPONENT;
const methods=Object.keys(DERIVATIVE_METHODS);
export function derivativeSample(x=1,k=3){
  if(!validPoint(x)||!validExponent(k))throw new RangeError("Unsupported derivative experiment");
  const h=10**(-k),exact=Math.cos(x);
  const forward=(Math.sin(x+h)-Math.sin(x))/h;
  const central=(Math.sin(x+h)-Math.sin(x-h))/(2*h);
  // sin(a+b)-sin(a) = 2cos(a+b/2)sin(b/2); no close-number subtraction.
  const stabilized=Math.cos(x+h/2)*(Math.sin(h/2)/(h/2));
  const approximations={forward,central,stabilized};
  const errors=Object.fromEntries(methods.map(m=>[m,Math.abs(approximations[m]-exact)]));
  return {x,k,h,reference:exact,approximations,errors,
    xPlusUnchanged:x+h===x,xMinusUnchanged:x-h===x};
}
export function observedOrder(previousError,currentError){
  if(!Number.isFinite(previousError)||!Number.isFinite(currentError)||previousError<=0||currentError<=0)return null;
  // Sample spacing is h_{k-1}/h_k = 10, so p = log10(E_{k-1}/E_k).
  return Math.log10(previousError/currentError);
}
export function derivativeSeries(x=1){
  if(!validPoint(x))throw new RangeError("Unsupported evaluation point");
  const values=[];
  for(let k=MIN_EXPONENT;k<=MAX_EXPONENT;k++){
    const sample=derivativeSample(x,k),previous=values.at(-1);
    const rates=Object.fromEntries(methods.map(m=>[m,previous?observedOrder(previous.errors[m],sample.errors[m]):null]));
    values.push({...sample,rates});
  }
  return values;
}
export function compareAt(x=1,k=3){
  if(!validPoint(x)||!validExponent(k))throw new RangeError("Unsupported point or step");
  return derivativeSeries(x)[k-MIN_EXPONENT];
}
export function formatExperimentNumber(n){
  if(n===null||!Number.isFinite(n))return "—";
  if(n===0)return "0 (rounded)";
  if(Math.abs(n)>=1e-3&&Math.abs(n)<1e4)return Number(n.toPrecision(7)).toString();
  return n.toExponential(3);
}
export function derivativeJuliaSource(x=1,k=3){
  if(!validPoint(x)||!validExponent(k))throw new RangeError("Unsupported Julia example");
  return "x = "+x+"\nk = "+k+"\nh = 10.0^(-k)\n"+
    "f(t) = sin(t)\n"+
    "reference = cos(x)\n"+
    "forward = (f(x + h) - f(x)) / h\n"+
    "central = (f(x + h) - f(x - h)) / (2h)\n"+
    "stabilized = cos(x + h/2) * (sin(h/2)/(h/2))\n"+
    "for (label, estimate) in [(\"forward\", forward), (\"central\", central), (\"stable\", stabilized)]\n"+
    "    println(label, \": \", estimate, \"; error: \", abs(estimate-reference))\n"+
    "end\n";
}
