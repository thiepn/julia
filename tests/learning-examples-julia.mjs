import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {LEARNING_EXAMPLES} from "../src/learning-examples.js";

// Development CI only. Do not bundle this script or Julia into the learning website.
let completed=0;
for(const examples of Object.values(LEARNING_EXAMPLES)){
  for(const example of examples){
    const result=spawnSync("julia",["--startup-file=no","--history-file=no","--color=no","-e",example.code],{
      encoding:"utf8",timeout:45000,maxBuffer:1024*1024,
      env:{...process.env,JULIA_NUM_THREADS:"1"}
    });
    assert.ifError(result.error);
    assert.equal(result.status,0,example.id+" Julia process failed: "+result.stderr);
    const actual=result.stdout.replace(/\r\n/g,"\n").trimEnd();
    assert.equal(actual,example.output,example.id+" published stdout differs from real Julia");
    assert.equal(result.stderr.trim(),"",example.id+" has unexpected stderr");
    completed++;
  }
}
assert.equal(completed,18);
console.log("L2 JULIA 1.11 PASS",completed,"real Julia source/output pairs; browser executes none");
