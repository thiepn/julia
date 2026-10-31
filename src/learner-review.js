import {LEARNING_QUIZZES,readQuizAnswers,gradeQuizAnswer} from "./learning-quiz.js";
import {FUNDAMENTALS,readFundamentalsAnswers,gradeFundamentalsCheck} from "./fundamentals.js";
import {ALGORITHM_UNITS,readAlgorithmAnswers,gradeAlgorithmCheck} from "./algorithmic-learning.js";
import {ASSESSMENTS,readAssessmentAnswers,gradeAssessmentAnswer} from "./assessments.js";
import {TRANSFER_CASES,readTransferAnswers,gradeTransferAnswer} from "./transfer-assessments.js";
import {VARIANT_CASES,readVariantAnswers,gradeVariantAnswer} from "./variant-assessments.js";

// The report contains only validated, latest saved answers to authored checks.
// It does not export legacy scores or drafts; no attempt times or mastery are inferred.
const domains=Object.freeze([
 {id:"l3-applied",name:"L3 applied questions",
  questions:Object.values(LEARNING_QUIZZES).flat(),
  read:readQuizAnswers,grade:gradeQuizAnswer},
 {id:"l4-fundamentals",name:"L4 Julia fundamentals",
  questions:FUNDAMENTALS.flatMap(c=>c.checks),
  read:readFundamentalsAnswers,grade:gradeFundamentalsCheck},
 {id:"l5-algorithms",name:"L5 algorithmic reasoning",
  questions:ALGORITHM_UNITS.flatMap(c=>c.checks),
  read:readAlgorithmAnswers,grade:gradeAlgorithmCheck},
 {id:"l7-assessments",name:"L7 multi-step cases and remediation",
  questions:ASSESSMENTS.flatMap(c=>[...c.steps,...c.remediation]),
  read:readAssessmentAnswers,grade:gradeAssessmentAnswer},
 {id:"l8-transfer",name:"L8 independent transfer",
  questions:TRANSFER_CASES.flatMap(c=>[...c.steps,c.justify]),
  read:readTransferAnswers,grade:gradeTransferAnswer},
 {id:"l9-variants",name:"L9 new AMP variants",
  questions:VARIANT_CASES.flatMap(c=>c.questions),
  read:readVariantAnswers,grade:gradeVariantAnswer}
]);
export const REVIEW_SCHEMA="amp-julia-learn-review-v1";
export function buildLearnerReview(storage,generatedAt=null){
 const sections=domains.map(d=>{
  const answers=d.read(storage);
  const records=d.questions.flatMap(q=>{
   if(!Object.hasOwn(answers,q.id))return [];
   const selection=answers[q.id],result=d.grade(q,selection);
   if(!result.valid)return [];
   return [{questionId:q.id,selection,correct:result.correct}];
  });
  return {id:d.id,name:d.name,totalAuthored:d.questions.length,recorded:records.length,
   correct:records.filter(r=>r.correct).length,
   incorrect:records.filter(r=>!r.correct).length,answers:records};
 });
 return {
  schema:REVIEW_SCHEMA,
  generatedAt:generatedAt===null?null:String(generatedAt),
  scope:"Latest validated saved answer per authored L3–L9 question (L6 derives from L4–L5).",
  limitations:[
   "Not a test attempt log, attendance history, certified grade or mastery judgement.",
   "An unanswered question is not recorded as an incorrect answer.",
   "Only the latest saved response is available; corrections overwrite earlier answers.",
   "Original L1 quiz records, learner code drafts, private notes and backups are not included."
  ],
  summary:{authored:sections.reduce((n,d)=>n+d.totalAuthored,0),
   recorded:sections.reduce((n,d)=>n+d.recorded,0),
   correct:sections.reduce((n,d)=>n+d.correct,0),
   incorrect:sections.reduce((n,d)=>n+d.incorrect,0)},
  sections
 };
}
