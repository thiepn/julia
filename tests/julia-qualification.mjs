// Executed in the existing PUBLIC GitHub Actions workflow with authentic Julia 1.11.
// Only fixed, reviewed reference fixtures run; NEVER learner-supplied browser drafts.
// Each generated file comes through the actual J18/J19 production export function.
import assert from "node:assert/strict";
import {mkdtemp,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawnSync} from "node:child_process";
import {EXTERNAL_TEST_SUITES,buildExternalTestFile} from "../src/external-tests.js";
import {propertiesForTask,buildPropertyFile} from "../src/property-transfer.js";
import {contractForTask,designScaffold} from "../src/algorithm-design.js";
const examples={
  "08":{
    original:"sum_of_squares(v) = sum((x^2 for x in v); init=0)",
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
      const focusedCase=variants[variant].cases.at(-1);
      const focused=buildExternalTestFile(lesson,variant,source,focusedCase.name);
      assert.equal((focused.content.match(/@testset /g)||[]).length,2,
        "Focused export must contain exactly one nested Test case");
      const focusedPath=join(dir,focused.filename);
      await writeFile(focusedPath,focused.content,"utf8");
      const focusedActual=julia(focusedPath);
      assert.equal(focusedActual.error,undefined,"Julia runtime unavailable: "+focusedActual.error);
      if(focusedActual.status!==0)
        throw Error("JULIA FOCUSED FAIL "+lesson+"/"+variant+" ["+focusedCase.name+"]\n"+
          focusedActual.stdout+"\n"+focusedActual.stderr);
      assert.match(focusedActual.stdout+focusedActual.stderr,/Test Summary:/,
        "Real focused Julia Test summary missing for "+lesson+"/"+variant);
      console.log("JULIA FOCUSED PASS "+lesson+"/"+variant+" ["+focusedCase.name+"]");
      const relations=propertiesForTask(lesson,variant);
      assert.equal(relations.length,2,"Expected two source-authored input relations per supported task");
      for(const propertyId of [null,relations[1].id]){
        const script=buildPropertyFile(lesson,variant,source,propertyId);
        const file=join(dir,script.filename);
        await writeFile(file,script.content,"utf8");
        const result=julia(file);
        assert.equal(result.error,undefined,"Julia runtime unavailable: "+result.error);
        if(result.status!==0)
          throw Error("JULIA PROPERTY FAIL "+lesson+"/"+variant+" "+(propertyId??"both")+
            " exit "+result.status+"\n"+result.stdout+"\n"+result.stderr);
        assert.match(result.stdout+result.stderr,/Test Summary:/);
        console.log("JULIA PROPERTY PASS "+lesson+"/"+variant+" ["+(propertyId??"both")+"]");
      }
      const design=contractForTask(lesson,variant);
      assert.equal(design.name,variants[variant].title);
      const scaffold=designScaffold(lesson,variant);
      const parseFile=join(dir,"design-parse-"+lesson+"-"+variant+".jl");
      await writeFile(parseFile,
        "source = "+JSON.stringify(scaffold)+"\n"+
        "parsed = Meta.parseall(source)\n"+
        "parsed isa Expr || error(\"Julia Meta.parseall rejected scaffold\")\n"+
        "println(\"DESIGN PARSE PASS\")\n","utf8");
      const parsed=julia(parseFile);
      assert.equal(parsed.error,undefined);
      if(parsed.status!==0)throw Error("JULIA SCAFFOLD SYNTAX FAIL "+lesson+"/"+variant+
        "\n"+parsed.stdout+"\n"+parsed.stderr);
      assert.match(parsed.stdout,/DESIGN PARSE PASS/);
      const incomplete=buildExternalTestFile(lesson,variant,scaffold,variants[variant].cases[0].name);
      const incompletePath=join(dir,"design-incomplete-"+lesson+"-"+variant+".jl");
      await writeFile(incompletePath,incomplete.content,"utf8");
      const notImplemented=julia(incompletePath);
      assert.equal(notImplemented.error,undefined);
      assert.notEqual(notImplemented.status,0,
        "Incomplete learner scaffold cannot pass a real Julia case");
      assert.match(notImplemented.stdout+notImplemented.stderr,/TODO: implement /);
      assert.match(notImplemented.stdout+notImplemented.stderr,/Error During Test|Some tests did not pass/);
      console.log("JULIA DESIGN PASS "+lesson+"/"+variant+" (valid syntax; expected incomplete failure)");
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
  const failingFocused=buildExternalTestFile("08","a","count_above(v,t) = length(v)","Strict inequality boundary");
  const failingFocusedPath=join(dir,"julia-expected-focused-failure.jl");
  await writeFile(failingFocusedPath,failingFocused.content,"utf8");
  const failedFocusedActual=julia(failingFocusedPath);
  assert.equal(failedFocusedActual.error,undefined);
  assert.notEqual(failedFocusedActual.status,0,
    "Incorrect implementation must fail the specifically selected boundary regression");
  assert.match(failedFocusedActual.stdout+failedFocusedActual.stderr,/Test Failed|Some tests did not pass/);
  console.log("JULIA FOCUSED EXPECTED FAIL 08/a strict boundary");
  const badProperty=buildPropertyFile("08","original","sum_of_squares(v) = sum(v)","p1");
  const badPropertyPath=join(dir,"julia-bad-property.jl");
  await writeFile(badPropertyPath,badProperty.content,"utf8");
  const badPropertyResult=julia(badPropertyPath);
  assert.equal(badPropertyResult.error,undefined);
  assert.notEqual(badPropertyResult.status,0,"Sign-incorrect sum must fail its Julia metamorphic test");
  assert.match(badPropertyResult.stdout+badPropertyResult.stderr,/Test Failed|Some tests did not pass/);
  console.log("JULIA PROPERTY EXPECTED FAIL 08/original sign symmetry");
  console.log("JULIA QUALIFICATION PASS "+count+"/9 real generated suites + 2 expected failures (full and focused)");
}finally{
  await rm(dir,{recursive:true,force:true});
}
