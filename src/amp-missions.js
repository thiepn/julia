// Independent numerical transfer tasks; Julia Test is the existing external test authority.
import {MAX_DRAFT_LENGTH} from "./workspace.js";
const mission=(id,lesson,title,task,starter,checks)=>Object.freeze({id,lesson,title,task,starter,
  checks:Object.freeze(checks.map(([name,code])=>Object.freeze({name,code})))});
export const AMP_MISSIONS=Object.freeze({
  stable_change:mission("stable_change","09","Cancellation-resistant difference",
    "Implement stable_change(t) for t ≥ 0. Return sqrt(1+t) − 1 without loss from subtracting near-equal numbers.",
    "function stable_change(t)\n    # TODO: use an algebraically equivalent expression.\nend",
    [
      ["Ordinary input","@test isapprox(stable_change(3.0), 1.0; atol=1e-13)"],
      ["Small perturbation","@test isapprox(stable_change(1e-12), 1e-12/(sqrt(1+1e-12)+1); rtol=1e-12)"],
      ["Zero boundary","@test stable_change(0.0) == 0.0"],
      ["Other numeric input","@test isapprox(stable_change(0.8), 0.8/(sqrt(1.8)+1); rtol=1e-12)"]
    ]),
  relative_response:mission("relative_response","09","Relative perturbation measurement",
    "Write relative_response(f, x, eta) that returns the magnitude of the relative output change divided by the magnitude of the relative input change. Assume x ≠ 0, f(x) ≠ 0, eta ≠ 0.",
    "function relative_response(f, x, eta)\n    # TODO: compare f(x*(1+eta)) with f(x).\nend",
    [
      ["Identity","@test isapprox(relative_response(identity,2.0,0.001),1.0; atol=1e-10)"],
      ["Square function","@test isapprox(relative_response(x->x^2,3.0,1e-4),2.0001; atol=1e-8)"],
      ["Shifted square","@test isapprox(relative_response(x->(x+1)^2,1.0,1e-4),1.000025; atol=1e-7)"],
      ["Smaller delta","@test isapprox(relative_response(identity,5.0,1e-5),1.0; atol=1e-9)"]
    ]),
  small_root:mission("small_root","16","Stable smaller quadratic root",
    "Implement small_root(a,b) for a > 0 and 0 < b ≤ a². The polynomial is x² − 2ax + b. Avoid cancellation when b is small. This is independent transfer practice, not the Übung 2 submission table.",
    "function small_root(a, b)\n    # TODO: compute the discriminant and a stable smaller root.\nend",
    [
      ["Separated roots","@test isapprox(small_root(2.0,3.0),1.0; atol=1e-13)"],
      ["Tiny root","@test isapprox(small_root(3.0,1e-12),1e-12/(3+sqrt(9-1e-12)); rtol=1e-12)"],
      ["Close roots","@test isapprox(small_root(3.0,9-1e-8),3-sqrt(1e-8); atol=1e-8)"],
      ["Repeated root","@test isapprox(small_root(4.0,16.0),4.0; atol=1e-13)"]
    ])
});
export function missionsForLesson(id){return Object.values(AMP_MISSIONS).filter(m=>m.lesson===id);}
export function ampMission(id){return Object.hasOwn(AMP_MISSIONS,id)?AMP_MISSIONS[id]:null;}
export function buildAmpJuliaTests(id,source){
  const task=ampMission(id);
  if(!task||typeof source!=="string"||source.length>MAX_DRAFT_LENGTH)throw new RangeError("Unknown mission or oversized source");
  const tests=task.checks.map(x=>"    @testset "+JSON.stringify(x.name)+" begin\n        "+x.code+"\n    end").join("\n");
  // A downloadable self-contained Test script, not executed or graded by the browser.
  return {filename:"amp-ue02-"+id+"-tests.jl",mime:"text/plain;charset=utf-8",
    content:"using Test\n\n"+source+"\n\n@testset "+JSON.stringify(task.title)+" begin\n"+tests+"\nend\n"};
}
