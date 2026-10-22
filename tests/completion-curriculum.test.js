import test from "node:test";
import assert from "node:assert/strict";
import {COMPLETION_TRACKS,completionTrack,completionTracksForLesson,buildCompletionTests} from "../src/completion-tracks.js";
import {PROOF_SCAFFOLDS,VERIFIED_SHEETS,proofScaffoldsForLesson} from "../src/completion-proofs.js";
import {QUALIFIED_EXPERIMENTS,experimentsForLesson} from "../src/completion-experiments.js";
test("completion content preserves canonical lesson identity and authentic sheet references",()=>{
 assert.equal(Object.keys(COMPLETION_TRACKS).length,14);
 assert.equal(COMPLETION_TRACKS.matrix_shapes.lesson,"02");
 assert.equal(completionTracksForLesson("07").length,2);
 assert.equal(completionTracksForLesson("17").length,0);
 assert.equal(completionTrack("__proto__"),null);
 assert.deepEqual(VERIFIED_SHEETS.map(s=>s.sheet),[1,2]);
 assert.ok(VERIFIED_SHEETS.every(s=>s.source.endsWith(".pdf")&&s.due.includes("2026")));
 assert.equal(PROOF_SCAFFOLDS.length,11);
 assert.equal(proofScaffoldsForLesson("10").length,3);
 assert.equal(experimentsForLesson("09").length,5);
 assert.equal(experimentsForLesson("16").length,2);
});
test("Julia tests are derived from the existing draft, not a second editor or a browser score",()=>{
 const source="function column_energy(A)\n return vec(sum(abs2.(A);dims=1))\nend";
 const file=buildCompletionTests("matrix_shapes",source);
 assert.match(file.content,/using Test/);
 assert.ok(file.content.includes(source));
 assert.equal((file.content.match(/@testset /g)||[]).length,5);
 assert.match(file.filename,/\.jl$/);
 assert.throws(()=>buildCompletionTests("no_such_track",source));
 assert.throws(()=>buildCompletionTests("precision",source),/no automatic/);
 assert.throws(()=>buildCompletionTests("matrix_shapes",""),/current Julia draft/);
});
test("official UE02 finite difference equality is a flagged interpretation, never silently altered",()=>{
 const warning=PROOF_SCAFFOLDS.find(p=>p.id==="UE02-derivative");
 assert.match(warning.notice,/finite/);
 assert.match(warning.notice,/Confirm lecturer/);
 assert.equal(warning.sourcePart,"Übung 2, 2.1(a,c)");
 assert.ok(QUALIFIED_EXPERIMENTS.spacing.code.includes("nextfloat"));
 assert.ok(QUALIFIED_EXPERIMENTS.residual.code.includes("cond(A)"));
});
