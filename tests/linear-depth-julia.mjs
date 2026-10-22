import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {mkdtemp,writeFile,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {LINEAR_TRACKS,LINEAR_EXPERIMENTS} from "../src/linear-depth.js";
import {buildCompletionTests} from "../src/completion-tracks.js";
const references={
  pivoted_lr:"using LinearAlgebra\nfunction pivoted_lr(A)\n F=lu(A)\n return (p=F.p,L=Matrix(F.L),U=Matrix(F.U))\nend",
  qr_fit:"using LinearAlgebra\nfunction fit_qr(t,y)\n A=hcat(ones(length(t)),t)\n c=qr(A)\\y\n return (coefficients=c,residual=norm(A*c-y),orthogonality=norm(A'*(A*c-y)))\nend",
  rank_aware_fit:"using LinearAlgebra\nfunction fit_rank_aware(A,b)\n if size(A,1)<size(A,2) || length(b)!=size(A,1) || rank(A)<size(A,2)\n  return nothing\n end\n c=qr(A)\\b\n return (coefficients=c,residual=norm(A*c-b))\nend"
};
const dir=await mkdtemp(join(tmpdir(),"amp-linear-depth-"));
function run(path){
 const r=spawnSync("julia",["--startup-file=no","--color=no",path],{encoding:"utf8",timeout:120000,maxBuffer:1e6});
 if(r.error)throw r.error;
 return r;
}
try{
 for(const [id,source] of Object.entries(references)){
   const file=buildCompletionTests(id,source),path=join(dir,file.filename);
   await writeFile(path,file.content);
   const result=run(path);
   assert.equal(result.status,0,id+"\n"+result.stdout+"\n"+result.stderr);
   assert.match(result.stdout+result.stderr,/Test Summary:/);
   console.log("LINEAR JULIA TEST PASS",id,LINEAR_TRACKS[id].checks.length);
   const faulty=buildCompletionTests(id,LINEAR_TRACKS[id].starter);
   const wrong=join(dir,"incomplete-"+id+".jl");await writeFile(wrong,faulty.content);
   assert.notEqual(run(wrong).status,0,"incomplete source should not pass: "+id);
 }
 for(const item of Object.values(LINEAR_EXPERIMENTS)){
   const path=join(dir,item.id+"-experiment.jl");await writeFile(path,item.code+"\n");
   const result=run(path);
   assert.equal(result.status,0,item.id+"\n"+result.stdout+"\n"+result.stderr);
   assert.ok(result.stdout.trim().length>15,"no numerical output for "+item.id);
   console.log("LINEAR JULIA EXPERIMENT PASS",item.id,result.stdout.split("\n").length-1);
 }
}finally{await rm(dir,{recursive:true,force:true});}
