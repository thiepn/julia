// Independently authored AMP depth practice. Lesson IDs and saved drafts remain canonical.
const T=(id,lesson,title,concept,starter,steps,question,source,checks=[])=>Object.freeze({
 id,lesson,title,concept,starter,steps:Object.freeze(steps),question,source,
 checks:Object.freeze(checks.map(([name,assertion])=>Object.freeze({name,assertion})))
});
export const COMPLETION_TRACKS=Object.freeze({
 matrix_shapes:T("matrix_shapes","02","Array dimensions, mutation and broadcasting",
 "A Julia matrix has rows and columns. A[i,j] selects one entry, A[:,j] selects one column, and dots broadcast operations elementwise. Summing over dims=1 preserves a row dimension; vec converts this into a vector.",
 "function column_energy(A)\n    # Return a vector with the sum of squared entries in each column.\n    # Use the column count of A, not a fixed dimension.\nend",
 ["Predict size(A) and size(A[:,2]) for a 2×3 matrix.","Compare A .^ 2 with A^2 and explain why they differ.","Implement and test unfamiliar rectangular and single-row matrices.","Explain when a view or copy may change the original array."],
 "Why do sum(abs2.(A); dims=1) and vec(sum(abs2.(A); dims=1)) have different shapes?",
 "Julia manual Arrays and Broadcasting; Kalicharan, arrays",[
 ["non-square matrix","@test column_energy([3 4;0 0]) == [9,16]"],
 ["rectangular matrix","@test column_energy([1 2 3;2 3 4]) == [5,13,25]"],
 ["single row","@test column_energy(reshape([2.,-3.],1,2)) ≈ [4.,9.]"],
 ["zeros","@test column_energy(zeros(3,2)) == [0.,0.]"]
 ]),
 control_flow:T("control_flow","07","Loops, scope and boundaries",
 "Functions use local scope. A loop visits each collection element. Define a reusable function that sums min(x, cap) across the input without modifying the vector.",
 "function clipped_total(values, cap)\n    # Sum min(x,cap) for all entries, including negative and empty inputs.\nend",
 ["Trace the accumulator for [-2,1,7,9] and cap 5.","Compare an explicit loop with a comprehension.","Explain why a local accumulator avoids global-scope problems.","Test a zero-length vector and a negative cap."],
 "What test distinguishes a generic algorithm from a hard-coded result?",
 "Julia manual Functions/Control Flow/Scope; Kalicharan, loops",[
 ["mixed signs","@test clipped_total([-2,1,7,9],5) == 9"],
 ["empty","@test clipped_total(Int[],3) == 0"],
 ["inclusive boundary","@test clipped_total([3,3,4],3) == 9"],
 ["negative bound","@test clipped_total([-2,-1,0],-1) == -4"]
 ]),
 row_means:T("row_means","08","Methods, functions and rows",
 "The generic function should operate on integer and floating matrices. size(A,2) gives the column count, sum(A;dims=2) returns a column matrix, and a row mean can be fractional even for integer input.",
 "function row_means(A)\n    # Return a floating vector with the mean of each row.\n    # Assume at least one column.\nend",
 ["Compare sum(A;dims=1) with sum(A;dims=2).","Check single-column inputs and negative values.","Avoid integer rounding or fixed matrix dimensions.","Use an unfamiliar 3×4 matrix to verify the result length."],
 "Why must an integer matrix be allowed to produce non-integer means?",
 "Julia manual Functions and Arrays; Kalicharan, functions",[
 ["rectangular","@test row_means([2 4 6;1 3 5]) ≈ [4.,3.]"],
 ["negative","@test row_means([-2 -4;2 4]) ≈ [-3.,3.]"],
 ["single column","@test row_means(reshape([2.,5.],2,1)) ≈ [2.,5.]"],
 ["fractional average","@test row_means([1 2;3 4]) ≈ [1.5,3.5]"]
 ]),
 environment:T("environment","04","Julia REPL and package environments",
 "Shell commands, the julia> prompt and the pkg> prompt are different contexts. A Project.toml identifies direct dependencies, while Manifest.toml records resolved versions. The current Julia environment determines whether using Plots succeeds.",
 "using Pkg\nprintln(\"Julia version: \", VERSION)\nprintln(\"Active project: \", Base.active_project())\n# Read project files before adding or updating packages.",
 ["Run julia --version in your system terminal, not at the julia> prompt.","Inspect Base.active_project() and explain what it identifies.","Compare Pkg.activate with Pkg.instantiate; neither is an automatic website action.","Run a plotting lesson in a deliberately selected local project."],
 "If using Plots fails, which active environment and dependencies should you check?",
 "University AMP Zentralübung installation and Julia 1.11 Pkg manual"),
 precision:T("precision","09","Float32/Float64 and spacing",
 "Representable floating-point numbers have magnitude-dependent gaps. nextfloat(1.0)-1.0 measures spacing near one; type conversions change rounded representations. A numerical observation is not proof of a mathematical limit.",
 "for T in (Float32,Float64)\n    x = one(T)\n    println((type=T,spacing=nextfloat(x)-x,eps=eps(T),decimal=T(0.1)))\nend",
 ["Interpret eps(Float32) versus eps(Float64).","Find the neighbors of 1.0 with prevfloat and nextfloat.","Investigate underflow and overflow without confusing them with convergence.","Explain the difference between numerical sensitivity and roundoff."],
 "Can two types have different spacing at exactly the same mathematical magnitude?",
 "AMP machine-number scope; Julia manual numeric types"),
 sensitivity:T("sensitivity","16","Forward/backward error and condition",
 "A small residual measures how well the computed result satisfies an equation; it does not necessarily bound the error in the unknown. Relative condition depends on how the problem responds to input perturbations, not the implementation method alone.",
 "using LinearAlgebra\nfor delta in (1e-2,1e-6,1e-10)\n    A=[1.0 0;0 delta]\n    b=[1.0,1.0]\n    db=[0.0,delta]\n    x=A\\b\n    y=A\\(b+db)\n    println((delta=delta,cond=cond(A),change=norm(y-x),residual=norm(A*y-(b+db))))\nend",
 ["Check the solution difference separately from the residual.","Compare perturbation magnitudes across three diagonal scales.","Distinguish a backward-stable algorithm from a well-conditioned problem.","Explain why explicitly computing inv(A)*b is not the standard preferred solve."],
 "Can the computed residual be near zero while the true solution changes substantially?",
 "AMP conditioning and linear systems scope")
});
export function completionTracksForLesson(id){return Object.values(COMPLETION_TRACKS).filter(t=>t.lesson===id);}
export function completionTrack(id){return Object.hasOwn(COMPLETION_TRACKS,id)?COMPLETION_TRACKS[id]:null;}
export function buildCompletionTests(id,source){
 const t=completionTrack(id);
 if(!t||typeof source!=="string"||!source.trim()||new TextEncoder().encode(source).length>50000)
   throw new RangeError("Choose a depth track and provide the current Julia draft (up to 50 KB).");
 if(t.checks.length===0)throw new RangeError("This exploration has no automatic Julia Test contract.");
 return {filename:"amp-depth-"+id+"-tests.jl",mime:"text/plain;charset=utf-8",
 content:"using Test\n\n"+source+"\n\n@testset "+JSON.stringify(t.title)+" begin\n"+
 t.checks.map(c=>"    @testset "+JSON.stringify(c.name)+" begin\n        "+c.assertion+"\n    end").join("\n")+"\nend\n"};
}
