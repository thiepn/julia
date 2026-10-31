import assert from "node:assert/strict";
import {VARIANT_CASES,VARIANT_STORAGE_KEY,gradeVariantAnswer,readVariantAnswers,
 writeVariantAnswer,variantEvidence} from "../src/variant-assessments.js";
import {buildLearnerReview,REVIEW_SCHEMA} from "../src/learner-review.js";
import {TRANSFER_CASES} from "../src/transfer-assessments.js";
import {ASSESSMENTS} from "../src/assessments.js";
const prior=new Set([
 ...TRANSFER_CASES.flatMap(c=>[...c.steps,c.justify]).map(q=>q.code),
 ...ASSESSMENTS.flatMap(c=>[...c.steps,...c.remediation]).map(q=>q.code)
]);
assert.deepEqual(VARIANT_CASES.map(c=>c.id),
 ["quartic","contraction","euler","power","conditioning"]);
const codes=new Set(),ids=new Set();
for(const c of VARIANT_CASES){
 assert.ok(c.context.length>=340,c.id+" meaningful context");
 assert.ok(c.assumption.length>=70,c.id+" stated preconditions");
 assert.equal(c.questions.length,3);
 for(const q of c.questions){
  assert.ok(!ids.has(q.id));ids.add(q.id);
  assert.ok(!codes.has(q.code));codes.add(q.code);
  assert.ok(!prior.has(q.code),q.id+" must be new vs L7/L8");
  assert.ok(q.code.includes("println("));
  assert.ok(q.reason.length>=70&&q.hint.length>=30);
  assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);
  assert.equal(q.feedback.length,4);assert.equal(q.choices[q.correct],q.output);
  for(let i=0;i<4;i++){
   assert.ok(q.feedback[i].length>=18);
   const result=gradeVariantAnswer(q,String(i));
   assert.equal(result.valid,true);assert.equal(result.correct,i===q.correct);
   assert.equal(result.feedback,q.feedback[i]);
  }
  assert.equal(gradeVariantAnswer(q,"4").valid,false);
  assert.equal(gradeVariantAnswer(q,"1e0").valid,false);
 }
}
assert.equal(ids.size,15);assert.equal(codes.size,15);
const original=new Map([
 ["amp-julia-lab:v1",'{"01:0":2}'],
 ["amp-julia-lab:draft:v1:01","PRIVATE DRAFT CANARY"],
 ["amp-julia-learn:quiz-v1",'{"01-predict":"1"}'],
 ["amp-julia-learn:fundamentals-v1",'{"types-1":"1"}'],
 ["amp-julia-learn:algorithms-v1",'{"contracts-1":"1"}'],
 ["amp-julia-learn:assessments-v1",'{"quadrature-step-1":"2"}'],
 ["amp-julia-learn:transfer-v1",'{"nonuniform-step-1":"2"}']
]);
const baseline=new Map(original);
const storage={getItem:k=>original.get(k)??null,setItem:(k,v)=>original.set(k,v)};
const q=VARIANT_CASES[0].questions[0],wrong=(q.correct+1)%4;
assert.equal(writeVariantAnswer(q,String(wrong),storage).saved,true);
assert.equal(variantEvidence(readVariantAnswers(storage))[0].incorrect,1);
assert.equal(writeVariantAnswer(q,String(q.correct),storage).saved,true);
assert.equal(variantEvidence(readVariantAnswers(storage))[0].correct,1);
const exported=buildLearnerReview(storage,"2026-10-31T00:00:00.000Z");
assert.equal(exported.schema,REVIEW_SCHEMA);
assert.equal(exported.generatedAt,"2026-10-31T00:00:00.000Z");
assert.equal(exported.sections.length,6);
assert.equal(exported.summary.authored,103);
assert.equal(exported.sections.find(s=>s.id==="l9-variants").recorded,1);
assert.equal(exported.sections.find(s=>s.id==="l9-variants").correct,1);
assert.equal(exported.sections.find(s=>s.id==="l9-variants").answers[0].questionId,q.id);
assert.equal(exported.sections.find(s=>s.id==="l7-assessments").recorded,1);
assert.equal(exported.sections.find(s=>s.id==="l8-transfer").recorded,1);
assert.ok(exported.summary.recorded>=3);
assert.equal(JSON.stringify(exported).includes("PRIVATE DRAFT CANARY"),false);
assert.equal(JSON.stringify(exported).includes("amp-julia-lab:draft"),false);
for(const [key,val] of baseline)assert.equal(original.get(key),val);
assert.equal(writeVariantAnswer({...q},"1",storage).saved,false);
original.set(VARIANT_STORAGE_KEY,'{"unknown":"2","quartic-estimate":"2","euler-local":"99"}');
assert.deepEqual(readVariantAnswers(storage),{"quartic-estimate":"2"});
original.set(VARIANT_STORAGE_KEY,"bad-json");
assert.deepEqual(readVariantAnswers(storage),{});
const denied={getItem(){throw Error("blocked");},setItem(){throw Error("blocked");}};
assert.deepEqual(readVariantAnswers(denied),{});
assert.equal(writeVariantAnswer(q,String(q.correct),denied).saved,false);
assert.equal(buildLearnerReview(denied).summary.recorded,0);
const empty=buildLearnerReview({getItem(){return null;}});
assert.equal(empty.summary.correct,0);
assert.equal(empty.summary.incorrect,0);
assert.equal(empty.summary.recorded,0);
console.log("L9 UNIT PASS 5 new cases, 15 scripts, conservative review export, all L1-L8 stores unchanged");
