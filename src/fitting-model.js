// Original least-squares learning examples for AMP, computed in JavaScript Number.
// This is NOT Julia execution or verification of any learner-authored Julia source.
export const fittingDatasets=Object.freeze({
  exact:{label:"Exact line",points:[[0,1],[1,3],[2,5],[3,7],[4,9]]},
  noisy:{label:"Noisy measurements",points:[[0,1],[1,2.7],[2,5.4],[3,6.5],[4,9.3]]},
  outlier:{label:"With an outlier",points:[[0,1],[1,3],[2,5],[3,7],[4,17]]},
  singular:{label:"Repeated x values",points:[[2,1],[2,3],[2,5],[2,7]]}
});
export const LIMITS=Object.freeze({intercept:[-3,6],slope:[-1,5]});
export const DEFAULT_FIT=Object.freeze({dataset:"exact",intercept:0,slope:1,showResiduals:true});
export function validFitSettings(s){
  return !!s&&typeof s==="object"&&Object.hasOwn(fittingDatasets,s.dataset)&&
    ["intercept","slope"].every(k=>typeof s[k]==="number"&&Number.isFinite(s[k])&&s[k]>=LIMITS[k][0]&&s[k]<=LIMITS[k][1])&&
    typeof s.showResiduals==="boolean";
}
export function leastSquaresReference(id){
  if(!Object.hasOwn(fittingDatasets,id))throw new RangeError("Unknown sample data");
  const pts=fittingDatasets[id].points,n=pts.length;
  const xbar=pts.reduce((s,p)=>s+p[0],0)/n, ybar=pts.reduce((s,p)=>s+p[1],0)/n;
  const sxx=pts.reduce((s,p)=>s+(p[0]-xbar)**2,0);
  if(sxx<=1e-12){
    return {unique:false,intercept:ybar,slope:0,atX:xbar,targetMean:ybar,
      minimumSSE:pts.reduce((s,p)=>s+(p[1]-ybar)**2,0)};
  }
  const sxy=pts.reduce((s,p)=>s+(p[0]-xbar)*(p[1]-ybar),0);
  const slope=sxy/sxx,intercept=ybar-slope*xbar;
  return {unique:true,intercept,slope,minimumSSE:sumSquaredResiduals(pts,intercept,slope)};
}
export function sumSquaredResiduals(points,intercept,slope){
  if(!Array.isArray(points)||points.length===0||!points.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite))||
      !Number.isFinite(intercept)||!Number.isFinite(slope))throw new TypeError("Invalid fitting data");
  return points.reduce((sum,[x,y])=>sum+(y-intercept-slope*x)**2,0);
}
export function analyzeFit(settings=DEFAULT_FIT){
  if(!validFitSettings(settings))throw new RangeError("Invalid least-squares experiment");
  const pts=fittingDatasets[settings.dataset].points,ref=leastSquaresReference(settings.dataset);
  const residuals=pts.map(([x,y])=>({x,y,predicted:settings.intercept+settings.slope*x,
    residual:y-(settings.intercept+settings.slope*x)}));
  const sse=residuals.reduce((s,r)=>s+r.residual**2,0);
  const gradient=[
    -2*residuals.reduce((s,r)=>s+r.residual,0),
    -2*residuals.reduce((s,r)=>s+r.x*r.residual,0)
  ];
  const optimalityGap=sse-ref.minimumSSE;
  return {points:pts,residuals,sse,residualNorm:Math.sqrt(sse),gradient,reference:ref,
    optimalityGap:Math.max(0,optimalityGap),
    dataset:settings.dataset,intercept:settings.intercept,slope:settings.slope,showResiduals:settings.showResiduals};
}
export function formatFitNumber(n){
  if(!Number.isFinite(n))return "—";
  if(Math.abs(n)<5e-11)return "0";
  return String(Number(n.toFixed(5)));
}
export function fitJuliaExample(id){
  if(!Object.hasOwn(fittingDatasets,id))throw new RangeError("Unknown dataset");
  const pts=fittingDatasets[id].points;
  const num=n=>Number.isInteger(n)?n+".0":String(n);
  const t="["+pts.map(p=>num(p[0])).join(", ")+"]";
  const y="["+pts.map(p=>num(p[1])).join(", ")+"]";
  return "using LinearAlgebra\n"+
    "t = "+t+"\n"+"y = "+y+"\n"+
    "A = hcat(ones(length(t)), t)\n"+
    "println(\"rank(A): \", rank(A))\n"+
    "coeff = A \\ y\n"+
    "println(\"one LS solution: \", coeff)\n"+
    "println(\"||A*coeff-y||₂: \", norm(A*coeff-y))\n";
}
