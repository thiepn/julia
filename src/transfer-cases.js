// Original independent Julia transfer prompts inspired by canonical AMP lesson goals; no official UE01 solutions.
export const transferCases = Object.freeze({
  "01": Object.freeze({
    a: Object.freeze({id:"01-a",title:"Circle",task:"For r=3.0 print circumference and area of a circle on separate lines. Compute both, do not hardcode.",starter:"r = 3.0\n# Calculate circumference and area.\n",checks:"≈18.84956 and ≈28.27433.",plan:"Use 2πr and π*r^2.",verify:"For r=0 both results are 0."}),
    b: Object.freeze({id:"01-b",title:"Temperature",task:"Convert Celsius entries [0,20,100] to Fahrenheit with a loop; print each result.",starter:"temperatures = [0,20,100]\n# Convert each entry.\n",checks:"32, 68, 212.",plan:"Apply F = 9C/5 + 32 to each entry rather than hardcoding results.",verify:"-40 Celsius → -40 Fahrenheit."}),
  }),
  "02": Object.freeze({
    a: Object.freeze({id:"02-a",title:"Changing indices",task:"Use v=[10,20,30,40] to print last(v)-first(v). Keep code valid if a value is appended.",starter:"v = [10,20,30,40]\n# Use first/last, not fixed indices.\n",checks:"30 initially.",plan:"Julia indexing starts at 1; first and last express intent.",verify:"After appending 50, the result is 40."}),
    b: Object.freeze({id:"02-b",title:"Reverse a copy",task:"Create v=[5,8,13,21], print a reversed copy and prove v itself did not change.",starter:"v = [5,8,13,21]\n# Preserve v.\n",checks:"Original [5,8,13,21]; reverse [21,13,8,5].",plan:"Compare reverse(v) with mutating reverse!(v).",verify:"For [1], reverse is [1]."}),
  }),
  "03": Object.freeze({
    a: Object.freeze({id:"03-a",title:"Broadcast squares",task:"Build [-2,-1,0,1,2] and print elementwise squares in a vector.",starter:"xs = [-2,-1,0,1,2]\n# Broadcast exponentiation.\n",checks:"[4,1,0,1,4].",plan:"Use Julia's dot broadcast for elementwise exponentiation.",verify:"For [0,3], output [0,9]."}),
    b: Object.freeze({id:"03-b",title:"Affine mapping",task:"Evaluate f(x)=3x-1 at [0,0.5,1] without a manual loop or hardcoded vector.",starter:"xs = [0.0,0.5,1.0]\n# Apply the rule elementwise.\n",checks:"[-1,0.5,2].",plan:"Broadcast arithmetic or a function.",verify:"At x=-1 the value is -4."}),
  }),
  "04": Object.freeze({
    a: Object.freeze({id:"04-a",title:"Sine-cosine graph",task:"Plot sin(x) and cos(x) at 41 shared samples from 0 to 2π with labels.",starter:"using Plots\nxs = range(0,2π; length=41)\n# Plot both curves.\n",checks:"Both curves have 41 matching x-values.",plan:"Use broadcasting with the shared xs.",verify:"sin(0)≈0 and cos(0)≈1; include legend."}),
    b: Object.freeze({id:"04-b",title:"Absolute value plot",task:"On shared axes plot y=x and y=abs(x), at 51 points from -3 to 3.",starter:"using Plots\nxs = range(-3,3; length=51)\n",checks:"Both curves meet at 0; |x| stays nonnegative.",plan:"Use abs.(xs) for elementwise absolute values.",verify:"At x=-3 the paired values are -3 and 3."}),
  }),
  "05": Object.freeze({
    a: Object.freeze({id:"05-a",title:"Three norms",task:"Print the 1-, 2- and infinity-norms for v=[3,4] using LinearAlgebra.",starter:"using LinearAlgebra\nv = [3.0,4.0]\n",checks:"7, 5, 4.",plan:"Use norm(v,1), norm(v,2), norm(v,Inf).",verify:"For a zero vector all are zero."}),
    b: Object.freeze({id:"05-b",title:"Radius-three circle",task:"Generate 101 points on a radius-three circle and plot with equal aspect ratio.",starter:"using Plots\nθ = range(0,2π; length=101)\n",checks:"First point approximately (3,0); closed circle.",plan:"Broadcast 3cos(θ) and 3sin(θ).",verify:"Use aspect_ratio=:equal."}),
  }),
  "06": Object.freeze({
    a: Object.freeze({id:"06-a",title:"Shear matrix",task:"Compute A*x for A=[1 1;0 1], x=[1,2]. Print the resulting vector.",starter:"A = [1 1;0 1]\nx = [1,2]\n",checks:"[3,2].",plan:"Matrix product is A*x, not A.*x.",verify:"For x=[0,1], result [1,1]."}),
    b: Object.freeze({id:"06-b",title:"Quarter turn",task:"Rotate x=[2,1] using A=[0 -1;1 0] and compare Euclidean norms.",starter:"using LinearAlgebra\nA = [0 -1;1 0]\nx = [2,1]\n",checks:"Rotated vector [-1,2], both norms √5.",plan:"Use norm(A*x) and norm(x).",verify:"[1,0] maps to [0,1]."}),
  }),
  "07": Object.freeze({
    a: Object.freeze({id:"07-a",title:"Even counter",task:"Count even numbers in [1,2,4,7,8] with a conditional loop.",starter:"xs = [1,2,4,7,8]\ncount=0\n",checks:"Count of even entries is 3.",plan:"Test iseven(x) within the loop.",verify:"[1,3,5] and Int[] both yield 0."}),
    b: Object.freeze({id:"07-b",title:"Negative sum",task:"Loop over [-2,3,-4,1] and sum only strictly negative entries.",starter:"xs = [-2,3,-4,1]\ntotal=0\n",checks:"Sum of the negative entries is -6.",plan:"Place the accumulation inside if x<0.",verify:"For [2,4], result 0."}),
  }),
  "08": Object.freeze({
    a: Object.freeze({id:"08-a",title:"Threshold function",task:"Implement count_above(v,t) for values strictly greater than t.",starter:"function count_above(v,t)\n    # Count values > t.\nend\n",checks:"count_above([1,4,6],3) = 2.",plan:"Initialize the counter inside the function.",verify:"For Int[], result 0; for t=6, result 0."}),
    b: Object.freeze({id:"08-b",title:"Product function",task:"Implement product_or_one(v) for numeric vectors with an empty-vector identity.",starter:"function product_or_one(v)\n    # Multiply values.\nend\n",checks:"[2,3,4] → 24, empty vector → 1.",plan:"Initialize to 1, not 0.",verify:"[-2,3] → -6 and [0,5] → 0."}),
  }),
  "09": Object.freeze({
    a: Object.freeze({id:"09-a",title:"Approximate zero",task:"Implement approxzero(x,tol) returning abs(x)<=tol and test multiple tolerance values.",starter:"function approxzero(x,tol)\n    # Compare magnitude and tolerance.\nend\n",checks:"approxzero(1e-7,1e-6) true; for 1e-8 false.",plan:"Use absolute magnitude and <=.",verify:"approxzero(0,0) is true."}),
    b: Object.freeze({id:"09-b",title:"Relative comparison",task:"Implement abs(a-b)<=rtol*max(abs(a),abs(b)) for relative comparisons.",starter:"function near_relative(a,b,rtol)\n    # Compare relative difference.\nend\n",checks:"(100,101,0.02) true; (100,101,0.001) false.",plan:"Scale by the larger magnitude.",verify:"For a=b=0 the condition is true; discuss absolute tolerances."}),
  }),
  "10": Object.freeze({
    a: Object.freeze({id:"10-a",title:"Numerical limit samples",task:"Print n*exp(-n) for n=5,10,20; compare without claiming a proof.",starter:"ns=[5,10,20]\n# Print one evaluation per n.\n",checks:"≈0.0336897, 0.000454, 4.1223e-8.",plan:"Use exp(-n) and numerical evaluation.",verify:"Only these sample n are tested, not a limit theorem."}),
    b: Object.freeze({id:"10-b",title:"Reciprocal decay",task:"Broadcast reciprocal values for n=[10,100,1000]; then add 10000.",starter:"ns=[10,100,1000]\n",checks:"0.1, 0.01, 0.001; at 10000 get 0.0001.",plan:"Use elementwise division: 1.0 ./ ns.",verify:"Finite samples are not a proof about every n."}),
  }),
  "11": Object.freeze({
    a: Object.freeze({id:"11-a",title:"Basis vector column",task:"For A=[1 2;3 4], compute A*[1,0], and explain the result.",starter:"A=[1 2;3 4]\ne1=[1,0]\n",checks:"[1,3], the first column.",plan:"Multiplying by a basis vector selects a column.",verify:"A*[0,1] → [2,4]."}),
    b: Object.freeze({id:"11-b",title:"Signed dot product",task:"Use LinearAlgebra.dot for [1,2,3] with [-1,0,1] and print the computed result.",starter:"using LinearAlgebra\na=[1,2,3]\nb=[-1,0,1]\n",checks:"The signed dot product equals 2.",plan:"dot(a,b) requires matching lengths.",verify:"dot([1,0],[0,1])=0."}),
  }),
  "12": Object.freeze({
    a: Object.freeze({id:"12-a",title:"Diagonal solve",task:"Solve A=[3 0;0 2], b=[9,8]; print solution and norm of residual.",starter:"using LinearAlgebra\nA=[3.0 0;0 2.0]\nb=[9.0,8.0]\n",checks:"x≈[3,4], residual≈0.",plan:"A\\b computes a solve; norm(A*x-b) checks residual.",verify:"For b=[12,8], x≈[4,4]."}),
    b: Object.freeze({id:"12-b",title:"Triangular solve",task:"Solve A=[1 1;0 2], b=[5,6], and verify the solution by multiplication.",starter:"using LinearAlgebra\nA=[1.0 1;0 2.0]\nb=[5.0,6.0]\n",checks:"x≈[2,3] and A*x≈b.",plan:"Keep the solution vector as computed, not hardcoded.",verify:"For b=[4,6], x≈[1,3]."}),
  }),
  "13": Object.freeze({
    a: Object.freeze({id:"13-a",title:"Backward substitution",task:"Write backward_substitution(U,b) for U=[2 1;0 3], b=[7,9].",starter:"function backward_substitution(U,b)\n    # Solve from last row upwards.\nend\n",checks:"x≈[2,3], small residual.",plan:"Solve the bottom row before the top.",verify:"For identity U, x=b."}),
    b: Object.freeze({id:"13-b",title:"New forward solve",task:"Write forward_substitution(L,b) for L=[1 0;2 4], b=[3,14].",starter:"function forward_substitution(L,b)\n    # Solve first row downwards.\nend\n",checks:"x≈[3,2].",plan:"x₁=b₁/L₁₁, then subtract L₂₁*x₁.",verify:"For diagonal L=[2 0;0 5], b=[4,15], x=[2,3]."}),
  }),
  "14": Object.freeze({
    a: Object.freeze({id:"14-a",title:"QR verification",task:"Factor B=[1 0;0 2] with qr, build Q and R, and print ||B-QR||₂.",starter:"using LinearAlgebra\nB=[1.0 0;0 2.0]\n",checks:"Reconstruction norm≈0.",plan:"Matrix(qr(B).Q) makes an explicit Q.",verify:"Inspect norm(Q'*Q-I) too."}),
    b: Object.freeze({id:"14-b",title:"New Cholesky factor",task:"Factor B=[9 3;3 5] with Cholesky, print L and reconstruction error.",starter:"using LinearAlgebra\nB=[9.0 3.0;3.0 5.0]\n",checks:"L≈[3 0;1 2], reconstruction error≈0.",plan:"Use cholesky(B).L.",verify:"Check B is symmetric positive definite."}),
  }),
  "15": Object.freeze({
    a: Object.freeze({id:"15-a",title:"New exact-fit line",task:"Fit t=[0,1,2,3], y=[2,5,8,11] with a two-column design matrix.",starter:"using LinearAlgebra\nt=[0.0,1,2,3]\ny=[2.0,5,8,11]\n",checks:"intercept≈2, slope≈3, residual≈0.",plan:"Construct hcat(ones(length(t)),t) then use \\ .",verify:"For t=[0,1], y=[2,5], same coefficients."}),
    b: Object.freeze({id:"15-b",title:"Constant observations",task:"Fit t=[0,1,2], y=[4,4,4] by least squares and show residual.",starter:"using LinearAlgebra\nt=[0.0,1,2]\ny=[4.0,4,4]\n",checks:"intercept≈4, slope≈0, residual≈0.",plan:"Use the same design matrix as the original lesson.",verify:"Change y to all 7 → intercept≈7, slope≈0."}),
  }),
  "16": Object.freeze({
    a: Object.freeze({id:"16-a",title:"New conditioning scale",task:"Compare A=diag(1,1e-4), b=[1,1], δb=[0,1e-4] with two solves.",starter:"using LinearAlgebra\nA=[1.0 0;0 1e-4]\nb=[1.0,1.0]\ndb=[0.0,1e-4]\n",checks:"Absolute solution change≈1.",plan:"Solve before and after perturbing b.",verify:"For identity A and same db, change≈1e-4."}),
    b: Object.freeze({id:"16-b",title:"Stable-direction perturbation",task:"For A=diag(1,1e-6), b=[1,2], compare δb=[1e-4,0] with δb=[0,1e-4].",starter:"using LinearAlgebra\nA=[1.0 0;0 1e-6]\nb=[1.0,2.0]\n",checks:"First change≈1e-4; second change≈100.",plan:"Direction matters; compare perturbations with equal norm.",verify:"Compute ||x_after-x_before||₂ for each direction."}),
  }),
});
export function transferForLesson(lesson,variant){
  if(typeof lesson!=="string"||!Object.hasOwn(transferCases,lesson)||!["a","b"].includes(variant))return null;
  return transferCases[lesson][variant];
}
