// Execute original independent reference code through the SAME external Julia Test authority.
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {mkdtemp,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {buildAmpJuliaTests,AMP_MISSIONS} from "../src/amp-missions.js";
const references={
  stable_change:"stable_change(t) = t / (sqrt(1+t) + 1)",
  relative_response:"relative_response(f,x,eta) = abs((f(x*(1+eta))-f(x))/(eta*f(x)))",
  small_root:"small_root(a,b) = b / (a + sqrt(a*a-b))"
};
const dir=await mkdtemp(join(tmpdir(),"amp-ue02-scripts-"));
try{
  for(const [id,task] of Object.entries(AMP_MISSIONS)){
    const generated=buildAmpJuliaTests(id,references[id]);
    const path=join(dir,generated.filename);
    await writeFile(path,generated.content,"utf8");
    const result=spawnSync("julia",["--startup-file=no","--color=no",path],{
      encoding:"utf8",timeout:30000,maxBuffer:1024*1024
    });
    if(result.error)throw result.error;
    assert.equal(result.status,0,id+": "+result.stdout+"\n"+result.stderr);
    assert.match(result.stdout+result.stderr,/Test Summary:/);
    console.log("AMP JULIA TEST PASS",id,task.checks.length,"source-backed cases");
  }
  const incomplete=buildAmpJuliaTests("stable_change",AMP_MISSIONS.stable_change.starter);
  const failPath=join(dir,incomplete.filename);
  await writeFile(failPath,incomplete.content,"utf8");
  const failed=spawnSync("julia",["--startup-file=no","--color=no",failPath],{encoding:"utf8",timeout:30000});
  assert.notEqual(failed.status,0,"incomplete source must not pass");
  assert.match((failed.stderr||"")+(failed.stdout||""),/Test Failed|Error During Test|Some tests did not pass/);
  console.log("AMP JULIA TEST PASS incomplete starter rejected by real Julia Test");
}finally{await rm(dir,{recursive:true,force:true});}
