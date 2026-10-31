import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {ALGORITHM_UNITS} from "../src/algorithmic-learning.js";
let n=0;
for(const u of ALGORITHM_UNITS){
 for(const item of [...u.examples,...u.checks]){
  const r=spawnSync("julia",["--startup-file=no","--history-file=no","--color=no","-e",item.code],{
   encoding:"utf8",timeout:45000,maxBuffer:1024*1024,env:{...process.env,JULIA_NUM_THREADS:"1"}});
  assert.ifError(r.error);
  assert.equal(r.status,0,u.id+" run "+n+": "+r.stderr);
  assert.equal(r.stderr.trim(),"");
  assert.equal(r.stdout.replace(/\r\n/g,"\n").trimEnd(),item.output,u.id+" output "+n);
  if(item.choices)assert.equal(item.choices[item.correct],item.output);
  n++;
 }
}
assert.equal(n,24);
console.log("L5 AUTHENTIC JULIA PASS 24 source/output pairs, all keys consistent");
