import {MAX_DRAFT_LENGTH} from "./workspace.js";

// These checks are Julia Test assertions for externally running learner functions.
// Neither generating nor downloading a test file evaluates the learner's code.
const suite=(title,cases)=>Object.freeze({title,cases:Object.freeze(cases.map(([name,assertion])=>Object.freeze({name,assertion})))});
export const EXTERNAL_TEST_SUITES=Object.freeze({
  "08":Object.freeze({
    original:suite("sum_of_squares",[
      ["Ordinary input","@test sum_of_squares([1, 2, 3]) == 14"],
      ["Signed values","@test sum_of_squares([-2, 2]) == 8"],
      ["Empty input","@test sum_of_squares(Int[]) == 0"],
      ["Mixed zero and signs","@test sum_of_squares([0, -3, 4]) == 25"]
    ]),
    a:suite("count_above",[
      ["Threshold inside data","@test count_above([1, 4, 6], 3) == 2"],
      ["Empty input","@test count_above(Int[], 3) == 0"],
      ["Strict inequality boundary","@test count_above([1, 4, 6], 6) == 0"],
      ["Negative threshold","@test count_above([-2, 0, 2], -1) == 2"]
    ]),
    b:suite("product_or_one",[
      ["Ordinary product","@test product_or_one([2, 3, 4]) == 24"],
      ["Empty input identity","@test product_or_one(Int[]) == 1"],
      ["Signed values","@test product_or_one([-2, 3]) == -6"],
      ["Zero factor","@test product_or_one([0, 5]) == 0"],
      ["Three negative factors","@test product_or_one([-1, -2, -3]) == -6"]
    ])
  }),
  "09":Object.freeze({
    original:suite("isclose",[
      ["Floating-point near equality","@test isclose(0.1 + 0.2, 0.3, 1e-12) === true"],
      ["Outside tolerance","@test isclose(1, 1.1, 1e-3) === false"],
      ["Exact equality with zero tolerance","@test isclose(0, 0, 0) === true"],
      ["Inclusive tolerance boundary","@test isclose(1, 1.125, 0.125) === true"]
    ]),
    a:suite("approxzero",[
      ["Inside tolerance","@test approxzero(1e-7, 1e-6) === true"],
      ["Outside tolerance","@test approxzero(1e-7, 1e-8) === false"],
      ["Zero boundary","@test approxzero(0, 0) === true"],
      ["Negative value inside tolerance","@test approxzero(-1e-8, 1e-7) === true"]
    ]),
    b:suite("near_relative",[
      ["Within scaled tolerance","@test near_relative(100, 101, 0.02) === true"],
      ["Outside scaled tolerance","@test near_relative(100, 101, 0.001) === false"],
      ["Both inputs zero","@test near_relative(0, 0, 0) === true"],
      ["Negative scaled inputs","@test near_relative(-100, -101, 0.02) === true"]
    ])
  }),
  "12":Object.freeze({mission:suite("solve_checked",[
    ["Diagonal system","@test isapprox(solve_checked([3.0 0; 0 2.0], [9.0, 8.0]).x, [3.0, 4.0]; atol=1e-10)"],
    ["Non-diagonal system","@test isapprox(solve_checked([2.0 1; 1 3], [4.0, 7.0]).x, [1.0, 2.0]; atol=1e-10)"],
    ["Three-dimensional system","@test isapprox(solve_checked([2.0 0 0; 0 3 0; 0 0 4], [4.0, 9.0, 16.0]).x, [2.0, 3.0, 4.0]; atol=1e-10)"],
    ["Residual check","@test solve_checked([2.0 1; 1 3], [4.0, 7.0]).residual < 1e-10"]
  ])}),
  "14":Object.freeze({mission:suite("factorization_errors",[
    ["QR reconstruction","@test factorization_errors([4.0 1; 1 3]).qr_error < 1e-10"],
    ["Cholesky reconstruction","@test factorization_errors([4.0 1; 1 3]).chol_error < 1e-10"],
    ["Another SPD matrix","@test factorization_errors([9.0 3; 3 5]).chol_error < 1e-10"],
    ["Three-dimensional SPD matrix","@test factorization_errors([4.0 1 0; 1 3 0; 0 0 2]).qr_error < 1e-10"]
  ])}),
  "15":Object.freeze({mission:suite("fit_line",[
    ["Exact line","@test isapprox(fit_line([0.0,1,2,3], [2.0,5,8,11]).coefficients, [2.0,3.0]; atol=1e-10)"],
    ["Constant observations","@test isapprox(fit_line([0.0,1,2], [4.0,4,4]).coefficients, [4.0,0.0]; atol=1e-10)"],
    ["Noisy data coefficients","@test isapprox(fit_line([0.0,1,2], [1.0,3,6]).coefficients, [5/6,2.5]; atol=1e-10)"],
    ["Noisy residual","@test isapprox(fit_line([0.0,1,2], [1.0,3,6]).residual, sqrt(1/6); atol=1e-10)"]
  ])}),
  "16":Object.freeze({mission:suite("solution_sensitivity",[
    ["Identity matrix","@test isapprox(solution_sensitivity([1.0 0; 0 1], [1.0,1], [0.0,1e-4]).change, 1e-4; atol=1e-10)"],
    ["Ill-conditioned direction","@test isapprox(solution_sensitivity([1.0 0; 0 1e-4], [1.0,1], [0.0,1e-4]).change, 1.0; atol=1e-10)"],
    ["Zero perturbation","@test solution_sensitivity([1.0 0; 0 1e-4], [1.0,1], [0.0,0]).change == 0"],
    ["Perturbed residual","@test solution_sensitivity([1.0 0; 0 1e-4], [1.0,1], [0.0,1e-4]).perturbed_residual < 1e-10"]
  ])}),
  "13":Object.freeze({
    original:suite("forward_substitution",[
      ["Triangular example","@test isapprox(forward_substitution([2.0 0; 1 3], [4.0, 7.0]), [2.0, 5/3]; atol=1e-10)"],
      ["Identity matrix","@test isapprox(forward_substitution([1.0 0; 0 1], [5.0, 6.0]), [5.0, 6.0]; atol=1e-10)"],
      ["Diagonal system","@test isapprox(forward_substitution([2.0 0; 0 5], [4.0, 15.0]), [2.0, 3.0]; atol=1e-10)"],
      ["Signed off-diagonal","@test isapprox(forward_substitution([2.0 0; -4 2], [6.0, -8.0]), [3.0, 2.0]; atol=1e-10)"]
    ]),
    a:suite("backward_substitution",[
      ["Upper-triangular example","@test isapprox(backward_substitution([2.0 1; 0 3], [7.0, 9.0]), [2.0, 3.0]; atol=1e-10)"],
      ["Identity matrix","@test isapprox(backward_substitution([1.0 0; 0 1], [5.0, 6.0]), [5.0, 6.0]; atol=1e-10)"],
      ["Diagonal system","@test isapprox(backward_substitution([2.0 0; 0 5], [4.0, 15.0]), [2.0, 3.0]; atol=1e-10)"],
      ["Negative upper entry","@test isapprox(backward_substitution([3.0 -2; 0 4], [5.0, 8.0]), [3.0, 2.0]; atol=1e-10)"]
    ]),
    b:suite("forward_substitution",[
      ["New triangular example","@test isapprox(forward_substitution([1.0 0; 2 4], [3.0, 14.0]), [3.0, 2.0]; atol=1e-10)"],
      ["Identity matrix","@test isapprox(forward_substitution([1.0 0; 0 1], [5.0, 6.0]), [5.0, 6.0]; atol=1e-10)"],
      ["Diagonal system","@test isapprox(forward_substitution([2.0 0; 0 5], [4.0, 15.0]), [2.0, 3.0]; atol=1e-10)"],
      ["Signed off-diagonal","@test isapprox(forward_substitution([2.0 0; -4 2], [6.0, -8.0]), [3.0, 2.0]; atol=1e-10)"]
    ])
  })
});
const variants=Object.freeze(["original","a","b","mission"]);
export function externalTestSuite(lessonId,variant){
  if(typeof lessonId!=="string"||!variants.includes(variant)||!Object.hasOwn(EXTERNAL_TEST_SUITES,lessonId))return null;
  return Object.hasOwn(EXTERNAL_TEST_SUITES[lessonId],variant)?EXTERNAL_TEST_SUITES[lessonId][variant]:null;
}
// Single source export path for fixed regression and original property checks.
// The caller supplies only source-authored assertions; this does not execute code.
export function buildJuliaTestFile(lessonId,variant,code,tests,suffix="",scopeNote="Source-aligned tests"){
  const suite=externalTestSuite(lessonId,variant);
  if(!suite)throw new RangeError("No qualified Julia function interface for this task.");
  if(typeof code!=="string"||code.length>MAX_DRAFT_LENGTH)
    throw new RangeError("Source exceeds the editor limit.");
  if(!Array.isArray(tests)||tests.length===0||tests.some(t=>typeof t.name!=="string"||typeof t.assertion!=="string"||!t.assertion.startsWith("@test ")))
    throw new RangeError("Unsupported test cases.");
  if(typeof suffix!=="string"||!/^(?:|-case-\d{2}|-properties|-property-p[12])$/.test(suffix))
    throw new RangeError("Unsupported test file suffix.");
  const filename="amp-julia-lab-lesson-"+lessonId+
    (variant==="original"?"":"-transfer-"+variant)+suffix+"-tests.jl";
  const assertions=tests.map(c=>"    @testset "+JSON.stringify(c.name)+" begin\n        "+c.assertion+"\n    end").join("\n");
  const content="using Test\nusing LinearAlgebra\n\n"+
    "# Learner's Julia source. This file will run it when opened in Julia.\n"+
    code+"\n\n"+
    "# "+scopeNote+"; generated in-browser, NOT run or graded by Julia Lab.\n"+
    (suffix.startsWith("-case-")?"# Focused reproduction only; rerun the full suite after repair.\n":"")+
    '@testset "AMP '+lessonId+" "+suite.title+'" begin\n'+assertions+"\nend\n";
  return {filename,content,mime:"text/plain;charset=utf-8"};
}
export function buildExternalTestFile(lessonId,variant,code,caseName=null){
  const suite=externalTestSuite(lessonId,variant);
  if(!suite)throw new RangeError("No external Julia test suite for this task.");
  if(typeof code!=="string"||code.length>MAX_DRAFT_LENGTH)throw new RangeError("Source exceeds the editor limit.");
  const index=caseName===null?-1:suite.cases.findIndex(c=>c.name===caseName);
  if(caseName!==null&&(typeof caseName!=="string"||index===-1))
    throw new RangeError("Unknown test case for selected lesson and task.");
  const focused=index>=0;
  return buildJuliaTestFile(lessonId,variant,code,
    focused?[suite.cases[index]]:suite.cases,
    focused?"-case-"+String(index+1).padStart(2,"0"):"",
    "Source-aligned tests");
}
