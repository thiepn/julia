// Original least-squares method comparison. The browser uses JS Number, not Julia.
export const METHOD_CASES=Object.freeze({
  balanced:Object.freeze({label:"Well-separated measurements",t:[-2,-1,1,2],y:[0,1,5,6]}),
  noisy:Object.freeze({label:"Noisy measurements",t:[-2,-1,0,1,2],y:[0,1.1,2.8,4.2,5.1]}),
  close:Object.freeze({label:"Nearly dependent columns",t:[1,1+1e-8,1+2e-8,1+3e-8],y:[3,3+2e-8,3+4e-8,3+6e-8]}),
  repeated:Object.freeze({label:"Rank-deficient measurements",t:[2,2,2,2],y:[1,2,3,4]})
});
const norm=v=>Math.hypot(...v);
function metrics(A,b,c){
  if(!c)return null;
  const residual=A.map((row,i)=>row[0]*c[0]+row[1]*c[1]-b[i]);
  return {coefficients:c,residual:norm(residual),
    normalOrthogonality:norm([0,1].map(j=>A.reduce((s,row,i)=>s+row[j]*residual[i],0)))};
}
// Householder reflectors are applied to A and b, avoiding A'A in the QR solve.
export function householderFit(A,b){
  if(!Array.isArray(A)||A.length<2||A.some(row=>!Array.isArray(row)||row.length!==2||!row.every(Number.isFinite))||
      !Array.isArray(b)||b.length!==A.length||!b.every(Number.isFinite))throw new TypeError("Expected finite tall two-column system");
  const m=A.length,R=A.map(r=>r.slice()),z=b.slice(),size=norm(A.flat());
  for(let k=0;k<2;k++){
    const v=Array.from({length:m-k},(_,i)=>R[k+i][k]),length=norm(v);
    if(length<=1e-12*size)return null;
    v[0]+=v[0]>=0?length:-length;
    const vsize=norm(v);
    if(!Number.isFinite(vsize)||vsize===0)return null;
    for(let i=0;i<v.length;i++)v[i]/=vsize;
    for(let j=k;j<2;j++){
      let projection=0;
      for(let i=0;i<v.length;i++)projection+=v[i]*R[k+i][j];
      for(let i=0;i<v.length;i++)R[k+i][j]-=2*v[i]*projection;
    }
    let projection=0;
    for(let i=0;i<v.length;i++)projection+=v[i]*z[k+i];
    for(let i=0;i<v.length;i++)z[k+i]-=2*v[i]*projection;
  }
  if(Math.abs(R[1][1])<=1e-12*size)return null;
  const slope=z[1]/R[1][1],intercept=(z[0]-R[0][1]*slope)/R[0][0];
  return [intercept,slope].every(Number.isFinite)?[intercept,slope]:null;
}
export function normalEquationFit(A,b){
  if(!Array.isArray(A)||A.length<2||A.some(row=>!Array.isArray(row)||row.length!==2||!row.every(Number.isFinite))||
      !Array.isArray(b)||b.length!==A.length||!b.every(Number.isFinite))throw new TypeError("Expected finite tall two-column system");
  const s00=A.length,s01=A.reduce((s,r)=>s+r[1],0),s11=A.reduce((s,r)=>s+r[1]*r[1],0);
  const t0=b.reduce((s,y)=>s+y,0),t1=b.reduce((s,y,i)=>s+A[i][1]*y,0);
  const det=s00*s11-s01*s01;
  // A'A can become singular in binary64 even when A has full column rank.
  if(!Number.isFinite(det)||det<=Number.EPSILON*Math.max(1,Math.abs(s00*s11),Math.abs(s01*s01)))return null;
  const solution=[(s11*t0-s01*t1)/det,(s00*t1-s01*t0)/det];
  return solution.every(Number.isFinite)?solution:null;
}
export function analyzeMethods(id){
  if(!Object.hasOwn(METHOD_CASES,id))throw new RangeError("Unknown least-squares comparison");
  const {t,y}=METHOD_CASES[id],A=t.map(x=>[1,x]);
  const qr=metrics(A,y,householderFit(A,y)),normal=metrics(A,y,normalEquationFit(A,y));
  return {id,rows:t.map((x,i)=>({x,y:y[i]})),qr,normal,qrRank:qr?2:1,
    caution:id==="close"
      ?"The normal equations square the condition number. Binary64 may lose a unique solution that QR still resolves."
      :id==="repeated"
      ?"Repeated x gives rank(A)=1. Neither method determines a unique intercept and slope."
      :"Compare coefficient values, residual norms and Aᵀr. The two methods solve the same minimization problem."};
}
export function methodsJuliaSource(id){
  if(!Object.hasOwn(METHOD_CASES,id))throw new RangeError("Unknown comparison");
  const {t,y}=METHOD_CASES[id],num=n=>Number.isInteger(n)?n+".0":String(n);
  return ["using LinearAlgebra, Test",
    "t = ["+t.map(num).join(", ")+"]",
    "y = ["+y.map(num).join(", ")+"]",
    "A = hcat(ones(length(t)), t)",
    "println(\"rank(A): \", rank(A))",
    "println(\"cond(A): \", cond(A))",
    "println(\"cond(A'*A): \", cond(A'*A))",
    "c_qr = qr(A) \\ y",
    "println(\"QR coefficients: \", c_qr)",
    "println(\"QR residual: \", norm(A*c_qr-y))",
    "println(\"QR orthogonality: \", norm(A'*(A*c_qr-y)))",
    "try",
    "    c_ne = (A'*A) \\ (A'*y)",
    "    println(\"Normal-equation coefficients: \", c_ne)",
    "    println(\"Normal-equation residual: \", norm(A*c_ne-y))",
    "catch err",
    "    println(\"Normal equations failed: \", typeof(err))",
    "end",
    "# A rank-deficient matrix has no unique coefficient vector."
  ].join("\n")+"\n";
}
