// Independent AMP Übung 2 numerical lab. JavaScript binary64, not a Julia solver or grade.
export const ROOT_CASES=Object.freeze({
  separated:{label:"Separated roots",a:2,b:3},
  near:{label:"Nearly repeated root",a:3,b:9-1e-8},
  cancellation:{label:"Tiny root from subtraction",a:3,b:1e-12},
  middle:{label:"Moderate coefficients",a:3,b:4}
});
export const ROOT_SWEEPS=Object.freeze({
  near:{label:"Roots approaching each other",deltas:[1e-2,1e-4,1e-6,1e-8,1e-10],a:3},
  cancellation:{label:"Small root near zero",deltas:[1e-2,1e-4,1e-6,1e-8,1e-10,1e-12,1e-14],a:3}
});
export function rootSample(a,b){
  if(!Number.isFinite(a)||!Number.isFinite(b)||a<=0||b<=0||b>a*a)
    throw new RangeError("Require finite a > 0 and 0 < b ≤ a².");
  const discriminant=a*a-b;
  const sqrt=Math.sqrt(discriminant);
  const naive=a-sqrt;
  const stable=b/(a+sqrt); // Algebraically identical; avoids subtracting close numbers.
  const other=a+sqrt;
  // The analytic relative sensitivities follow from d r / d a = -r/sqrt(D)
  // and d r / d b = 1/(2 sqrt(D)) for D > 0; undefined at the double root.
  const conditionA=sqrt===0?Infinity:a/sqrt;
  const conditionB=sqrt===0?Infinity:(a+sqrt)/(2*sqrt);
  const relativeDiscrepancy=Math.abs(naive-stable)/Math.abs(stable);
  const naiveResidual=(naive*naive-2*a*naive+b)/b;
  const stableResidual=(stable*stable-2*a*stable+b)/b;
  return {a,b,discriminant,sqrt,naive,stable,other,relativeDiscrepancy,
    conditionA,conditionB,conditionMax:Math.max(conditionA,conditionB),
    naiveResidual,stableResidual};
}
export function rootSweep(mode){
  const config=ROOT_SWEEPS[mode];
  if(!config)throw new RangeError("Unknown root sweep");
  return config.deltas.map(delta=>{
    const a=config.a,b=mode==="near"?a*a-delta:delta;
    const sample=rootSample(a,b);
    return {...sample,delta,metric:mode==="near"?sample.conditionMax:sample.relativeDiscrepancy};
  });
}
export function numberText(value){
  if(value===Infinity)return "∞";
  if(!Number.isFinite(value))return "undefined";
  if(value===0)return "0";
  return Math.abs(value)<0.0001 || Math.abs(value)>=1e7?value.toExponential(4):Number(value.toPrecision(7)).toString();
}
export function rootCsv(mode){
  const headers="delta,a,b,naive_root,stable_root,relative_discrepancy,relative_condition_max";
  const lines=rootSweep(mode).map(p=>[p.delta,p.a,p.b,p.naive,p.stable,p.relativeDiscrepancy,p.conditionMax].join(","));
  return [headers,...lines].join("\n")+"\n";
}
export function rootJuliaSource(mode){
  if(!Object.hasOwn(ROOT_SWEEPS,mode))throw new RangeError("Unknown root experiment");
  const list=ROOT_SWEEPS[mode].deltas.map(String).join(", ");
  const b=mode==="near"?"a*a - delta":"delta";
  return [
    "using PrettyTables",
    "a = 3.0",
    "deltas = ["+list+"]",
    "rows = Matrix{Float64}(undef, length(deltas), 4)",
    "for (i, delta) in enumerate(deltas)",
    "    b = "+b,
    "    root_direct = a - sqrt(a*a - b)",
    "    root_stable = b / (a + sqrt(a*a - b))",
    "    relative_difference = abs(root_direct-root_stable)/abs(root_stable)",
    "    rows[i, :] = [delta, root_direct, root_stable, relative_difference]",
    "end",
    'pretty_table(rows; column_labels=["delta", "direct", "stable", "relative difference"])'
  ].join("\n");
}
