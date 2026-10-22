// Genuine Julia 1.11 exercise execution; source generated from canonical current-draft contracts.
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {mkdtemp,writeFile,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {buildCompletionTests,COMPLETION_TRACKS} from "../src/completion-tracks.js";
import {QUALIFIED_EXPERIMENTS} from "../src/completion-experiments.js";
const references={
 matrix_shapes:"column_energy(A) = vec(sum(abs2.(A);dims=1))",
 control_flow:"function clipped_total(values,cap)\n s=0\n for x in values\n  s+=min(x,cap)\n end\n return s\nend",
 row_means:"row_means(A) = vec(sum(A;dims=2)) ./ size(A,2)",
 repair_dimensions:"column_totals(A) = vec(sum(A;dims=1))",
 repair_scope:"positive_count(values) = count(x->x>0,values)",
 repair_types:"row_energy(A) = vec(sum(abs2.(A);dims=2))",
 squared_bound:"square_error_bound(x,delta) = 2abs(x)*abs(delta)+delta^2",
 vector_amplification:"using LinearAlgebra\nvector_amplification(A,x,dx) = (norm(A*(x+dx)-A*x)/norm(A*x))/(norm(dx)/norm(x))"
};
const directory=await mkdtemp(join(tmpdir(),"amp-completion-real-julia-"));
function julia(path){
 const x=spawnSync("julia",["--startup-file=no","--color=no",path],{encoding:"utf8",timeout:120000,maxBuffer:1024*1024});
 if(x.error)throw x.error;
 return x;
}
try{
 for(const [id,source] of Object.entries(references)){
   const built=buildCompletionTests(id,source);
   const path=join(directory,built.filename);
   await writeFile(path,built.content);
   const result=julia(path);
   assert.equal(result.status,0,id+"\n"+result.stdout+"\n"+result.stderr);
   assert.match(result.stdout+result.stderr,/Test Summary:/);
   console.log("COMPLETION JULIA PASS",id,COMPLETION_TRACKS[id].checks.length,"unfamiliar function checks");
 }
 for(const broken of ["repair_dimensions","repair_scope","repair_types"]){
   const file=buildCompletionTests(broken,COMPLETION_TRACKS[broken].starter);
   const path=join(directory,"broken-"+broken+".jl");
   await writeFile(path,file.content);
   const failed=julia(path);
   assert.notEqual(failed.status,0,broken+" faulty starter should fail");
   console.log("COMPLETION JULIA DEBUG PASS",broken,"genuine Julia failure caught");
 }
 const incomplete=buildCompletionTests("matrix_shapes",COMPLETION_TRACKS.matrix_shapes.starter);
 const failPath=join(directory,"incomplete.jl");
 await writeFile(failPath,incomplete.content);
 const fails=julia(failPath);
 assert.notEqual(fails.status,0,"incomplete learner source must not pass");
 console.log("COMPLETION JULIA PASS incomplete code correctly rejected");
 for(const experiment of Object.values(QUALIFIED_EXPERIMENTS)){
   const path=join(directory,experiment.id+".jl");
   await writeFile(path,experiment.code+"\n");
   const result=julia(path);
   assert.equal(result.status,0,experiment.id+"\n"+result.stdout+"\n"+result.stderr);
   assert.ok(result.stdout.trim().length>10,experiment.id+" must produce a real numeric output");
   console.log("COMPLETION JULIA EXPERIMENT PASS",experiment.id,result.stdout.split("\n").length-1,"output lines");
 }
}finally{await rm(directory,{recursive:true,force:true});}
