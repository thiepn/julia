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
 repair_dimensions:T("repair_dimensions","02","Repair a matrix dimension bug",
 "A per-column result has length size(A,2). The faulty program allocates by row count, so square inputs can disguise the error. Inspect size(A) and both rectangular orientations.",
 "function column_totals(A)\n    totals = zeros(size(A,1)) # Wrong: output length is column count.\n    for j in axes(A,2)\n        totals[j] = sum(A[:,j])\n    end\n    return totals\nend",
 ["Run the faulty code with a 2×3 matrix; locate the bounds failure.","Predict the output length for a 3×2 input.","Repair allocation/indexing without hard-coding the input size.","Test a single-row and a wide zero matrix."],
 "Why is using a 2×2 matrix alone a weak test of a per-column function?",
 "Original practice from Julia Arrays and AMP matrix dimensions",[
 ["wide matrix","@test column_totals([1 2 3;4 5 6]) == [5,7,9]"],
 ["tall matrix","@test column_totals([2 3;0 1;4 5]) == [6,9]"],
 ["single row","@test column_totals(reshape([1.,-3.],1,2)) ≈ [1.,-3.]"],
 ["zero columns data","@test column_totals(zeros(2,4)) == zeros(4)"]
 ]),
 repair_scope:T("repair_scope","07","Repair an uninitialized local accumulator",
 "An assignment inside a Julia function creates a local variable. Reading it before initialization raises UndefVarError. Test empty/negative/zero inputs as well as positive ones.",
 "function positive_count(values)\n    for x in values\n        if x > 0\n            total += 1 # BUG: total has not been initialized.\n        end\n    end\n    return total\nend",
 ["Trace whether total has a value before the first loop iteration.","Run the broken function with empty and positive inputs.","Initialize local state in the correct scope.","Check strictly positive means zero must not be counted."],
 "Why do empty inputs reveal a different failure path from a vector containing positive numbers?",
 "Original practice from Julia Scope and AMP loops",[
 ["mixed values","@test positive_count([-2,0,3,5]) == 2"],
 ["empty vector","@test positive_count(Int[]) == 0"],
 ["zero boundary","@test positive_count([0,0,0]) == 0"],
 ["all positive","@test positive_count([1,4,7]) == 3"]
 ]),
 repair_types:T("repair_types","08","Repair an InexactError in numeric arrays",
 "zeros(Int,n) cannot store a non-integral Float64. A generic numeric algorithm must not silently narrow fractional inputs to integers. Avoid mutating the source matrix.",
 "function row_energy(A)\n    result = zeros(Int, size(A,1)) # BUG: Float64 results may not fit.\n    for i in axes(A,1)\n        result[i] = sum(abs2, A[i,:])\n    end\n    return result\nend",
 ["Test a row containing 0.5 and inspect the Julia InexactError.","Locate the forced Int allocation, not just the assignment line.","Repair the output element type without assuming a square matrix.","Check an integer matrix, a Float64 matrix and a zero matrix."],
 "Why can an implementation pass only-integer tests and still be incorrect for general numeric matrices?",
 "Original practice from Julia Numeric Types and AMP matrix arithmetic",[
 ["fractional input","@test row_energy([0.5 1.5;2.0 -1.0]) ≈ [2.5,5.0]"],
 ["integer input","@test row_energy([3 4;1 2]) ≈ [25.,5.]"],
 ["rectangular","@test row_energy([1. 2. 3.; 4. 5. 6.]) ≈ [14.,77.]"],
 ["zero matrix","@test row_energy(zeros(3,2)) == zeros(3)"]
 ]),
 squared_bound:T("squared_bound","09","Prove and implement a first-order error bound",
 "For f(x)=x² and perturbation δ, |f(x+δ)-f(x)| ≤ 2|x||δ|+δ² exactly. The linear term is first order; δ² is the remainder. Code the bound itself, then use other data to test it.",
 "function square_error_bound(x, delta)\n    # Return a nonnegative upper bound for |(x+delta)^2 - x^2|.\nend",
 ["Expand (x+δ)²-x² symbolically before programming.","Apply the triangle inequality to the expansion.","Check x=0, negative δ and changing input scales.","Distinguish a numerical test of an inequality from its proof."],
 "Can a first-order 2|x||δ| term alone be a rigorous bound for every finite δ?",
 "Original AMP error analysis and Taylor remainder transfer",[
 ["positive x","@test square_error_bound(3.0,1e-3) ≈ 0.006001"],
 ["negative x","@test square_error_bound(-2.0,0.5) ≈ 2.25"],
 ["zero center","@test square_error_bound(0.0,0.1) ≈ 0.01"],
 ["negative step","@test square_error_bound(1.0,-0.25) ≈ 0.5625"]
 ]),
 vector_amplification:T("vector_amplification","16","Vector perturbations and normwise sensitivity",
 "For a nonsingular matrix A, the relative input-output amplification of x↦Ax for a finite perturbation δx is (||A(x+δx)-Ax||/||Ax||)/(||δx||/||x||). Compare directions and check it against cond(A). Assume nonzero x, Ax and δx.",
 "using LinearAlgebra\nfunction vector_amplification(A, x, delta_x)\n    # Return the relative output change divided by the relative input change.\nend",
 ["Separate ||δx||/||x|| from ||Aδx||/||Ax||.","Evaluate two equal-size perturbations in different directions.","Derive an upper bound involving ||A|| and ||A^(-1)||.","Test identity, diagonal and non-diagonal invertible matrices."],
 "Why does one measured finite amplification not equal the worst-case cond(A) in general?",
 "Original transfer after AMP Übung 2 2.1 and linear systems",[
 ["identity","@test isapprox(vector_amplification(Matrix{Float64}(I,2,2),[1.,2.],[1e-3,0.]),1.0;atol=1e-11)"],
 ["first diagonal direction","@test isapprox(vector_amplification([2. 0.;0. 1.],[1.,1.],[1e-3,0.]),2sqrt(2)/sqrt(5);rtol=1e-10)"],
 ["second diagonal direction","@test isapprox(vector_amplification([2. 0.;0. 1.],[1.,1.],[0.,1e-3]),sqrt(2)/sqrt(5);rtol=1e-10)"],
 ["normwise bound","@test begin A=[2. 1.;0. 0.5];x=[1.,2.];d=[1e-3,-1e-3]; vector_amplification(A,x,d) <= cond(A)*(1+1e-8) end"]
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
