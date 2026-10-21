import test from "node:test";
import assert from "node:assert/strict";
import {createLocalRunner,validateSource,validateOrigin,MAX_CODE_BYTES} from "../local-runner/server.mjs";
test("runner requires trusted browser origins and appropriately bounded source",()=>{
  assert.equal(validateOrigin("http://127.0.0.1:5173"),true);
  assert.equal(validateOrigin("https://evil.example"),false);
  assert.equal(validateSource({code:"println(1)"}).ok,true);
  assert.equal(validateSource({code:""}).ok,false);
  assert.equal(validateSource({code:"x".repeat(MAX_CODE_BYTES+1)}).ok,false);
  assert.equal(validateSource({code:123}).ok,false);
});
test("runner requires secret and originating page even if code is valid",async()=>{
  let executions=0;
  const runner=createLocalRunner({token:"not-a-production-token",origins:["http://127.0.0.1:5173"],execute:async()=>{
    executions++;return {ok:true,exitCode:0,stdout:"ok",stderr:"",figures:[]};
  }});
  const {port}=await runner.listen({port:0});
  const url="http://127.0.0.1:"+port+"/run";
  const post=(origin,token,code="println(1)")=>fetch(url,{method:"POST",
    headers:{"Origin":origin,"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({code})});
  try{
    assert.equal((await post("https://malicious.invalid","not-a-production-token")).status,403);
    assert.equal((await post("http://127.0.0.1:5173","bad-token")).status,401);
    const good=await post("http://127.0.0.1:5173","not-a-production-token");
    assert.equal(good.status,200);
    assert.equal((await good.json()).stdout,"ok");
    assert.equal(executions,1);
    const invalid=await post("http://127.0.0.1:5173","not-a-production-token","");
    assert.equal(invalid.status,400);
    assert.equal(executions,1);
  }finally{await runner.close();}
});
