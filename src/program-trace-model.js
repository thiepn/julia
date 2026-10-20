// Original AMP program-state exercises with deterministic JS arithmetic.
// JavaScript computes the trace of fixed examples; no Julia code is interpreted.
export const TRACE_LESSONS=Object.freeze({"03":"range","07":"branch","08":"squares","11":"dot"});
export const TRACE_CASES=Object.freeze({
  range:{
    title:"Accumulate a range",state:"total",values:[1,2,3,4],variable:"i",
    source:"total = 0\nfor i in 1:4\n    total += i\nend\nprintln(total)",
    check:null
  },
  branch:{
    title:"Count strictly positive values",state:"count",values:[-2,0,3,5],variable:"x",
    source:"count = 0\nfor x in [-2, 0, 3, 5]\n    if x > 0\n        count += 1\n    end\nend\nprintln(count)",
    check:"x > 0"
  },
  squares:{
    title:"Sum squares in a loop",state:"total",values:[1,2,3,4],variable:"i",
    source:"function sum_squares(n)\n    total = 0\n    for i in 1:n\n        total += i^2\n    end\n    return total\nend\nprintln(sum_squares(4))",
    check:null
  },
  dot:{
    title:"Build a dot product",state:"total",values:[[1,4],[2,5],[3,6]],variable:"i",
    source:"a = [1, 2, 3]\nb = [4, 5, 6]\ntotal = 0\nfor i in eachindex(a)\n    total += a[i] * b[i]\nend\nprintln(total)",
    check:null
  }
});
export function traceForCase(caseId){
  if(!Object.hasOwn(TRACE_CASES,caseId))throw new RangeError("Unknown program exercise");
  const c=TRACE_CASES[caseId];let state=0;
  const steps=c.values.map((entry,index)=>{
    const before=state,term=caseId==="dot"?entry[0]*entry[1]:
      caseId==="squares"?entry*entry:caseId==="range"?entry:entry>0?1:0;
    const branch=c.check?entry>0:null;
    state+=term;
    const context=caseId==="dot"?"i = "+(index+1)+", a[i] = "+entry[0]+", b[i] = "+entry[1]:
      c.variable+" = "+entry;
    const explanation=caseId==="dot"?
      "Multiply "+entry[0]+" · "+entry[1]+" = "+term+"; add it to total "+before+".":
      caseId==="squares"?
        "Square "+entry+" to get "+term+"; add this to total "+before+".":
      caseId==="range"?
        "Add i = "+entry+" to total "+before+".":
        branch?"Since "+entry+" > 0 is true, count increases from "+before+" to "+state+".":
          "Since "+entry+" > 0 is false, count remains "+before+".";
    return Object.freeze({index,before,after:state,term,branch,context,explanation});
  });
  return Object.freeze({caseId,title:c.title,state:c.state,source:c.source,
    hasBranch:!!c.check,condition:c.check,steps,final:state});
}
export function checkTracePrediction(caseId,index,input,branchChoice=null){
  const trace=traceForCase(caseId),step=trace.steps[index];
  if(!step||typeof input!=="string"||!/^-?\d{1,5}$/.test(input.trim()))
    return {valid:false,message:"Enter one whole-number value for the variable."};
  if(trace.hasBranch&&!["true","false"].includes(branchChoice))
    return {valid:false,message:"Select whether the condition evaluates to true or false."};
  const guessed=Number(input.trim());
  const valueCorrect=guessed===step.after;
  const branchCorrect=!trace.hasBranch||(branchChoice==="true")===step.branch;
  return {valid:true,valueCorrect,branchCorrect,correct:valueCorrect&&branchCorrect,
    actual:step.after,actualBranch:step.branch,explanation:step.explanation};
}
const PREFIX="amp-julia-lab:trace:v1:";
export function readTracePosition(caseId,storage=globalThis.localStorage){
  if(!Object.hasOwn(TRACE_CASES,caseId))return 0;
  try{
    const value=JSON.parse(storage.getItem(PREFIX+caseId)||"null");
    return Number.isInteger(value)&&value>=0&&value<=traceForCase(caseId).steps.length?value:0;
  }catch{return 0;}
}
export function writeTracePosition(caseId,position,storage=globalThis.localStorage){
  if(!Object.hasOwn(TRACE_CASES,caseId)||!Number.isInteger(position)||position<0||
     position>traceForCase(caseId).steps.length)return false;
  try{storage.setItem(PREFIX+caseId,JSON.stringify(position));return true;}catch{return false;}
}
export function clearTracePosition(caseId,storage=globalThis.localStorage){
  if(!Object.hasOwn(TRACE_CASES,caseId))return false;
  try{storage.removeItem(PREFIX+caseId);return true;}catch{return false;}
}
