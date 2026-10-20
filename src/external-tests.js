import {MAX_DRAFT_LENGTH} from "./workspace.js";

// These checks are Julia Test assertions for externally running learner functions.
// Neither generating nor downloading a test file evaluates the learner's code.
const suite=(title,cases)=>Object.freeze({title,cases:Object.freeze(cases.map(([name,assertion])=>Object.freeze({name,assertion})))});
export const EXTERNAL_TEST_SUITES=Object.freeze({
  "08":Object.freeze({
    original:suite("sum_of_squares",[
      ["Ordinary input","@test sum_of_squares([1, 2, 3]) == 14"],
      ["Signed values","@test sum_of_squares([-2, 2]) == 8"],
      ["Empty input","@test sum_of_squares(Int[]) == 0"]
    ]),
    a:suite("count_above",[
      ["Threshold inside data","@test count_above([1, 4, 6], 3) == 2"],
      ["Empty input","@test count_above(Int[], 3) == 0"],
      ["Strict inequality boundary","@test count_above([1, 4, 6], 6) == 0"]
    ]),
    b:suite("product_or_one",[
      ["Ordinary product","@test product_or_one([2, 3, 4]) == 24"],
      ["Empty input identity","@test product_or_one(Int[]) == 1"],
      ["Signed values","@test product_or_one([-2, 3]) == -6"],
      ["Zero factor","@test product_or_one([0, 5]) == 0"]
    ])
  }),
  "09":Object.freeze({
    original:suite("isclose",[
      ["Floating-point near equality","@test isclose(0.1 + 0.2, 0.3, 1e-12) === true"],
      ["Outside tolerance","@test isclose(1, 1.1, 1e-3) === false"],
      ["Exact equality with zero tolerance","@test isclose(0, 0, 0) === true"]
    ]),
    a:suite("approxzero",[
      ["Inside tolerance","@test approxzero(1e-7, 1e-6) === true"],
      ["Outside tolerance","@test approxzero(1e-7, 1e-8) === false"],
      ["Zero boundary","@test approxzero(0, 0) === true"]
    ]),
    b:suite("near_relative",[
      ["Within scaled tolerance","@test near_relative(100, 101, 0.02) === true"],
      ["Outside scaled tolerance","@test near_relative(100, 101, 0.001) === false"],
      ["Both inputs zero","@test near_relative(0, 0, 0) === true"]
    ])
  }),
  "13":Object.freeze({
    original:suite("forward_substitution",[
      ["Triangular example","@test isapprox(forward_substitution([2.0 0; 1 3], [4.0, 7.0]), [2.0, 5/3]; atol=1e-10)"],
      ["Identity matrix","@test isapprox(forward_substitution([1.0 0; 0 1], [5.0, 6.0]), [5.0, 6.0]; atol=1e-10)"],
      ["Diagonal system","@test isapprox(forward_substitution([2.0 0; 0 5], [4.0, 15.0]), [2.0, 3.0]; atol=1e-10)"]
    ]),
    a:suite("backward_substitution",[
      ["Upper-triangular example","@test isapprox(backward_substitution([2.0 1; 0 3], [7.0, 9.0]), [2.0, 3.0]; atol=1e-10)"],
      ["Identity matrix","@test isapprox(backward_substitution([1.0 0; 0 1], [5.0, 6.0]), [5.0, 6.0]; atol=1e-10)"],
      ["Diagonal system","@test isapprox(backward_substitution([2.0 0; 0 5], [4.0, 15.0]), [2.0, 3.0]; atol=1e-10)"]
    ]),
    b:suite("forward_substitution",[
      ["New triangular example","@test isapprox(forward_substitution([1.0 0; 2 4], [3.0, 14.0]), [3.0, 2.0]; atol=1e-10)"],
      ["Identity matrix","@test isapprox(forward_substitution([1.0 0; 0 1], [5.0, 6.0]), [5.0, 6.0]; atol=1e-10)"],
      ["Diagonal system","@test isapprox(forward_substitution([2.0 0; 0 5], [4.0, 15.0]), [2.0, 3.0]; atol=1e-10)"]
    ])
  })
});
const variants=Object.freeze(["original","a","b"]);
export function externalTestSuite(lessonId,variant){
  if(typeof lessonId!=="string"||!variants.includes(variant)||!Object.hasOwn(EXTERNAL_TEST_SUITES,lessonId))return null;
  return EXTERNAL_TEST_SUITES[lessonId][variant]??null;
}
export function buildExternalTestFile(lessonId,variant,code){
  const suite=externalTestSuite(lessonId,variant);
  if(!suite)throw new RangeError("No external Julia test suite for this task.");
  if(typeof code!=="string"||code.length>MAX_DRAFT_LENGTH)throw new RangeError("Source exceeds the editor limit.");
  // Never rewrite or validate arbitrary Julia source. It will only run after the
  // learner explicitly opens this file with their own Julia installation.
  const filename="amp-julia-lab-lesson-"+lessonId+
    (variant==="original"?"":"-transfer-"+variant)+"-tests.jl";
  const assertions=suite.cases.map(c=>"    @testset "+JSON.stringify(c.name)+" begin\n        "+c.assertion+"\n    end").join("\n");
  const content="using Test\nusing LinearAlgebra\n\n"+
    "# Learner's Julia source. This file will run it when opened in Julia.\n"+
    code+"\n\n"+
    "# Source-aligned tests: generated in-browser, NOT run or graded by Julia Lab.\n"+
    '@testset "AMP '+lessonId+" "+suite.title+'" begin\n'+assertions+"\nend\n";
  return {filename,content,mime:"text/plain;charset=utf-8"};
}
