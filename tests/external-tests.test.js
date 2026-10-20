import test from "node:test";
import assert from "node:assert/strict";
import {lessons} from "../src/lessons.js";
import {transferForLesson} from "../src/transfer-cases.js";
import {externalTestSuite,EXTERNAL_TEST_SUITES,buildExternalTestFile} from "../src/external-tests.js";
import {MAX_DRAFT_LENGTH} from "../src/workspace.js";

test("nine test suites cover only source-defined function interfaces",()=>{
  assert.deepEqual(Object.keys(EXTERNAL_TEST_SUITES).sort(),["08","09","13"]);
  const ids=new Set(lessons.map(l=>l.id));
  for(const [lesson,modes] of Object.entries(EXTERNAL_TEST_SUITES)){
    assert.ok(ids.has(lesson));
    assert.deepEqual(Object.keys(modes),["original","a","b"]);
    for(const variant of ["original","a","b"]){
      const current=externalTestSuite(lesson,variant);
      assert.equal(current,modes[variant]);
      assert.ok(current.title.length>4);
      assert.ok(current.cases.length>=3);
      const expected=variant==="original"?lessons.find(l=>l.id===lesson).challenge:transferForLesson(lesson,variant).task;
      assert.ok(expected.length>30);
      const checks=new Set(current.cases.map(c=>c.assertion));
      assert.equal(checks.size,current.cases.length);
      assert.ok(current.cases.some(c=>/Empty|Zero|zero|Strict|Outside|Signed|boundary|Identity|Diagonal/i.test(c.name)));
      for(const c of current.cases){
        assert.ok(c.name.length>4);
        assert.match(c.assertion,/^@test [^\n]+$/);
        assert.ok(c.assertion.includes(current.title+"("));
      }
    }
  }
});
test("generated Julia file includes learner source exactly and native Test assertions",()=>{
  const learner="function count_above(v,t)\n    count(x->x>t,v)\nend\n";
  const out=buildExternalTestFile("08","a",learner);
  assert.equal(out.filename,"amp-julia-lab-lesson-08-transfer-a-tests.jl");
  assert.equal(out.mime,"text/plain;charset=utf-8");
  assert.ok(out.content.startsWith("using Test\nusing LinearAlgebra\n"));
  assert.ok(out.content.includes(learner));
  assert.match(out.content,/@testset "AMP 08 count_above" begin/);
  assert.match(out.content,/@test count_above\(Int\[\], 3\) == 0/);
  assert.match(out.content,/@test count_above\(\[1, 4, 6\], 6\) == 0/);
  assert.ok(out.content.indexOf(learner)<out.content.indexOf("@testset"));
  assert.doesNotMatch(out.content,/https:\/\/|function count_above\(v,t\)\s*return 2/);
});
test("per-variant source is unchanged and filename never collides with lesson draft",()=>{
  const original=buildExternalTestFile("09","original","isclose(a,b,t) = abs(a-b)<=t");
  const variantA=buildExternalTestFile("09","a","approxzero(x,tol)=abs(x)<=tol");
  const variantB=buildExternalTestFile("09","b","near_relative(a,b,t)=abs(a-b)<=t*max(abs(a),abs(b))");
  assert.equal(original.filename,"amp-julia-lab-lesson-09-tests.jl");
  assert.equal(variantA.filename,"amp-julia-lab-lesson-09-transfer-a-tests.jl");
  assert.equal(variantB.filename,"amp-julia-lab-lesson-09-transfer-b-tests.jl");
  assert.notEqual(original.filename,variantA.filename);
  assert.notEqual(variantA.filename,variantB.filename);
  assert.match(original.content,/@test isclose\(0, 0, 0\) === true/);
  assert.match(variantA.content,/@test approxzero\(0, 0\) === true/);
  assert.match(variantB.content,/@test near_relative\(100, 101, 0\.001\) === false/);
});
test("triangular-system checks include multiple matrices, not a single memorized answer",()=>{
  for(const variant of ["original","a","b"]){
    const out=buildExternalTestFile("13",variant,"# learner supplies a function below");
    assert.match(out.content,/isapprox\(/);
    assert.match(out.content,/atol=1e-10/);
    assert.match(out.content,/Identity matrix/);
    assert.match(out.content,/Diagonal system/);
    assert.match(out.content,/Upper-triangular|Triangular|New triangular/);
  }
});
test("unqualified scripts and malformed source fail closed without storing or running code",()=>{
  for(const lesson of ["01","02","03","04","05","06","07","10","11","12","14","15","16","constructor","__proto__","17"]){
    assert.equal(externalTestSuite(lesson,"original"),null);
    assert.throws(()=>buildExternalTestFile(lesson,"original","println(1)"),RangeError);
  }
  for(const v of ["x","constructor","__proto__",null]){
    assert.equal(externalTestSuite("08",v),null);
    assert.throws(()=>buildExternalTestFile("08",v,"println(1)"),RangeError);
  }
  assert.throws(()=>buildExternalTestFile("08","a",null),RangeError);
  assert.throws(()=>buildExternalTestFile("08","a","x".repeat(MAX_DRAFT_LENGTH+1)),RangeError);
  const empty=buildExternalTestFile("08","a","");
  assert.match(empty.content,/@test count_above/);
  assert.doesNotMatch(empty.content,/function count_above/);
});
