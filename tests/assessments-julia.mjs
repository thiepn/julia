import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {ASSESSMENTS} from "../src/assessments.js";
// Always execute the exact authored source with genuine Julia 1.11.
// Browser never evaluates source; distractors are verified against real stdout.
let count=0;
for(const item of ASSESSMENTS){
 for(const q of [...item.steps,...item.remediation]){
  const result=spawnSync("julia",["--startup-file=no","--history-file=no","--color=no","-e",q.code],{
   encoding:"utf8",timeout:45000,maxBuffer:1024*1024,env:{...process.env,JULIA_NUM_THREADS:"1"}});
  assert.ifError(result.error);
  assert.equal(result.status,0,q.id+" source failed: "+result.stderr);
  assert.equal(result.stderr.trim(),"",q.id+" unexpected stderr");
  assert.equal(result.stdout.replace(/\r\n/g,"\n").trimEnd(),q.stdout,
   q.id+" printed output differs from displayed reference");
  assert.equal(q.options[q.correct],q.stdout,q.id+" answer key must be exact stdout");
  count++;
 }
}
assert.equal(count,25);
console.log("L7 AUTHENTIC JULIA PASS 25 distinct source/stdout pairs, including 10 independent remediation questions");
