import assert from "node:assert/strict";
import {FUNDAMENTALS,readFundamentalsAnswers,writeFundamentalsAnswer} from "../src/fundamentals.js";
import {ALGORITHM_UNITS,readAlgorithmAnswers,writeAlgorithmAnswer} from "../src/algorithmic-learning.js";
import {LEARNING_PATHS,learningPathEvidence} from "../src/learning-paths.js";

assert.deepEqual(LEARNING_PATHS.map(path=>path.id),["foundations","algorithms"]);
const empty=learningPathEvidence();
assert.equal(empty.units.length,14);
assert.equal(empty.totalChecks,28);
assert.equal(empty.correctAnswers,0);
assert.equal(empty.recordedAnswers,0);
assert.equal(empty.review.length,0,"Unanswered topics must not be labeled weak.");
assert.equal(empty.units.every(unit=>unit.status==="unattempted"),true);
assert.equal(empty.units.every(unit=>unit.prerequisites.every(id=>
 empty.units.some(prev=>prev.id===id))),true);
assert.deepEqual(empty.suggestedPractice.map(item=>item.id),["variables","types","strings"]);
assert.equal(empty.units.some(unit=>Object.hasOwn(unit,"mastered")),false);

const sourceVar=FUNDAMENTALS.find(ch=>ch.id==="variables");
const sourceTypes=FUNDAMENTALS.find(ch=>ch.id==="types");
const sourceInvariants=ALGORITHM_UNITS.find(ch=>ch.id==="invariants");
const wrongVar=String((sourceVar.checks[0].answer+1)%4);
const wrongInv=String((sourceInvariants.checks[1].correct+1)%4);
const persisted={
 fundamentals:{[sourceVar.checks[0].id]:wrongVar,
  [sourceTypes.checks[0].id]:String(sourceTypes.checks[0].answer)},
 algorithms:{[sourceInvariants.checks[1].id]:wrongInv}
};
const report=learningPathEvidence(persisted);
assert.equal(report.recordedAnswers,3);
assert.equal(report.correctAnswers,1);
assert.deepEqual(report.review.map(x=>x.id),["variables","invariants"]);
assert.deepEqual(report.suggestedPractice.slice(0,2).map(x=>x.id),["variables","invariants"]);
assert.equal(report.units.find(x=>x.id==="variables").status,"review");
assert.equal(report.units.find(x=>x.id==="invariants").recommended.index,1);
assert.equal(report.units.find(x=>x.id==="types").status,"partially-answered");
assert.equal(report.units.find(x=>x.id==="types").unanswered,1);
assert.equal(report.units.find(x=>x.id==="root-finding").prerequisiteNotes.includes("invariants"),false);
assert.equal(report.units.find(x=>x.id==="vector-scans").prerequisiteNotes.includes("invariants"),true);
// Latest saved answer is the available evidence; no attempt history is invented.
persisted.fundamentals[sourceVar.checks[0].id]=String(sourceVar.checks[0].answer);
persisted.algorithms[sourceInvariants.checks[1].id]=String(sourceInvariants.checks[1].correct);
const corrected=learningPathEvidence(persisted);
assert.equal(corrected.review.length,0);
assert.equal(corrected.correctAnswers,3);
assert.equal(corrected.units.find(x=>x.id==="variables").status,"partially-answered");
assert.equal(corrected.units.find(x=>x.id==="variables").unanswered,1);
assert.equal(corrected.suggestedPractice[0].id,"variables");

const core=new Map([
 ["amp-julia-lab:v1",'{"01:0":2}'],
 ["amp-julia-lab:draft:v1:01","original learner source"],
 ["amp-julia-learn:quiz-v1",'{"01-predict":"1"}']
]);
const storage={getItem:k=>core.get(k)??null,setItem:(k,v)=>core.set(k,v)};
writeFundamentalsAnswer(sourceVar.checks[0],wrongVar,storage);
writeAlgorithmAnswer(sourceInvariants.checks[1],wrongInv,storage);
const derived=learningPathEvidence({
 fundamentals:readFundamentalsAnswers(storage),
 algorithms:readAlgorithmAnswers(storage)
});
assert.deepEqual(derived.review.map(x=>x.id),["variables","invariants"]);
assert.equal(core.get("amp-julia-lab:v1"),'{"01:0":2}');
assert.equal(core.get("amp-julia-lab:draft:v1:01"),"original learner source");
assert.equal(core.get("amp-julia-learn:quiz-v1"),'{"01-predict":"1"}');
const keysBefore=[...core.keys()];
learningPathEvidence({fundamentals:readFundamentalsAnswers(storage),algorithms:readAlgorithmAnswers(storage)});
assert.deepEqual([...core.keys()],keysBefore,"Derivation must not create storage keys.");
console.log("L6 PATH UNIT PASS 14 ordered skills, prerequisites, weak priorities, corrections, no mastery inflation or migration");
