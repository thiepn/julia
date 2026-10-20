import test from "node:test";
import assert from "node:assert/strict";
import {lessons} from "../src/lessons.js";
import {transferForLesson} from "../src/transfer-cases.js";
import {externalTestSuite,buildExternalTestFile} from "../src/external-tests.js";
import {DESIGN_CONTRACTS,contractForTask,designScaffold} from "../src/algorithm-design.js";

test("nine source-aligned design contracts cover callable functions without inventing other task contracts",()=>{
  assert.deepEqual(Object.keys(DESIGN_CONTRACTS).sort(),["08","09","13"]);
  const known=new Set(lessons.map(l=>l.id));
  let found=0;
  for(const [lesson,variants] of Object.entries(DESIGN_CONTRACTS)){
    assert.ok(known.has(lesson));
    assert.deepEqual(Object.keys(variants).sort(),["a","b","original"].sort());
    for(const variant of ["original","a","b"]){
      const contract=contractForTask(lesson,variant),suite=externalTestSuite(lesson,variant);
      assert.equal(contract,variants[variant]);
      assert.equal(contract.name,suite.title);
      const statement=variant==="original"?lessons.find(l=>l.id===lesson).challenge:transferForLesson(lesson,variant).task;
      assert.ok(statement.length>40);
      assert.ok(contract.inputs.length>16);
      assert.ok(contract.output.length>20);
      assert.equal(contract.steps.length,3);
      assert.equal(new Set(contract.steps.map(s=>s.label)).size,3);
      for(const s of contract.steps){
        assert.ok(s.question.endsWith("?"));
        assert.ok(s.question.length>25);
        assert.ok(s.guide.length>25);
      }
      found++;
    }
  }
  assert.equal(found,9);
});
test("every design exports an incomplete callable Julia function with correct source signature",()=>{
  let count=0;
  for(const [lesson,variants] of Object.entries(DESIGN_CONTRACTS))
    for(const [variant,contract] of Object.entries(variants)){
      const code=designScaffold(lesson,variant);
      assert.ok(code.startsWith("function "+contract.name+"("+contract.args+")\n"));
      assert.ok(code.endsWith("\nend\n"));
      assert.equal((code.match(/# Step [123]:/g)||[]).length,3);
      assert.match(code,/error\("TODO: implement /);
      assert.ok(!code.includes("@test "));
      const generated=buildExternalTestFile(lesson,variant,code);
      assert.match(generated.content,/TODO: implement /);
      assert.equal((generated.content.match(/@testset /g)||[]).length,externalTestSuite(lesson,variant).cases.length+1);
      assert.ok(generated.content.indexOf(code)<generated.content.indexOf("@testset"));
      count++;
    }
  assert.equal(count,9);
});
test("contracts are independently authored for variants and preserve original function names",()=>{
  for(const lesson of ["08","09","13"]){
    for(const variant of ["original","a","b"]){
      const contract=contractForTask(lesson,variant);
      assert.ok(designScaffold(lesson,variant).includes("TODO: implement "+contract.name));
    }
  }
  assert.equal(contractForTask("08","a").name,"count_above");
  assert.equal(contractForTask("08","b").name,"product_or_one");
  assert.equal(contractForTask("09","a").name,"approxzero");
  assert.equal(contractForTask("09","b").name,"near_relative");
  assert.equal(contractForTask("13","a").name,"backward_substitution");
  assert.equal(contractForTask("13","original").name,"forward_substitution");
});
test("invalid lesson and prototype-key variants fail closed without generating code",()=>{
  for(const [lesson,variant] of [["01","original"],["16","a"],["17","original"],["constructor","a"],["__proto__","b"],["08","constructor"],["08","__proto__"],["13","c"]]){
    assert.equal(contractForTask(lesson,variant),null);
    assert.throws(()=>designScaffold(lesson,variant),RangeError);
  }
});
test("design scaffold contains mathematical algorithm questions, not a completed implementation",()=>{
  for(const [lesson,variants] of Object.entries(DESIGN_CONTRACTS))
    for(const [variant,contract] of Object.entries(variants)){
      const scaffold=designScaffold(lesson,variant);
      assert.ok(contract.steps.every(s=>scaffold.includes("# Step "+(contract.steps.indexOf(s)+1)+": "+s.question)));
      assert.equal((scaffold.match(/\nend\n/g)||[]).length,1);
      assert.equal((scaffold.match(/\n    error\("TODO:/g)||[]).length,1);
    }
});
