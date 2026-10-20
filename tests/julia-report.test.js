import test from "node:test";
import assert from "node:assert/strict";
import {inspectJuliaReport,MAX_REPORT_LENGTH} from "../src/julia-report.js";
import {externalTestSuite,buildExternalTestFile} from "../src/external-tests.js";
test("authored Julia nested testsets expose identifiable per-case labels",()=>{
  for(const lesson of ["08","09","13"])for(const variant of ["original","a","b"]){
    const suite=externalTestSuite(lesson,variant);
    const file=buildExternalTestFile(lesson,variant,"# reviewed reference fixture");
    assert.equal((file.content.match(/@testset /g)||[]).length,suite.cases.length+1);
    for(const c of suite.cases){
      assert.ok(file.content.includes('@testset "'+c.name+'" begin'));
      assert.ok(file.content.includes(c.assertion));
    }
  }
});
test("malformed and unsupported pasted reports do not imply execution",()=>{
  const blank=inspectJuliaReport("","08","a");
  assert.equal(blank.kind,"empty");
  assert.match(blank.advice,/paste its terminal output/);
  assert.equal(inspectJuliaReport("Test Summary: | Pass Total","16","a").kind,"unsupported");
  assert.equal(inspectJuliaReport("x".repeat(MAX_REPORT_LENGTH+1),"08","a").kind,"too-large");
  assert.equal(inspectJuliaReport("hello world","08","a").kind,"unrecognized");
  assert.equal(inspectJuliaReport(null,"08","a").kind,"empty");
});
test("Julia-like failure text identifies named cases without asserting real execution",()=>{
  const failed="AMP 08 count_above: Test Failed at /tmp/fixture.jl:14\n"+
    "  Expression: count_above(Int[], 3) == 0\n"+
    "   Evaluated: 1 == 0\n"+
    "Test Summary: | Pass  Fail  Total\n"+
    "AMP 08 count_above | 2 1 3\n"+
    "  Empty input | 0 1 1\n";
  const r=inspectJuliaReport(failed,"08","a");
  assert.equal(r.kind,"failed");
  assert.deepEqual(r.cases,["Empty input"]);
  assert.match(r.advice,/first Test Failed/);
  assert.equal(inspectJuliaReport("Some tests did not pass: 2 passed, 1 failed.","08","a").kind,"failed");
});
test("syntax, undefined and MethodError messages produce distinct correction paths",()=>{
  const examples=[
    ["ERROR: LoadError: ParseError: missing end","syntax"],
    ["UndefVarError: count_above not defined in Main","undefined"],
    ["MethodError: no method matching count_above(::Vector{Int64})","method"],
    ["Error During Test at testfile.jl:10","failed"]
  ];
  for(const [snippet,kind] of examples){
    const result=inspectJuliaReport(snippet,"08","a");
    assert.equal(result.kind,kind,snippet);
    assert.ok(result.advice.length>45);
    assert.ok(result.title.startsWith("Pasted Julia"));
  }
  assert.match(inspectJuliaReport(examples[1][0],"09","a").advice,/approxzero/);
});
test("pasted success-looking summary stays unauthenticated",()=>{
  const result=inspectJuliaReport("Test Summary: | Pass  Total\nAMP 08 count_above | 3 3\n","08","a");
  assert.equal(result.kind,"summary");
  assert.match(result.advice,/does not verify/);
  assert.doesNotMatch(result.title,/PASS|Verified|Passed/);
  assert.deepEqual(result.cases,[]);
});
test("ANSI-colored terminal text cannot spoof verified execution",()=>{
  const sample="\u001b[31mTest Failed\u001b[0m\n  Ordinary product | 0 1 1\n";
  const result=inspectJuliaReport(sample,"08","b");
  assert.equal(result.kind,"failed");
  assert.deepEqual(result.cases,["Ordinary product"]);
});
