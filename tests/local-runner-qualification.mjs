import assert from "node:assert/strict";
import {createLocalRunner} from "../local-runner/server.mjs";
const token="only-for-ci-do-not-use-in-production";
const origin="http://127.0.0.1:5173";
const runner=createLocalRunner({token,origins:[origin]});
const address=await runner.listen({port:0});
const url="http://127.0.0.1:"+address.port+"/run";
const run=async(code)=>{const result=await fetch(url,{method:"POST",headers:{
  "Origin":origin,"Authorization":"Bearer "+token,"Content-Type":"application/json"},
  body:JSON.stringify({code})});assert.equal(result.status,200);return result.json();};
try{
  const response=await run('println("LOCAL-JULIA-42"); println(6*7)');
  assert.equal(response.ok,true);
  assert.match(response.stdout,/LOCAL-JULIA-42/);
  assert.match(response.stdout,/\b42\b/);
  assert.equal(response.figures.length,0);
  console.log("LOCAL JULIA PASS genuine arithmetic and stdout");
  const failure=await run('error("expected Julia error")');
  assert.equal(failure.ok,false);
  assert.match(failure.stderr,/expected Julia error/);
  assert.deepEqual(failure.figures,[]);
  console.log("LOCAL JULIA PASS genuine error/exit status");
  const intruder=await fetch(url,{method:"POST",headers:{"Origin":"https://evil.example","Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({code:"println(1)"})});
  assert.equal(intruder.status,403);
  console.log("LOCAL JULIA PASS rejected cross-origin access");
}finally{await runner.close();}
