import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {VARIANT_CASES} from "../src/variant-assessments.js";
let checked=0;
for(const c of VARIANT_CASES){
 for(const q of c.questions){
  const result=spawnSync("julia",["--startup-file=no","--history-file=no","--color=no","-e",q.code],{
   encoding:"utf8",timeout:45000,maxBuffer:1024*1024,env:{...process.env,JULIA_NUM_THREADS:"1"}
  });
  assert.ifError(result.error);
  assert.equal(result.status,0,q.id+" Julia execution error: "+result.stderr);
  assert.equal(result.stderr.trim(),"",q.id+" unexpected stderr");
  assert.equal(result.stdout.replace(/\r\n/g,"\n").trimEnd(),q.output,q.id+" stdout mismatch");
  assert.equal(q.choices[q.correct],q.output,q.id+" correct key mismatch");
  checked++;
 }
}
assert.equal(checked,15);
console.log("L9 JULIA PASS 15 source-authored independent calculations and theoretical-bound references");
