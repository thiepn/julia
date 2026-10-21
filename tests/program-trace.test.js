import test from "node:test";
import assert from "node:assert/strict";
import {lessons} from "../src/lessons.js";
import {TRACE_LESSONS,TRACE_CASES,traceForCase,checkTracePrediction,readTracePosition,writeTracePosition,clearTracePosition} from "../src/program-trace-model.js";

const storage=()=>{
  const data=new Map();
  return {data,getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};
};
test("four original program cases match canonical lesson IDs and Julia-style sources",()=>{
  assert.deepEqual(Object.keys(TRACE_LESSONS).sort(),["03","07","08","11"]);
  const ids=new Set(lessons.map(l=>l.id));
  for(const [lesson,caseId] of Object.entries(TRACE_LESSONS)){
    assert.ok(ids.has(lesson));
    assert.ok(Object.hasOwn(TRACE_CASES,caseId));
    const t=traceForCase(caseId);
    assert.ok(t.source.includes("for "));
    assert.ok(t.source.includes("println("));
    assert.ok(t.steps.length>=3);
    assert.equal(t.steps[0].before,0);
    for(let i=0;i<t.steps.length;i++){
      const s=t.steps[i];
      assert.equal(s.index,i);
      assert.equal(s.before,i===0?0:t.steps[i-1].after);
      assert.equal(s.after,s.before+s.term);
      assert.ok(s.explanation.length>25);
      const check=checkTracePrediction(caseId,i,String(s.after),s.branch===null?null:String(s.branch));
      assert.deepEqual({valid:check.valid,correct:check.correct},{valid:true,correct:true});
      assert.equal(check.actual,s.after);
    }
    assert.equal(t.final,t.steps.at(-1).after);
  }
});
test("numeric accumulation, branch outcomes, and dot product are deterministic",()=>{
  assert.deepEqual(traceForCase("range").steps.map(s=>s.after),[1,3,6,10]);
  assert.deepEqual(traceForCase("branch").steps.map(s=>s.after),[0,0,1,2]);
  assert.deepEqual(traceForCase("branch").steps.map(s=>s.branch),[false,false,true,true]);
  assert.deepEqual(traceForCase("squares").steps.map(s=>s.after),[1,5,14,30]);
  assert.deepEqual(traceForCase("dot").steps.map(s=>s.after),[4,14,32]);
  assert.equal(traceForCase("dot").steps[2].context,"i = 3, a[i] = 3, b[i] = 6");
});
test("wrong value or wrong branch reports actual modeled step without grading Julia code",()=>{
  const wrong=checkTracePrediction("branch",2,"1","false");
  assert.equal(wrong.valid,true);
  assert.equal(wrong.valueCorrect,true);
  assert.equal(wrong.branchCorrect,false);
  assert.equal(wrong.correct,false);
  assert.equal(wrong.actual,1);
  assert.equal(wrong.actualBranch,true);
  assert.match(wrong.explanation,/count increases/);
  const value=checkTracePrediction("branch",2,"0","true");
  assert.equal(value.valueCorrect,false);
  assert.equal(value.branchCorrect,true);
  assert.equal(value.correct,false);
  assert.equal(checkTracePrediction("branch",0,"0","false").correct,true);
  assert.equal(checkTracePrediction("dot",0,"5").correct,false);
});
test("invalid predictions cannot silently become a correct state",()=>{
  for(const invalid of ["","1.2","2e1","Infinity","1 ","-","NaN","120000"])
    assert.equal(checkTracePrediction("range",0,invalid).valid,invalid==="1 "?true:false,invalid);
  assert.equal(checkTracePrediction("branch",2,"1","").valid,false);
  assert.equal(checkTracePrediction("branch",2,"1","invalid").valid,false);
  assert.equal(checkTracePrediction("range",99,"1").valid,false);
  assert.throws(()=>traceForCase("constructor"),RangeError);
  assert.throws(()=>traceForCase("../07"),RangeError);
});
test("resume and reset only selected trace, never canonical course keys",()=>{
  const s=storage();
  assert.equal(readTracePosition("range",s),0);
  assert.equal(writeTracePosition("range",2,s),true);
  assert.equal(writeTracePosition("branch",1,s),true);
  assert.equal(readTracePosition("range",s),2);
  assert.equal(readTracePosition("branch",s),1);
  assert.equal(s.data.has("amp-julia-lab:v1"),false);
  assert.equal(clearTracePosition("range",s),true);
  assert.equal(readTracePosition("range",s),0);
  assert.equal(readTracePosition("branch",s),1);
  assert.equal(writeTracePosition("branch",5,s),false);
  assert.equal(writeTracePosition("constructor",0,s),false);
  assert.equal(readTracePosition("constructor",s),0);
  s.setItem("amp-julia-lab:trace:v1:branch","{}");
  assert.equal(readTracePosition("branch",s),0);
});
test("storage failures reject writes without inventing persisted results",()=>{
  const denied={getItem(){throw Error("denied")},setItem(){throw Error("denied")},removeItem(){throw Error("denied")}};
  assert.equal(readTracePosition("range",denied),0);
  assert.equal(writeTracePosition("range",2,denied),false);
  assert.equal(clearTracePosition("range",denied),false);
});
