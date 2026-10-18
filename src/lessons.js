// AMP Julia Lab — original practice prompts, not solutions to university homework.
// Source map: AMP VL01 (14 Oct 2026), UE01 (due 22 Oct 2026),
// Kalicharan, Julia – Bit by Bit (2021), plus Julia/Plots/LinearAlgebra references.
export const lessons = [
  {
    id:"01", stage:"Übung 1 essentials", title:"Variables & numbers", minutes:8, source:"Kalicharan ch. 1–2", prereq:"None",
    goal:"Calculate and print numeric expressions.", theory:"Use = to assign, ^ to exponentiate, and println() to print. Julia evaluates assignments in order.",
    example:"a = 5\nb = 3\nprintln(a + b)",
    questions:[
      {q:"What does a = 6; println(a + 3) print?",choices:["3","6","9","18"],correct:2,hint:"Evaluate the addition after assigning a."},
      {q:"What is 6 / 4 in Julia?",choices:["1","1.5","2","Error"],correct:1,hint:"/ performs ordinary division."},
      {q:"After x = 2; x = x * 3, what is x?",choices:["2","3","5","6"],correct:3,hint:"The second assignment updates the stored value."}
    ],
    challenge:"Write code that prints the perimeter and area of a square with side length 7, on separate lines.",
    starter:"side = 7\n# Calculate and print the perimeter and area.\n", expected:"28\n49",
    checks:"Output exactly 28 then 49 on separate lines. Run Julia to confirm.",
    hints:["A square has four equal sides.","Area is side length squared.","Store both results, then use println twice."]
  },
  {
    id:"02",stage:"Übung 1 essentials",title:"Vectors & indexing",minutes:10,source:"Kalicharan ch. 7",prereq:"01",
    goal:"Build vectors and retrieve elements safely.",theory:"A vector uses [1, 2, 3]. Julia indexing starts at 1, not 0. length(v) counts elements; v[end] is the final element.",
    example:"v = [10, 20, 30]\nprintln(v[2])",
    questions:[
      {q:"What is [4, 8, 12][1]?",choices:["0","4","8","12"],correct:1,hint:"Look at the first element."},
      {q:"What is length([2, 4, 6, 8])?",choices:["2","4","6","8"],correct:1,hint:"Count the entries."},
      {q:"What is [5, 7, 9][end]?",choices:["5","7","9","Error"],correct:2,hint:"end selects the last position."}
    ],
    challenge:"Create [3, 5, 7, 9] and print the sum of its second and last entries.",
    starter:"v = [3, 5, 7, 9]\n# Index the two entries and print their sum.\n",expected:"14",
    checks:"Output 14. Do not replace the vector with a hard-coded result.",
    hints:["Remember the second index is 2.","Use v[end] for the final element.","Add the two indexed values before printing."]
  },
  {
    id:"03",stage:"Übung 1 essentials",title:"Ranges & broadcasting",minutes:12,source:"Julia manual: arrays and broadcasting",prereq:"02",
    goal:"Calculate a formula at many sample points.",theory:"collect(2:2:8) gives [2,4,6,8]. range(a,b;length=n) generates n samples. Dots apply operations elementwise: x .^ 2 and cos.(x).",
    example:"x = [-2, -1, 0, 1, 2]\ny = x .^ 2\nprintln(y)",
    questions:[
      {q:"What is collect(2:2:8)?",choices:["[2, 4, 6, 8]","[2, 3, 4, 5, 6, 7, 8]","[2, 8]","[2, 2, 8]"],correct:0,hint:"The middle number controls the step."},
      {q:"What is [1, 2, 3] .^ 2?",choices:["[2, 4, 6]","[1, 2, 3]","[1, 4, 9]","Error"],correct:2,hint:"The dot distributes the power over the elements."},
      {q:"What does collect(range(0, 1; length=3)) return?",choices:["[0, 1, 2]","[0.0, 0.5, 1.0]","[0, 1, 3]","[0, 0, 1]"],correct:1,hint:"Three evenly spaced values include endpoints."}
    ],
    challenge:"Create five equally spaced values from -1 to 1; print their cubes as a vector.",
    starter:"x = collect(range(-1, 1; length=5))\n# Broadcast cubing over all entries.\n",expected:"[-1.0, -0.125, 0.0, 0.125, 1.0]",
    checks:"Five outputs with endpoints -1,1, midpoint 0, and inner values ±0.125.",
    hints:["Create a vector of five sample points.","Use .^ instead of ^ for elementwise powers.","Print the complete result vector."]
  },
  {
    id:"04",stage:"Übung 1 essentials",title:"Plot mathematical functions",minutes:15,source:"UE01 1.2; Plots.jl tutorial",prereq:"03",
    goal:"Produce a graph with correctly paired coordinates.",theory:"Install Plots locally with ] add Plots; then use using Plots and plot(x,y). plot! adds another series. aspect_ratio=:equal prevents shape distortion.",
    example:"using Plots\nx = collect(range(-2, 2; length=101))\ny = x .^ 2\nplot(x, y; label=\"square\")",
    questions:[
      {q:"What is plot! used for?",choices:["Save a file","Add series to a plot","Remove grid lines","Install Plots"],correct:1,hint:"The mutating form modifies the current plot."},
      {q:"Why set aspect_ratio=:equal for geometry?",choices:["Make axes same color","Use equal coordinate scale","Plot only integers","Convert to degrees"],correct:1,hint:"Consider a circle stretched by unequal axis scaling."},
      {q:"Can you plot x and y coordinate vectors of unequal lengths point by point?",choices:["Always","Only if integers","No","Only with plot!"],correct:2,hint:"Each point needs one x and one y value."}
    ],
    challenge:"Graph y=x and y=x² on the same axes for 101 values between -2 and 2.",
    starter:"using Plots\nx = collect(range(-2, 2; length=101))\n# Create y-values and plot both curves.\n",expected:null,
    checks:"Visual review: both curves, 101 matching x coordinates, axes labels and a legend. Plot output may not display in the hosted embed.",
    hints:["Make two vectors of y-values from the same x-vector.","Start with plot(x, y1).","Add the other with plot! and label the axes."]
  },
  {
    id:"05",stage:"Übung 1 essentials",title:"Norms & geometry",minutes:18,source:"UE01 1.2(a–c)",prereq:"04",
    goal:"Relate numeric norms to the shapes of level sets.",theory:"For (a,b), 1-norm is abs(a)+abs(b), 2-norm is sqrt(a²+b²), and infinity-norm is max(abs(a),abs(b)). A norm level set has fixed norm.",
    example:"using LinearAlgebra\nv = [3.0, 4.0]\nprintln(norm(v))",
    questions:[
      {q:"What is the 2-norm of (3,4)?",choices:["4","5","7","12"],correct:1,hint:"Use the Pythagorean relationship."},
      {q:"What is the infinity-norm of (-2,5)?",choices:["2","3","5","7"],correct:2,hint:"Take the largest absolute component."},
      {q:"What is the 1-norm of (-2,5)?",choices:["3","5","7","10"],correct:2,hint:"Add absolute component values."}
    ],
    challenge:"Plot the Euclidean level set with radius 2 in 2D. Do not plot the submitted three norm-unit boundaries for the learner.",
    starter:"using Plots\n# Create a circle of radius 2 using angle samples.\n",expected:null,
    checks:"Visual review: closed curve, radius approximately 2, equal axis scaling.",
    hints:["Use an angle parameter from 0 to 2π.","Compute cos and sin elementwise.","Multiply both coordinate vectors by the radius."]
  },
  {
    id:"06",stage:"Übung 1 essentials",title:"Matrices & transformations",minutes:18,source:"UE01 1.2(c–d)",prereq:"05",
    goal:"Apply a matrix to points and visualize transformed coordinates.",theory:"Matrices use [a b; c d]. A*v is matrix-vector multiplication; A.*B is elementwise multiplication. A norm defined as ||x||_M = ||M*x|| has a different unit boundary from the direct image M(circle).",
    example:"A = [2 0; 0 3]\nv = [1, 2]\nprintln(A * v)",
    questions:[
      {q:"What is [2 1; 0 3] * [1, 0]?",choices:["[2, 0]","[1, 3]","[2, 3]","[0, 2]"],correct:0,hint:"Multiply each row by the vector."},
      {q:"What is [2 1; 0 3] * [0, 1]?",choices:["[0, 1]","[2, 0]","[1, 3]","[3, 1]"],correct:2,hint:"You are selecting the second column."},
      {q:"What is det([2 0; 0 3])?",choices:["0","2","5","6"],correct:3,hint:"Use the product of the diagonal entries."}
    ],
    challenge:"Apply A = diag(2,3) to four cardinal points (±1,0),(0,±1) and print the transformed point matrix.",
    starter:"A = [2 0; 0 3]\npoints = [1 0 -1 0; 0 1 0 -1]\n# Multiply A by points, then print.\n",expected:"[2 0 -2 0; 0 3 0 -3]",
    checks:"Compare all four columns with A*points. For UE01 1.2(d), clarify direct image versus M-norm level set with your tutor.",
    hints:["Store each point as a column.","Matrix-matrix multiplication can apply A to every column.","Print A * points."]
  },
  {
    id:"07",stage:"Programming fluency",title:"Conditions & loops",minutes:15,source:"Kalicharan ch. 3–4",prereq:"03",
    goal:"Write repetitive and conditional computations.",theory:"if/else/end controls branches; for i in 1:n iterates over a range; while repeats while a condition holds.",
    example:"count = 0\nfor x in [-1, 0, 4]\n    if x > 0\n        count += 1\n    end\nend\nprintln(count)",
    questions:[
      {q:"What is the sum of 1+2+3+4?",choices:["4","8","10","16"],correct:2,hint:"Add each term once."},
      {q:"Does 3 >= 3 evaluate to true?",choices:["Yes","No","Error","Only in a loop"],correct:0,hint:"The comparison includes equality."},
      {q:"How many values in [-1,0,4] are strictly positive?",choices:["0","1","2","3"],correct:1,hint:"Zero is not positive."}
    ],
    challenge:"Write a loop that counts the positive values in [-2,3,0,5] and prints the count.",
    starter:"v = [-2, 3, 0, 5]\ncount = 0\n# Write your for/if loop.\n",expected:"2",
    checks:"Output 2. Later vary the vector to include no positive numbers.",
    hints:["Iterate over every entry.","Check each number with > 0.","Increase the counter only when the condition holds."]
  },
  {
    id:"08",stage:"Programming fluency",title:"Functions & algorithms",minutes:15,source:"Kalicharan ch. 5",prereq:"07",
    goal:"Write reusable mathematical functions.",theory:"f(x)=x^2 is a short function; function f(x) ... end is multi-line. Return values can be reused by other calculations.",
    example:"function square_sum(v)\n    return sum(v .^ 2)\nend\nprintln(square_sum([1, 2, 3]))",
    questions:[
      {q:"If f(x)=x^2, what is f(-3)?",choices:["-9","-6","3","9"],correct:3,hint:"A negative number squared is nonnegative."},
      {q:"If g(a,b)=a+b, what is g(2,5)?",choices:["2","5","7","10"],correct:2,hint:"The values are positional arguments."},
      {q:"What does f(x)=x+1; println(f(2)) print?",choices:["1","2","3","4"],correct:2,hint:"Evaluate the function call."}
    ],
    challenge:"Implement sum_of_squares(v) and demonstrate with [1,2,3].",
    starter:"function sum_of_squares(v)\n    # Return the sum of squared entries.\nend\nprintln(sum_of_squares([1, 2, 3]))",
    expected:"14",checks:"Output 14, and verify independently on [-2,2] → 8 and an empty numeric vector → 0.",
    hints:["Decide between a loop and broadcasting.","Square every entry before summing.","Return the computed value."]
  },
  {
    id:"09",stage:"Programming fluency",title:"Floating-point numbers",minutes:20,source:"Kalicharan ch. 2; AMP VL01",prereq:"08",
    goal:"Recognize numerical rounding and use tolerances.",theory:"Float64 is a finite binary approximation. Equality on computed real values is often inappropriate; compare with abs(a-b) <= tolerance or isapprox.",
    example:"println(0.1 + 0.2 == 0.3)\nprintln(isapprox(0.1 + 0.2, 0.3))",
    questions:[
      {q:"What is typeof(2.0) on a normal Julia installation?",choices:["Int64","Float64","Bool","String"],correct:1,hint:"The decimal point changes the numeric type."},
      {q:"In Float64, does 0.1 + 0.2 == 0.3 evaluate true?",choices:["Yes","No","Error","Always"],correct:1,hint:"Binary floating point cannot exactly encode many decimals."},
      {q:"Does isapprox(0.1 + 0.2, 0.3) normally return true?",choices:["Yes","No","Only for integers","Error"],correct:0,hint:"Think in terms of tolerance."}
    ],
    challenge:"Implement isclose(a,b,tol), returning whether abs(a-b) <= tol; print the result for 0.1+0.2, 0.3, 1e-12.",
    starter:"function isclose(a, b, tol)\n    # Write an absolute-tolerance comparison.\nend\nprintln(isclose(0.1 + 0.2, 0.3, 1e-12))",expected:"true",
    checks:"Output true; additionally require isclose(1,1.1,1e-3)==false and isclose(0,0,0)==true.",
    hints:["Use abs on the difference.","Compare this to a nonnegative tolerance.","Return a Bool rather than a formatted string."]
  },
  {
    id:"10",stage:"Programming fluency",title:"Limits & convergence",minutes:20,source:"AMP VL01 Landau symbols; UE01 1.3",prereq:"09",
    goal:"Explore asymptotic behavior without mistaking samples for proofs.",theory:"f=o(g) means f/g tends to zero (where defined). f=O(g) means their ratio is eventually bounded. Numerical samples illustrate but cannot prove a limit.",
    example:"for n in (5, 10, 20)\n    println(n^2 / exp(n))\nend",
    questions:[
      {q:"As x→∞, is x² = o(x³)?",choices:["Yes","No","Only for integers","Undefined"],correct:0,hint:"Examine their ratio as x grows."},
      {q:"What is lim sin(x)/x as x→0?",choices:["0","1","∞","-1"],correct:1,hint:"Recall the standard trigonometric limit."},
      {q:"As x→∞, what happens to x²/exp(x)?",choices:["Approaches 0","Approaches 1","Diverges","Oscillates"],correct:0,hint:"Exponential growth eventually dominates a polynomial."}
    ],
    challenge:"Print n^2/exp(n) for n=5,10,20, one value per line.",
    starter:"for n in [5, 10, 20]\n    # Print the ratio for this n.\nend",
    expected:null,checks:"Three positive, strictly decreasing numbers; last ≈ 8.2446145e-7. This does not prove the limit.",
    hints:["Use exp(n).","Use n^2 / exp(n).","Run the loop across all three inputs."]
  },
  {
    id:"11",stage:"Numerical AMP",title:"Linear algebra in Julia",minutes:20,source:"AMP VL01; LinearAlgebra stdlib",prereq:"06,08",
    goal:"Operate on matrices, dot products, norms and dimensions.",theory:"using LinearAlgebra adds dot and norm. A*x multiplies matrices and vectors, subject to shape compatibility. size(A) returns (rows, columns).",
    example:"using LinearAlgebra\nprintln(dot([1, 2], [3, 4]))\nprintln(norm([3, 4]))",
    questions:[
      {q:"What is dot([1,2], [3,4])?",choices:["5","7","11","21"],correct:2,hint:"Multiply matching components and sum."},
      {q:"What is norm([0,3,4])?",choices:["4","5","7","12"],correct:1,hint:"Use the default Euclidean norm."},
      {q:"What is size([1 2 3; 4 5 6])?",choices:["(3,2)","(2,3)","(6,)","(2,2)"],correct:1,hint:"Count rows before columns."}
    ],
    challenge:"Multiply A=[1 2; 3 4] by x=[2,1] and print the resulting vector.",
    starter:"A = [1 2; 3 4]\nx = [2, 1]\n# Compute A*x and print.\n",expected:"[4, 10]",
    checks:"Output [4,10]. Verify that dimensions match; do not use elementwise .*.",
    hints:["A has two columns.","Multiply A by the two-element vector.","Print the resulting vector."]
  },
  {
    id:"12",stage:"Numerical AMP",title:"Solve linear systems",minutes:20,source:"AMP VL01: linear systems",prereq:"11",
    goal:"Use A\\b and calculate residuals.",theory:"A\\b solves Ax=b. The residual r=A*x-b checks the equation; a tiny residual alone does not guarantee small forward error.",
    example:"using LinearAlgebra\nA = [2.0 0.0; 0.0 4.0]\nb = [4.0, 8.0]\nx = A \\ b\nprintln(norm(A*x - b))",
    questions:[
      {q:"What does A \\ b compute for nonsingular square A?",choices:["A times b","An x solving Ax=b","Inverse of b","Componentwise A/b"],correct:1,hint:"It represents solving a linear system."},
      {q:"Solve diag(2,4)*x = [4,8].",choices:["[4,8]","[1,1]","[2,2]","[8,32]"],correct:2,hint:"Solve each diagonal equation."},
      {q:"What is the residual Ax-b of an exact solution?",choices:["x","b","A","Zero vector"],correct:3,hint:"Substitute Ax=b."}
    ],
    challenge:"Solve A=[2.0 0;0 4.0], b=[4.0,8.0], and print the residual norm.",
    starter:"using LinearAlgebra\nA = [2.0 0.0; 0.0 4.0]\nb = [4.0, 8.0]\n# Solve, compute residual, and print its norm.\n",
    expected:"0.0",checks:"Residual norm approximately 0, solution approximately [2,2].",
    hints:["Use the backslash operator for a system.","Compute A*x - b.","Pass that vector to norm."]
  },
  {
    id:"13",stage:"Numerical AMP",title:"Elimination & triangular systems",minutes:25,source:"AMP VL01: Gaussian elimination/LR",prereq:"07,12",
    goal:"Implement a mathematical algorithm using loops.",theory:"Gaussian elimination creates triangular systems; forward substitution solves lower-triangular systems. Pivoting helps with zero or tiny pivots.",
    example:"L = [1.0 0.0; 2.0 1.0]\nb = [3.0, 8.0]\nprintln(L \\ b)",
    questions:[
      {q:"What should an elimination algorithm consider if a pivot is zero?",choices:["Divide anyway","Swap rows if possible","Multiply everything by zero","Ignore the row"],correct:1,hint:"A nonzero pivot is necessary for division."},
      {q:"Which relation expresses pivoted LU with matching permutation convention?",choices:["A=L+U","P*A=L*U","A=L-U","P=L+U"],correct:1,hint:"Reconstruction must account for row permutations."},
      {q:"For L=[1 0;2 1] and b=[3,8], what is x?",choices:["[3,2]","[2,3]","[3,8]","[1,2]"],correct:0,hint:"Solve from the first row downwards."}
    ],
    challenge:"Implement forward_substitution(L,b) for L=[2.0 0.0; 1.0 3.0], b=[4.0,7.0]; print x.",
    starter:"function forward_substitution(L, b)\n    # Use a loop; do not call L \\ b here.\nend\nL = [2.0 0.0; 1.0 3.0]\nb = [4.0, 7.0]\nprintln(forward_substitution(L, b))",
    expected:"[2.0, 1.6666666666666667]",checks:"Solution approximately [2,5/3]; residual small; implementation uses row-by-row substitution.",
    hints:["The first row gives the first unknown.","Subtract the contributions of already-known entries.","Divide by the diagonal entry in each row."]
  },
  {
    id:"14",stage:"Numerical AMP",title:"QR & Cholesky",minutes:25,source:"AMP VL01 announced factorizations",prereq:"12,13",
    goal:"Compute and verify matrix factorizations.",theory:"QR gives A≈Q*R; Q has orthonormal columns. Cholesky applies to symmetric positive-definite matrices, giving A≈L*L'.",
    example:"using LinearAlgebra\nA = [4.0 2.0; 2.0 3.0]\nF = cholesky(A)\nprintln(norm(A - F.L * F.L'))",
    questions:[
      {q:"What identity holds for an orthogonal square Q?",choices:["Q'Q = I","Q'Q = 0","Q = 0","Q + Q' = I"],correct:0,hint:"Think about inner products of its columns."},
      {q:"Standard real Cholesky requires what matrix property?",choices:["Any square matrix","Symmetric positive-definite","Diagonal only","Singular only"],correct:1,hint:"Symmetry alone is not enough."},
      {q:"What checks a QR reconstruction?",choices:["norm(Q+R)","det(Q) only","norm(A-Q*R)","sum(A)"],correct:2,hint:"Compare A with its reconstructed product."}
    ],
    challenge:"For B=[4.0 2.0;2.0 3.0], compute Cholesky and print the reconstruction error norm.",
    starter:"using LinearAlgebra\nB = [4.0 2.0; 2.0 3.0]\n# Compute F=cholesky(B); reconstruct B from F.L.\n",expected:"0.0",
    checks:"Residual norm below 1e-10 (floating-point variations allowed).",
    hints:["Use cholesky(B).","The L factor is accessible on F.","Compute norm(B - L*L')."]
  },
  {
    id:"15",stage:"Numerical AMP",title:"Least-squares fitting",minutes:25,source:"AMP VL01 announced least squares",prereq:"12,14",
    goal:"Fit data by minimizing a squared residual.",theory:"Least squares minimizes ||Ax-b||₂²; for a straight line, use design matrix columns ones(n) and t. Backslash handles tall full-rank A.",
    example:"t = [0.0, 1.0, 2.0]\ny = [1.0, 3.0, 5.0]\nA = hcat(ones(length(t)), t)\nprintln(A \\ y)",
    questions:[
      {q:"What does linear least squares minimize?",choices:["max(abs(x))","Sum of squared residuals","Number of data points","det(A)"],correct:1,hint:"Residuals measure model-prediction differences."},
      {q:"What constant best fits [2,4,6] by least squares?",choices:["2","3","4","6"],correct:2,hint:"For constants, the average is optimal."},
      {q:"Which are the normal equations?",choices:["A*x = 0","A'A*x=A'b","A*A*x=b","A+x=b"],correct:1,hint:"Differentiate the squared residual."}
    ],
    challenge:"Fit y≈intercept+slope*t to t=[0,1,2], y=[1,3,5] and print both coefficients.",
    starter:"t = [0.0, 1.0, 2.0]\ny = [1.0, 3.0, 5.0]\n# Construct design matrix and solve for intercept and slope.\n",expected:"[1.0, 2.0]",
    checks:"Approximate coefficients [1,2], residual near zero. Also test a constant y vector.",
    hints:["First column is all ones.","Second column is t.","Solve the overdetermined system with backslash."]
  },
  {
    id:"16",stage:"Numerical AMP",title:"Conditioning capstone",minutes:30,source:"AMP VL01 condition and stability",prereq:"09,12,15",
    goal:"Compare sensitivity of two systems and explain the numerical difference.",theory:"Small changes in b may cause small or large changes in x depending on A. Distinguish conditioning of the problem from stability of a chosen algorithm.",
    example:"using LinearAlgebra\nA = Matrix{Float64}(I, 2, 2)\nb = [1.0, 2.0]\nprintln(norm((A \\ b) - b))",
    questions:[
      {q:"What does norm(A*x-b) measure?",choices:["Residual size","Condition number","Memory used","Number of iterations"],correct:0,hint:"Compare the solved equation to the observed right-hand side."},
      {q:"Can an ill-conditioned system have a tiny residual but a large forward error?",choices:["Yes","No","Only for integers","Never for square matrices"],correct:0,hint:"Residual and solution error are different measurements."},
      {q:"Which deliverables does AMP Übung 1 specify for Julia tasks?",choices:["Screenshots only",".jl plus PDF copies, ZIP","Only a Word document","Notebook URL only"],correct:1,hint:"The submission separates executable source and readable PDF."}
    ],
    challenge:"Compare two diagonal systems with A₁=I₂ and A₂=diag(1,1e-6), b=[1,2], delta_b=[0,1e-6]. Print the norm of each solution change.",
    starter:"using LinearAlgebra\nb = [1.0, 2.0]\ndelta_b = [0.0, 1e-6]\n# Construct both systems, solve before and after the perturbation.\n",
    expected:null,checks:"For A1, change norm ≈1e-6; for A2, ≈1. Explain why sensitivity differs.",
    hints:["Solve for b and b+delta_b.","Take the Euclidean norm of the difference.","Compare both matrices' scaling of the second coordinate."]
  }
];

export const stages = ["Übung 1 essentials","Programming fluency","Numerical AMP"];
