import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {FUNDAMENTALS} from "../src/fundamentals.js";
// Reference source executes in CI only. The learning website displays text and checks answer keys.
let examples=0,checks=0;
function verify(label,code,expected){
 const run=spawnSync("julia",["--startup-file=no","--history-file=no","--color=no","-e",code],{
  encoding:"utf8",timeout:45000,maxBuffer:1024*1024,env:{...process.env,JULIA_NUM_THREADS:"1"}
 });
 assert.ifError(run.error);
 assert.equal(run.status,0,label+" source failed: "+run.stderr);
 assert.equal(run.stderr.trim(),"",label+" wrote stderr");
 assert.equal(run.stdout.replace(/\r\n/g,"\n").trimEnd(),expected,label+" stdout mismatch");
}
for(const ch of FUNDAMENTALS){
 for(const [i,e] of ch.examples.entries()){verify(ch.id+" example "+(i+1),e.code,e.output);examples++;}
 for(const [i,q] of ch.checks.entries()){verify(ch.id+" check "+(i+1),q.code,q.output);checks++;}
}
assert.equal(examples,16);assert.equal(checks,16);
console.log("L4 AUTHENTIC JULIA PASS 16 examples + 16 question scripts, exact stdout");
