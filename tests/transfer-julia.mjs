import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {TRANSFER_CASES} from "../src/transfer-assessments.js";
let output=0,justification=0;
for(const item of TRANSFER_CASES){
 for(const q of [...item.steps,item.justify]){
  const result=spawnSync("julia",["--startup-file=no","--history-file=no","--color=no","-e",q.code],{
   encoding:"utf8",timeout:45000,maxBuffer:1024*1024,env:{...process.env,JULIA_NUM_THREADS:"1"}
  });
  assert.ifError(result.error);
  assert.equal(result.status,0,q.id+" Julia exception: "+result.stderr);
  assert.equal(result.stderr.trim(),"",q.id+" unexpected stderr");
  assert.equal(result.stdout.replace(/\r\n/g,"\n").trimEnd(),q.stdout,q.id+" printed result differs");
  if(q.kind==="output"){
   assert.equal(q.options[q.key],q.stdout,q.id+" answer key mismatches genuine Julia");
   output++;
  }else{
   assert.equal(q.kind,"justification");
   assert.ok(q.options[q.key].length>50);
   justification++;
  }
 }
}
assert.equal(output,15);assert.equal(justification,5);
console.log("L8 JULIA PASS 20 original source/stdout pairs (15 numeric outputs + 5 justification evidence scripts)");
