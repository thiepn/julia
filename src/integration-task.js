import {MAX_DRAFT_LENGTH} from "./workspace.js";

// An independent cross-lesson integration task, not a second code editor.
// Only the two named, learner-owned mission sources are included at export time.
export const INTEGRATION_TASK=Object.freeze({
  title:"Integration · Reuse two numerical functions",
  task:"Implement analyze_perturbation(A,b,db) using your solve_checked(A,b) from Lesson 12 and solution_sensitivity(A,b,db) from Lesson 16. Return (base_residual=..., change=..., perturbed_residual=...) using fields produced by those two functions. Your implementation must work for unfamiliar square systems and perturbations. Do not hardcode any output or replace the saved source of either dependency.",
  starter:"function analyze_perturbation(A,b,db)\n    # Call your two saved functions; return their computed values.\n    error(\"TODO: integrate solve_checked and solution_sensitivity\")\nend\n",
  checks:"Call solve_checked(A,b) and solution_sensitivity(A,b,db); use their named fields. Check identity, non-diagonal, perturbed and three-dimensional systems.",
  plan:"Read the named-tuple returned by solve_checked for base_residual and the named-tuple from solution_sensitivity for change and perturbed_residual. Never copy a hardcoded example result.",
  verify:"Compare the exported combined file with the current saved drafts in Lessons 12 and 16. Run the Julia Test script externally. The app does not observe the result."
});
export function integrationForLesson(lesson){
  return lesson==="16"?INTEGRATION_TASK:null;
}
const cases=Object.freeze([
  Object.freeze({name:"Identity and perturbation",assertion:"@test isapprox(analyze_perturbation([1.0 0;0 1], [1.0,2.0], [0.0,1e-4]).change, 1e-4; atol=1e-10)"}),
  Object.freeze({name:"Ill-conditioned direction",assertion:"@test isapprox(analyze_perturbation([1.0 0;0 1e-4], [1.0,2.0], [0.0,1e-4]).change, 1.0; atol=1e-10)"}),
  Object.freeze({name:"Non-diagonal residuals",assertion:"@test begin r=analyze_perturbation([2.0 1;1 3], [4.0,7.0], [0.0,0.0]); r.base_residual < 1e-10 && r.perturbed_residual < 1e-10 && r.change == 0 end"}),
  Object.freeze({name:"Three-dimensional transfer",assertion:"@test isapprox(analyze_perturbation([2.0 0 0;0 3 0;0 0 4], [4.0,9.0,16.0], [0.01,0.0,0.0]).change, 0.005; atol=1e-10)"}),
  Object.freeze({name:"Perturbed residual corresponds to perturbed system",assertion:"@test begin r=analyze_perturbation([3.0 1;1 2], [4.0,5.0], [0.01,-0.02]); r.base_residual < 1e-10 && r.perturbed_residual < 1e-10 end"})
]);
export function integrationCases(){return cases;}
export function buildIntegrationTestFile(integrationCode,solveCode,sensitivityCode){
  for(const code of [integrationCode,solveCode,sensitivityCode]){
    if(typeof code!=="string"||code.length>MAX_DRAFT_LENGTH)
      throw new RangeError("Julia source is invalid or exceeds the editor limit.");
  }
  // Julia is NOT executed here. All source is loaded locally from the three
  // original task drafts; this function does not persist or transmit it.
  const lines=cases.map(c=>"    @testset "+JSON.stringify(c.name)+" begin\n        "+c.assertion+"\n    end").join("\n");
  return {
    filename:"amp-julia-lab-12-16-integration-tests.jl",
    mime:"text/plain;charset=utf-8",
    content:"using Test\nusing LinearAlgebra\n\n"+
      "# Lesson 12: learner's solve_checked function\n"+solveCode+
      "\n\n# Lesson 16: learner's solution_sensitivity function\n"+sensitivityCode+
      "\n\n# Lesson 16 integration: learner's analyze_perturbation function\n"+integrationCode+
      "\n\n# Independent Julia tests; no execution or grading occurs in the browser.\n"+
      '@testset "AMP integration 12+16" begin\n'+lines+"\nend\n"
  };
}
