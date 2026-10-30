import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {LEARNING_QUIZZES} from "../src/learning-quiz.js";

// Only source-authored reference solutions are executed in Julia 1.11 CI.
// The browser renders original snippets and checks keyed responses without evaluation.
let count=0;
for(const items of Object.values(LEARNING_QUIZZES)){
 for(const q of items){
   const result=spawnSync("julia",["--startup-file=no","--history-file=no","--color=no","-e",q.verifySource],{
     encoding:"utf8",timeout:45000,maxBuffer:1024*1024,env:{...process.env,JULIA_NUM_THREADS:"1"}
   });
   assert.ifError(result.error);
   assert.equal(result.status,0,q.id+" reference script failed: "+result.stderr);
   assert.equal(result.stderr.trim(),"",q.id+" wrote unexpected stderr");
   assert.equal(result.stdout.replace(/\r\n/g,"\n").trimEnd(),q.expectedOutput,
     q.id+" reference output differs from actual Julia");
   if(q.kind==="predict"||q.kind==="numeric")
     assert.equal(q.verifySource,q.code,q.id+" checks displayed code verbatim");
   if(q.kind==="numeric")assert.equal(Number(q.expectedOutput),q.answer);
   count++;
 }
}
assert.equal(count,15);
console.log("L3 JULIA 1.11 PASS 15 reference outputs; browser evaluates zero Julia programs");
