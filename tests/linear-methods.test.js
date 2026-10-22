import test from "node:test";
import assert from "node:assert/strict";
import {METHOD_CASES,analyzeMethods,householderFit,normalEquationFit,methodsJuliaSource} from "../src/linear-methods.js";
import {LINEAR_TRACKS,LINEAR_PROOFS,LINEAR_EXPERIMENTS} from "../src/linear-depth.js";
import {completionTrack,completionTracksForLesson,buildCompletionTests} from "../src/completion-tracks.js";
import {proofScaffoldsForLesson} from "../src/completion-proofs.js";
import {experimentsForLesson} from "../src/completion-experiments.js";
test("well-scaled QR and normal equations agree on least-squares output",()=>{
 const result=analyzeMethods("balanced");
 assert.ok(result.qr&&result.normal);
 assert.ok(Math.abs(result.qr.residual-result.normal.residual)<1e-12);
 assert.ok(result.qr.normalOrthogonality<1e-12);
 assert.ok(Math.abs(result.qr.coefficients[0]-3)<1e-12);
 assert.ok(Math.abs(result.qr.coefficients[1]-1.6)<1e-12);
});
test("both methods satisfy normal-equation orthogonality for noisy data",()=>{
 const result=analyzeMethods("noisy");
 assert.ok(result.qr&&result.normal);
 assert.ok(result.qr.residual>0);
 assert.ok(result.qr.normalOrthogonality<1e-11);
 assert.ok(result.normal.normalOrthogonality<1e-11);
});
test("real rank deficiency is distinguished from squared-condition breakdown",()=>{
 const deficient=analyzeMethods("repeated"),nearly=analyzeMethods("close");
 assert.equal(deficient.qr,null);
 assert.equal(deficient.normal,null);
 assert.equal(nearly.qrRank,2);
 assert.ok(nearly.qr);
 assert.ok(nearly.qr.residual<1e-6);
});
test("method model rejects malformed inputs and unknown presets",()=>{
 assert.throws(()=>analyzeMethods("__proto__"),RangeError);
 assert.throws(()=>householderFit([[1,2]],[1]),TypeError);
 assert.throws(()=>normalEquationFit([[1,NaN],[1,2]],[1,2]),TypeError);
 assert.throws(()=>methodsJuliaSource("constructor"),RangeError);
 assert.equal(Object.keys(METHOD_CASES).length,4);
});
test("original Julia learning depth uses canonical test export and lesson IDs",()=>{
 assert.equal(Object.keys(LINEAR_TRACKS).length,3);
 assert.equal(LINEAR_PROOFS.length,3);
 assert.equal(Object.keys(LINEAR_EXPERIMENTS).length,3);
 for(const t of Object.values(LINEAR_TRACKS)){
   assert.equal(completionTrack(t.id),t);
   assert.ok(completionTracksForLesson(t.lesson).some(item=>item.id===t.id));
   const file=buildCompletionTests(t.id,t.starter);
   assert.match(file.content,/using Test/);
   assert.equal((file.content.match(/@testset "/g)||[]).length,5);
 }
 assert.ok(proofScaffoldsForLesson("15").some(p=>p.id==="B-normal"));
 assert.ok(experimentsForLesson("15").some(e=>e.id==="normal_equations"));
 assert.match(methodsJuliaSource("close"),/qr\(A\)/);
});
