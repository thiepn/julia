// Educational 2×2 QR (modified Gram–Schmidt) and Cholesky calculations.
// Only prescribed data are evaluated as JS Number; no Julia execution or grading.
export const FACTORIZATION_CASES=Object.freeze({
  spd:{label:"Symmetric positive-definite",a:[[4,2],[2,3]]},
  nonsymmetric:{label:"Non-symmetric invertible",a:[[2,1],[0,3]]},
  indefinite:{label:"Symmetric indefinite",a:[[1,2],[2,1]]},
  rankdef:{label:"Rank-deficient",a:[[1,2],[2,4]]},
  close:{label:"Nearly dependent columns",a:[[1,1],[1,1.00000001]]}
});
export const FACTORIZATION_MODES=Object.freeze({qr:"QR · orthogonal columns",cholesky:"Cholesky · positive definiteness"});
const empty=()=>[[null,null],[null,null]];
const copy=m=>m.map(row=>row.slice());
const norm=v=>Math.hypot(...v);
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const transpose=a=>[[a[0][0],a[1][0]],[a[0][1],a[1][1]]];
const times=(a,b)=>[
  [a[0][0]*b[0][0]+a[0][1]*b[1][0],a[0][0]*b[0][1]+a[0][1]*b[1][1]],
  [a[1][0]*b[0][0]+a[1][1]*b[1][0],a[1][0]*b[0][1]+a[1][1]*b[1][1]]
];
export function frobeniusDifference(a,b){
  if(![a,b].every(m=>Array.isArray(m)&&m.length===2&&m.every(r=>Array.isArray(r)&&r.length===2&&r.every(Number.isFinite))))throw new TypeError("Invalid 2x2 matrices");
  return Math.hypot(...a.flatMap((row,i)=>row.map((x,j)=>x-b[i][j])));
}
export function factorTrace(caseId="spd",mode="qr"){
  if(!Object.hasOwn(FACTORIZATION_CASES,caseId)||!Object.hasOwn(FACTORIZATION_MODES,mode))throw new RangeError("Unknown factorization selection");
  const a=copy(FACTORIZATION_CASES[caseId].a);
  const steps=[],q=empty(),r=empty(),l=empty();
  const snapshot=(kind,operation,note="",metrics=null)=>{
    steps.push({kind,operation,note,q:copy(q),r:copy(r),l:copy(l),metrics});
  };
  snapshot("start","A = ["+a.map(row=>row.join("  ")).join("; ")+"]","Start with the selected matrix.");
  let status="complete",reason="";
  if(mode==="qr"){
    const a1=[a[0][0],a[1][0]],a2=[a[0][1],a[1][1]];
    const r11=norm(a1);
    if(r11<=1e-12){
      status="rank-deficient";reason="The first column has zero norm; a two-column orthonormal Q cannot be formed in this trace.";
      snapshot("blocked","r₁₁ = ||a₁||₂ = "+fmt(r11),reason);
    }else{
      r[0][0]=r11;
      q[0][0]=a1[0]/r11;q[1][0]=a1[1]/r11;
      snapshot("first","r₁₁ = ||a₁||₂; q₁ = a₁ / r₁₁","Normalize the first column of A.");
      const q1=[q[0][0],q[1][0]];
      r[0][1]=dot(q1,a2);
      snapshot("projection","r₁₂ = q₁' a₂ = "+fmt(r[0][1]),"Project the second column onto q₁.");
      const u=[a2[0]-r[0][1]*q1[0],a2[1]-r[0][1]*q1[1]];
      r[1][1]=norm(u);
      snapshot("subtract","u₂ = a₂ − r₁₂ q₁; ||u₂||₂ = "+fmt(r[1][1]),"Remove the first-column component.");
      if(r[1][1]<=1e-12*r11){
        status="rank-deficient";reason="The second column is dependent at the chosen binary64 tolerance; no full two-column Q is produced.";
        snapshot("blocked","r₂₂ is too small to normalize reliably.",reason);
      }else{
        q[0][1]=u[0]/r[1][1];q[1][1]=u[1]/r[1][1];r[1][0]=0;
        snapshot("second","q₂ = u₂ / r₂₂","Normalize the residual direction.");
        const recon=frobeniusDifference(a,times(q,r));
        const orth=frobeniusDifference(times(transpose(q),q),[[1,0],[0,1]]);
        snapshot("complete","Check A ≈ Q R and Q'Q ≈ I.","Small reconstruction error alone does not establish perfect orthogonality.",{reconstruction:recon,orthogonality:orth});
      }
    }
  }else{
    const tolerance=1e-12*Math.max(1,...a.flat().map(Math.abs));
    if(Math.abs(a[0][1]-a[1][0])>tolerance){
      status="not-symmetric";reason="Cholesky requires a symmetric real matrix; a₁₂ and a₂₁ differ.";
      snapshot("blocked","Test A = A' (symmetry).",reason);
    }else if(a[0][0]<=0){
      status="not-positive-definite";reason="The first diagonal pivot must be strictly positive for Cholesky.";
      snapshot("blocked","Require a₁₁ > 0.",reason);
    }else{
      l[0][0]=Math.sqrt(a[0][0]);l[0][1]=0;
      snapshot("first","l₁₁ = √a₁₁ = "+fmt(l[0][0]),"Use the positive square root.");
      l[1][0]=a[1][0]/l[0][0];
      snapshot("offdiagonal","l₂₁ = a₂₁ / l₁₁ = "+fmt(l[1][0]),"Solve the lower-triangular coefficient.");
      const schur=a[1][1]-l[1][0]**2;
      snapshot("schur","s = a₂₂ − l₂₁² = "+fmt(schur),"The remaining pivot must be positive.");
      if(schur<=tolerance){
        status="not-positive-definite";reason="The remaining Schur-complement pivot is nonpositive (or below tolerance): no positive-definite Cholesky factor is produced.";
        snapshot("blocked","Cholesky requires s > 0.",reason);
      }else{
        l[1][1]=Math.sqrt(schur);
        snapshot("second","l₂₂ = √s = "+fmt(l[1][1]),"Complete the lower-triangular factor.");
        const recon=frobeniusDifference(a,times(l,transpose(l)));
        snapshot("complete","Check A ≈ L L'.","Compare the original matrix to the reconstructed product.",{reconstruction:recon});
      }
    }
  }
  const last=steps.at(-1);
  return {caseId,mode,a,status,reason,steps,metrics:last.metrics};
}
export function fmt(value){
  if(value===null||!Number.isFinite(value))return "—";
  if(Math.abs(value)<5e-13)return "0";
  return String(Number(value.toPrecision(7)));
}
export function juliaFactorExample(caseId,mode){
  if(!Object.hasOwn(FACTORIZATION_CASES,caseId)||!Object.hasOwn(FACTORIZATION_MODES,mode))throw new RangeError("Invalid Julia factor example");
  const source=FACTORIZATION_CASES[caseId].a.map(row=>row.map(v=>Number.isInteger(v)?v+".0":String(v)).join(" ")).join("; ");
  const body=mode==="qr"?
    "F = qr(A)\nQ = Matrix(F.Q)\nR = Matrix(F.R)\nprintln(\"reconstruction: \", norm(A - Q*R))\nprintln(\"orthogonality: \", norm(Q'*Q - I))\n":
    "if issymmetric(A) && isposdef(A)\n    F = cholesky(A)\n    L = Matrix(F.L)\n    println(\"reconstruction: \", norm(A - L*L'))\nelse\n    println(\"Cholesky requires symmetric positive-definite A\")\nend\n";
  return "using LinearAlgebra\nA = ["+source+"]\n"+body;
}
