import test from "node:test";
import assert from "node:assert/strict";
import {createLocalRunner,JULIA_DIAGNOSTIC_SOURCE} from "../local-runner/server.mjs";
test("local diagnostics run fixed non-mutating Julia source with the SAME session gate",async()=>{
 let calls=[];
 const runner=createLocalRunner({token:"long-local-test-session-key",origins:["http://127.0.0.1:5173"],
   execute:async code=>{calls.push(code);return {ok:true,stdout:"JULIA_LAB_DIAGNOSTIC_V1\njulia_version=1.11.7\npackage_Plots=missing\n",stderr:"",exitCode:0,figures:[]};}});
 const {port}=await runner.listen({port:0});
 const endpoint="http://127.0.0.1:"+port;
 const post=(origin,token,path)=>fetch(endpoint+path,{method:"POST",headers:{
  "Origin":origin,"Authorization":"Bearer "+token}});
 try{
   const blocked=await post("https://untrusted.example","long-local-test-session-key","/diagnose");
   assert.equal(blocked.status,403);
   const unauthorized=await post("http://127.0.0.1:5173","incorrect","/diagnose");
   assert.equal(unauthorized.status,401);
   assert.equal(calls.length,0);
   const accepted=await post("http://127.0.0.1:5173","long-local-test-session-key","/diagnose");
   assert.equal(accepted.status,200);
   const data=await accepted.json();
   assert.equal(data.ok,true);
   assert.match(data.stdout,/package_Plots=missing/);
   assert.deepEqual(data.figures,[]);
   assert.equal(calls.length,1);
   assert.equal(calls[0],JULIA_DIAGNOSTIC_SOURCE);
   assert.match(calls[0],/Base\.find_package/);
   assert.doesNotMatch(calls[0],/Pkg\.(add|instantiate|update|rm|develop)\s*\(/);
   assert.doesNotMatch(calls[0],/DEPOT_PATH|ENV\[|Base\.active_project\(\)\)/);
 }finally{await runner.close();}
});
