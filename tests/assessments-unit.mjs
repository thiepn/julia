import assert from "node:assert/strict";
import {ASSESSMENTS,ASSESSMENT_STORAGE_KEY,assessmentEvidence,
 readAssessmentAnswers,writeAssessmentAnswer,gradeAssessmentAnswer} from "../src/assessments.js";
import {FUNDAMENTALS} from "../src/fundamentals.js";
import {ALGORITHM_UNITS} from "../src/algorithmic-learning.js";
import {LEARNING_PATHS} from "../src/learning-paths.js";
import {lessons} from "../src/lessons.js";

assert.deepEqual(ASSESSMENTS.map(x=>x.id),["quadrature","bracketing","elimination","stability","newton"]);
const ids=new Set(),sources=new Set();
for(const item of ASSESSMENTS){
 assert.ok(item.context.length>=600,item.id+" substantive context");
 assert.equal(item.context.split("\n\n").length,2);
 assert.ok(item.invariant.length>=90);
 assert.ok(item.topics.length>=3);
 assert.equal(item.steps.length,3);assert.equal(item.remediation.length,2);
 const stageCodes=item.steps.map(x=>x.code);
 const remediationCodes=item.remediation.map(x=>x.code);
 assert.ok(remediationCodes.every(code=>!stageCodes.includes(code)),
  item.id+" remediation must use different source");
 for(const [kind,questions] of [["step",item.steps],["remedy",item.remediation]]){
  for(const [i,q] of questions.entries()){
   assert.equal(q.id,item.id+"-"+kind+"-"+(i+1));
   assert.ok(!ids.has(q.id),q.id);ids.add(q.id);
   assert.ok(!sources.has(q.code),q.id+" duplicate case source");
   sources.add(q.code);
   assert.ok(q.code.includes("println("),q.id+" must print reference output");
   assert.ok(q.stdout.length>0);
   assert.ok(q.hint.length>=30);
   assert.ok(q.explanation.length>=55);
   assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);
   assert.equal(q.feedback.length,4);assert.equal(q.options[q.correct],q.stdout);
   q.options.forEach((choice,index)=>{
    assert.ok(choice.length>0);
    assert.equal(typeof q.feedback[index],"string");
    assert.ok(q.feedback[index].length>=24,q.id+" choice "+index);
    const grade=gradeAssessmentAnswer(q,String(index));
    assert.equal(grade.valid,true);
    assert.equal(grade.correct,index===q.correct);
    assert.equal(grade.feedback,q.feedback[index]);
   });
   assert.equal(gradeAssessmentAnswer(q,"1e1").valid,false);
   assert.equal(gradeAssessmentAnswer(q,"4").valid,false);
  }
 }
}
assert.equal(ids.size,25);assert.equal(sources.size,25);
assert.equal(lessons.length,16);assert.equal(FUNDAMENTALS.length,8);
assert.equal(ALGORITHM_UNITS.length,6);assert.equal(LEARNING_PATHS.length,2);
const empty=assessmentEvidence();
assert.equal(empty.length,5);assert.equal(empty.every(x=>x.answered===0&&!x.remediationRecommended),true);
const q=ASSESSMENTS[0].steps[0],wrong=(q.correct+1)%4;
const historical=new Map([
 ["amp-julia-lab:v1",'{"01:0":2}'],
 ["amp-julia-lab:draft:v1:01","old original code"],
 ["amp-julia-learn:quiz-v1",'{"01-predict":"1"}'],
 ["amp-julia-learn:fundamentals-v1",'{"types-1":"1"}'],
 ["amp-julia-learn:algorithms-v1",'{"contracts-1":"1"}']
]);
const storage={getItem:key=>historical.get(key)??null,setItem:(key,value)=>historical.set(key,value)};
assert.deepEqual(readAssessmentAnswers(storage),{});
assert.equal(writeAssessmentAnswer(q,String(wrong),storage).saved,true);
assert.equal(assessmentEvidence(readAssessmentAnswers(storage))[0].remediationRecommended,true);
assert.equal(assessmentEvidence(readAssessmentAnswers(storage))[0].wrong,1);
assert.equal(writeAssessmentAnswer(q,String(q.correct),storage).saved,true);
assert.equal(assessmentEvidence(readAssessmentAnswers(storage))[0].remediationRecommended,false);
assert.equal(assessmentEvidence(readAssessmentAnswers(storage))[0].correct,1);
assert.equal(assessmentEvidence(readAssessmentAnswers(storage))[0].answered,1);
for(const [key,value] of historical){
 if(key!==ASSESSMENT_STORAGE_KEY)assert.equal(value,key==="amp-julia-lab:draft:v1:01"?
  "old original code":key==="amp-julia-lab:v1"?'{"01:0":2}':key==="amp-julia-learn:quiz-v1"?
  '{"01-predict":"1"}':key==="amp-julia-learn:fundamentals-v1"?'{"types-1":"1"}':'{"contracts-1":"1"}');
}
const fake={...q};
assert.equal(writeAssessmentAnswer(fake,"1",storage).saved,false,"Reject noncanonical question object");
historical.set(ASSESSMENT_STORAGE_KEY,'{"unknown":"1","quadrature-step-1":"2","newton-step-1":"50"}');
assert.deepEqual(readAssessmentAnswers(storage),{"quadrature-step-1":"2"});
historical.set(ASSESSMENT_STORAGE_KEY,"invalid-json");
assert.deepEqual(readAssessmentAnswers(storage),{});
const denied={getItem(){throw Error("denied");},setItem(){throw Error("denied");}};
assert.deepEqual(readAssessmentAnswers(denied),{});
assert.equal(writeAssessmentAnswer(q,String(q.correct),denied).saved,false);
console.log("L7 UNIT PASS 5 multistep cases, 15 reasoning steps, 10 distinct remediation scripts, independent answer storage");
