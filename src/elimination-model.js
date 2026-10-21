// Stepwise Gaussian elimination, evaluated with JS Number (binary64).
// This is an independent teaching model, not Julia execution or code grading.
export const linearSystems=Object.freeze({
  regular:{label:"3×3 linear system",a:[[2,1,-1],[-3,-1,2],[-2,1,2]],b:[8,-11,-3]},
  swap:{label:"Zero leading pivot",a:[[0,2,1],[1,-2,-3],[3,-1,1]],b:[3,0,0]},
  small:{label:"Small leading pivot",a:[[1e-8,1,0],[1,1,1],[0,1,2]],b:[2.00000001,6,8]},
  singular:{label:"Singular system",a:[[1,2,3],[2,4,6],[1,1,1]],b:[6,12,3]}
});
export const pivotModes=Object.freeze({partial:"Partial pivoting",none:"Without pivoting"});
const TOL=1e-13;
const clone=m=>m.map(row=>row.slice());
const maxAbs=rows=>Math.max(1,...rows.flat().map(x=>Math.abs(x)));
const isFiniteMatrix=(a,b)=>Array.isArray(a)&&a.length>=2&&a.length<=4&&a.every(r=>Array.isArray(r)&&r.length===a.length&&r.every(Number.isFinite))&&Array.isArray(b)&&b.length===a.length&&b.every(Number.isFinite);
export function residualNorm(a,b,x){
  if(!isFiniteMatrix(a,b)||!Array.isArray(x)||x.length!==a.length||!x.every(Number.isFinite))throw new TypeError("Invalid residual inputs");
  return Math.hypot(...a.map((row,i)=>row.reduce((sum,v,j)=>sum+v*x[j],0)-b[i]));
}
export function eliminationTrace(systemId="regular",pivotMode="partial"){
  if(!Object.hasOwn(linearSystems,systemId)||!Object.hasOwn(pivotModes,pivotMode))throw new RangeError("Unknown elimination scenario or mode");
  const system=linearSystems[systemId],a=system.a,b=system.b,n=a.length;
  if(!isFiniteMatrix(a,b))throw new TypeError("Malformed linear system");
  const augmented=a.map((row,i)=>[...row,b[i]]);
  const rows=clone(augmented);
  const scale=maxAbs(rows.map(r=>r.slice(0,n)));
  const steps=[];
  const snapshot=(kind,description,highlight=[],column=null,partial=null)=>{
    steps.push({kind,description,rows:clone(rows),highlight:highlight.slice(),column,partial:partial?.slice()??null});
  };
  snapshot("initial","Start with the augmented matrix [A | b].");
  let status="solved",message="";
  for(let col=0;col<n;col++){
    let selected=col;
    if(pivotMode==="partial"){
      for(let row=col+1;row<n;row++){
        if(Math.abs(rows[row][col])>Math.abs(rows[selected][col]))selected=row;
      }
    }
    const pivot=rows[selected][col];
    if(Math.abs(pivot)<=TOL*scale){
      status=pivotMode==="none"&&rows.slice(col+1).some(r=>Math.abs(r[col])>TOL*scale)?"zero-pivot":"singular";
      message=status==="zero-pivot"
        ?"Zero pivot blocks this order. Try partial pivoting to exchange rows."
        :"No reliable nonzero pivot remains. A unique solution cannot be obtained with this elimination trace.";
      snapshot("blocked",message,[col],col);
      return {systemId,pivotMode,steps,status,message,solution:null,residual:null};
    }
    if(selected!==col){
      [rows[col],rows[selected]]=[rows[selected],rows[col]];
      snapshot("swap","Swap R"+(col+1)+" with R"+(selected+1)+" to select a pivot.",[col,selected],col);
    }
    snapshot("pivot","Use "+fmt(rows[col][col])+" in row "+(col+1)+" as the pivot.",[col],col);
    for(let row=col+1;row<n;row++){
      const factor=rows[row][col]/rows[col][col];
      if(Math.abs(factor)<=1e-16)continue;
      // Compute the whole augmented row, retaining the exact structural zero.
      for(let j=col+1;j<=n;j++) rows[row][j]-=factor*rows[col][j];
      rows[row][col]=0;
      snapshot("eliminate","R"+(row+1)+" ← R"+(row+1)+" − ("+fmt(factor)+") R"+(col+1)+".",[row,col],col);
    }
  }
  snapshot("triangular","The coefficient matrix is now upper triangular.");
  const x=Array(n).fill(null);
  for(let i=n-1;i>=0;i--){
    const known=rows[i].slice(i+1,n).reduce((sum,value,j)=>sum+value*x[i+1+j],0);
    x[i]=(rows[i][n]-known)/rows[i][i];
    if(!Number.isFinite(x[i])){
      status="singular";message="Back-substitution did not produce a finite solution.";
      snapshot("blocked",message,[i],i,x);
      return {systemId,pivotMode,steps,status,message,solution:null,residual:null};
    }
    snapshot("substitute","Solve x"+(i+1)+" = "+fmt(x[i])+" by back-substitution.",[i],i,x);
  }
  const residual=residualNorm(a,b,x);
  message="Calculated solution and original-system residual available.";
  snapshot("complete",message,[],null,x);
  return {systemId,pivotMode,steps,status,message,solution:x,residual};
}
function fmt(x){
  if(!Number.isFinite(x))return "undefined";
  if(Math.abs(x)<1e-12)x=0;
  return String(Number(x.toPrecision(6)));
}
export function formatEliminationNumber(x){return fmt(x);}
export function juliaExample(systemId){
  if(!Object.hasOwn(linearSystems,systemId))throw new RangeError("Unknown system");
  const {a,b}=linearSystems[systemId];
  const literal=x=>Number.isInteger(x)?x+".0":String(x);
  return "using LinearAlgebra\nA = ["+a.map(row=>row.map(literal).join(" ")).join("; ")+"]\nb = ["+
    b.map(literal).join(", ")+"]\nx = A \\ b\nprintln(x)\nprintln(norm(A*x - b))";
}
