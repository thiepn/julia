// Executed in the existing PUBLIC GitHub Actions workflow with authentic Julia 1.11.
// Only fixed, reviewed reference fixtures run; NEVER learner-supplied browser drafts.
// Each generated file comes through the actual J18/J19 production export function.
import assert from "node:assert/strict";
import {mkdtemp,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawnSync} from "node:child_process";
import {EXTERNAL_TEST_SUITES,buildExternalTestFile} from "../src/external-tests.js";
const examples={
  "08":{
    original:"sum_of_squares(v) = sum(x^2 for x in v)",
    a:"count_above(v, t) = count(x -> x > t, v)",
    b:"product_or_one(v) = prod(v)"
  },
  "09":{
    original:"isclose(a, b, tol) = abs(a - b) <= tol",
    a:"approxzero(x, tol) = abs(x) <= tol",
    b:"near_relative(a, b, rtol) = abs(a-b) <= rtol*max(abs(a),abs(b))"
  },
  "13":{
    original: "function forward_substitution(L, b)\n" +
      "    x = Vector{Float64}(undef, length(b))\n" +
      "    for i in eachindex(b)\n" +
      "        x[i] = (b[i] - sum((L[i,j]*x[j] for j in 1:(i-1)); init=0.0)) / L[i,i]\n" +
      "    end\n" +
      "    return x\nend",
    a: "function backward_substitution(U, b)\n" +
      "    x = Vector{Float64}(undef, length(b))\n" +
      "    for i in length(b):-1:1\n" +
      "        x[i] = (b[i] - sum((U[i,j]*x[j] for j in (i+1):length(b)); init=0.0)) / U[i,i]\n" +
      "    end\n" +
      "    return x\nend",
    b: "function forward_substitution(L, b)\n" +
      "    x = Vector{Float64}(undef, length(b))\n" +
      "    for i in eachindex(b)\n" +
      "        x[i] = (b[i] - sum((L[i,j]*x[j] for j in 1:(i-1)); init=0.0)) / L[i,i]\n" +
      "    end\n" +
      "    return x\nend"
  }
};
const args=["--startup-file=no","--history-file=no","--color=no","--threads=1"];
function julia(file){
  const proc=spawnSync("julia",[...args,file],{
    encoding:"utf8",maxBuffer:4*1024*1024,
    timeout:40000,env:{...process.env,JULIA_PKG_PRECOMPILE_AUTO:"0"}
  });
  return {status:proc.status,stdout:proc.stdout??"",stderr:proc.stderr??"",error:proc.error?.message};
}
const dir=await mkdtemp(join(tmpdir(),"amp-julia-qualification-"));
try{
  let count=0;
  for(const [lesson,variants] of Object.entries(EXTERNAL_TEST_SUITES)){
    for(const variant of Object.keys(variants)){
      const source=examples[lesson]?.[variant];
      assert.ok(source,"Missing reviewed Julia reference fixture for "+lesson+"/"+variant);
      const generated=buildExternalTestFile(lesson,variant,source);
      const filename=join(dir,generated.filename);
      await writeFile(filename,generated.content,"utf8");
      const actual=julia(filename);
      assert.equal(actual.error,undefined,"Julia runtime unavailable: "+actual.error);
      if(actual.status!==0){
        throw Error("JULIA FAIL "+lesson+"/"+variant+" exit "+actual.status+"\n"+actual.stdout+"\n"+actual.stderr);
      }
      assert.match(actual.stdout+actual.stderr,/Test Summary:/,"Real Julia Test summary missing for "+lesson+"/"+variant);
      count++;
      console.log("JULIA PASS "+lesson+"/"+variant+" ("+variants[variant].cases.length+" cases)");
    }
  }
  assert.equal(count,9,"Expected all nine function task variants");
  // A deliberately wrong implementation MUST fail genuinely in Julia.
  const negative=buildExternalTestFile("08","a","count_above(v,t) = length(v)");
  const negativePath=join(dir,"julia-expected-failure.jl");
  await writeFile(negativePath,negative.content,"utf8");
  const actual=julia(negativePath);
  assert.equal(actual.error,undefined);
  assert.notEqual(actual.status,0,"Incorrect Julia implementation unexpectedly passed");
  assert.match(actual.stdout+actual.stderr,/Test Failed|Some tests did not pass|Test Summary/,
    "Authentic negative test output missing");
  console.log("JULIA EXPECTED FAIL 08/a: deliberately wrong source rejected by Julia Test");
  console.log("JULIA QUALIFICATION PASS "+count+"/9 real generated suites + 1 expected failure");
}finally{
  await rm(dir,{recursive:true,force:true});
}
