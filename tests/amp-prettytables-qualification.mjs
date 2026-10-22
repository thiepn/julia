import assert from "node:assert/strict";
import {mkdtemp,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawnSync} from "node:child_process";
import {rootJuliaSource,ROOT_SWEEPS} from "../src/amp-root-model.js";
import {conditionJuliaSource,CONDITION_FUNCTIONS} from "../src/amp-condition-model.js";
const folder=await mkdtemp(join(tmpdir(),"amp-julia-real-pkg-"));
try{
  for(const mode of Object.keys(ROOT_SWEEPS)){
    const path=join(folder,mode+".jl");
    await writeFile(path,rootJuliaSource(mode));
    const result=spawnSync("julia",["--startup-file=no","--color=no",path],{
      encoding:"utf8",timeout:80000,env:{...process.env,JULIA_NUM_THREADS:"2"}
    });
    if(result.error)throw result.error;
    assert.equal(result.status,0,mode+": "+result.stdout+"\n"+result.stderr);
    for(const header of ["delta","direct","stable","relative difference"])
      assert.ok(result.stdout.includes(header),"Missing PrettyTables header "+header);
    assert.ok(result.stdout.split("\n").length>ROOT_SWEEPS[mode].deltas.length);
    console.log("AMP JULIA PRETTYTABLES PASS",mode);
  }
  for(const id of Object.keys(CONDITION_FUNCTIONS)){
    const path=join(folder,"condition-"+id+".jl");
    await writeFile(path,conditionJuliaSource(id,0.8));
    const result=spawnSync("julia",["--startup-file=no","--color=no",path],{
      encoding:"utf8",timeout:30000
    });
    if(result.error)throw result.error;
    assert.equal(result.status,0,id+": "+result.stdout+"\n"+result.stderr);
    assert.match(result.stdout,/analytic relative condition/);
    const count=(result.stdout.match(/epsilon =/g)||[]).length;
    assert.equal(count,4);
    console.log("AMP JULIA CONDITION PASS",id,4,"finite perturbations");
  }
}finally{await rm(folder,{recursive:true,force:true});}
