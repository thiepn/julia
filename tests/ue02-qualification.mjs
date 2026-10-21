import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {CANCELLATION_EXAMPLE,CONDITION_EXAMPLE} from "../src/ue02-practice.js";
import {PLOT_RECIPES} from "../src/plotting-practice.js";
function runJulia(code, label) {
  const result=spawnSync("julia",["--startup-file=no","--color=no","-e",code],{encoding:"utf8",timeout:120000});
  if(result.error)throw result.error;
  assert.equal(result.status,0,label+": "+(result.stdout||"")+"\n"+(result.stderr||""));
  console.log("JULIA PASS",label);
}
const calculation=CANCELLATION_EXAMPLE.split("\n").filter(line=>!line.startsWith("using PrettyTables")&&!line.startsWith("pretty_table(")).join("\n");
runJulia(calculation+"\nusing Test\n@test size(data)==(4,3)\n@test data[:,1]==eps\n@test direct[end]==0.0\n@test stable[end]>0\n@test abs(direct[1]-stable[1])/stable[1]<1e-10\n","UE02 cancellation source");
runJulia(CONDITION_EXAMPLE+"\nusing Test\n@test relative_condition_sin(0.0)==Inf\n@test isapprox(relative_condition_sin(1.0),abs(cos(1.0)/sin(1.0)),atol=1e-14)\n@test relative_condition_sin(0.1)>0\n","UE02 relative conditioning source");
for(const [lesson,recipe] of Object.entries(PLOT_RECIPES)) {
  runJulia("using Test\nexpr=Meta.parseall("+JSON.stringify(recipe.code)+")\n@test expr isa Expr\n@test !isempty(expr.args)\n","Plots.jl source syntax "+lesson+" (package execution not tested)");
}
