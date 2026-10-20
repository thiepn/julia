import test from "node:test";
import assert from "node:assert/strict";
import {PROPERTY_TRANSFER,propertiesForTask,buildPropertyFile} from "../src/property-transfer.js";
import {buildExternalTestFile} from "../src/external-tests.js";
import {MAX_DRAFT_LENGTH} from "../src/workspace.js";

test("18 source-aligned metamorphic relations serve nine original/transfer functions",()=>{
  assert.deepEqual(Object.keys(PROPERTY_TRANSFER).sort(),["08","09","13"]);
  let count=0;
  for(const lesson of ["08","09","13"])for(const variant of ["original","a","b"]){
    const props=propertiesForTask(lesson,variant);
    assert.equal(props.length,2);
    assert.deepEqual(props.map(x=>x.id),["p1","p2"]);
    for(const prop of props){
      assert.ok(prop.question.length>35);
      assert.ok(prop.reason.length>35);
      assert.match(prop.assertion,/^@test /);
      assert.ok(prop.name.length>5);
      count++;
    }
  }
  assert.equal(count,18);
});
test("property exports preserve current Julia source and selected mathematical relation",()=>{
  const learner="sum_of_squares(v) = sum((x^2 for x in v); init=0)\n";
  const single=buildPropertyFile("08","original",learner,"p1");
  const both=buildPropertyFile("08","original",learner);
  assert.equal(single.filename,"amp-julia-lab-lesson-08-property-p1-tests.jl");
  assert.equal(both.filename,"amp-julia-lab-lesson-08-properties-tests.jl");
  assert.ok(single.content.includes(learner));
  assert.match(single.content,/Sign symmetry/);
  assert.doesNotMatch(single.content,/Appending zero/);
  assert.match(both.content,/Appending zero/);
  assert.equal((single.content.match(/@testset /g)||[]).length,2);
  assert.equal((both.content.match(/@testset /g)||[]).length,3);
  assert.match(both.content,/using Test/);
  assert.match(both.content,/using LinearAlgebra/);
  assert.match(both.content,/generated in-browser, NOT run or graded/);
});
test("every task and property exports standalone files without overwriting original Test files",()=>{
  for(const lesson of ["08","09","13"])for(const variant of ["original","a","b"]){
    const source="# learner's current Julia code";
    const files=[
      buildExternalTestFile(lesson,variant,source),
      buildPropertyFile(lesson,variant,source),
      ...["p1","p2"].map(id=>buildPropertyFile(lesson,variant,source,id))
    ];
    assert.equal(new Set(files.map(x=>x.filename)).size,4);
    assert.equal(files[1].content.match(/@testset /g).length,3);
    for(const file of files){
      assert.ok(file.content.includes(source));
      assert.equal(file.mime,"text/plain;charset=utf-8");
    }
  }
});
test("unsupported lessons and invalid property identities fail closed",()=>{
  assert.deepEqual(propertiesForTask("16","a"),[]);
  assert.deepEqual(propertiesForTask("__proto__","a"),[]);
  assert.deepEqual(propertiesForTask("08","constructor"),[]);
  assert.throws(()=>buildPropertyFile("01","original","println(1)"),RangeError);
  for(const bad of ["p3","constructor","__proto__",{},false]){
    assert.throws(()=>buildPropertyFile("08","a","count_above(v,t)=0",bad),RangeError);
  }
  assert.throws(()=>buildPropertyFile("08","a",null,"p1"),RangeError);
  assert.throws(()=>buildPropertyFile("08","a","x".repeat(MAX_DRAFT_LENGTH+1),"p1"),RangeError);
});
test("property scripts compare transformed inputs rather than only hard-coded results",()=>{
  const examples=[
    ["08","a",/count_above\(\[2, 7, -1, 5\]/],
    ["08","b",/product_or_one\(\[2, -3, 4, 1\]/],
    ["09","original",/isclose\(1\.0, 1\.125, 0\.125\) === isclose/],
    ["09","a",/approxzero\(0\.0000002/],
    ["09","b",/near_relative\(100, 101, 0\.02\) === near_relative/],
    ["13","original",/norm\(\[3\.0 0; -1 2\]/],
    ["13","a",/backward_substitution\(\[3\.0 -2; 0 5\]/],
    ["13","b",/forward_substitution\(\[4\.0 0; -3 2\]/]
  ];
  for(const [lesson,variant,regex] of examples){
    assert.match(buildPropertyFile(lesson,variant,"# source").content,regex);
  }
});
