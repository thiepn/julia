// Original reasoning for each of the 48 AMP Julia concept questions.
// Entry shape: [explanation after correct choice, actionable retry after wrong choice].
// These are mathematical/programming explanations, never evidence of Julia execution.
export const feedbackByLesson = {
"01":[
["First assign a=6; then println evaluates 6+3.","Evaluate the assigned value before the printed expression."],
["The / operator performs ordinary division, not integer truncation.","Distinguish / from the integer division operator ÷."],
["The second assignment reads the previous x, multiplies it, then stores the result.","Evaluate assignments in sequence."]
],
"02":[
["Julia's first vector element uses index 1, not 0.","Julia starts indexing at 1."],
["length counts elements; it does not sum their values.","Count the entries inside the brackets."],
["Within indexing, end refers to the final index of that vector.","Use the vector's last position."]
],
"03":[
["The colon range start:step:stop adds the step repeatedly until it reaches the stop.","Read the second number as the step, not the endpoint."],
["The dot in .^ applies a power separately to every vector entry.","Look for the dotted exponentiation operator."],
["Three samples include both endpoints, leaving two equal half-unit gaps.","Calculate the distance between three evenly spaced points."]
],
"04":[
["plot! adds a series to the current plot, unlike creating an unrelated plot.","You want two curves in one graph."],
["Equal aspect ratio makes one coordinate unit the same visible length along both axes.","Think about preserving the shape of a circle."],
["Ordinary paired point plots need compatible x and y coordinate lengths.","Count x/y pairs; plot! does not fix unmatched coordinates."]
],
"05":[
["The Euclidean norm is sqrt(3²+4²).","Square both components, add, then take a square root."],
["The infinity-norm is the maximum of absolute coordinate values.","Take absolute values before choosing the largest."],
["The 1-norm is the sum of absolute coordinate values.","Sum |x|+|y| rather than taking the maximum."]
],
"06":[
["Multiplying by [1,0] selects the first column of the transformation matrix.","Multiply each row by the first basis vector."],
["Multiplying by [0,1] selects the second column of the transformation matrix.","Use the second basis vector this time."],
["For a diagonal matrix, the determinant is the product of diagonal entries.","Use multiplication of diagonal values, not addition."]
],
"07":[
["A loop summing 1 through 4 visits each integer once and accumulates the total.","Trace the loop's running sum from 1 to 4."],
["The >= operator includes equality, so 3 >= 3 is true.","Compare > with >=; only one includes the equality case."],
["Only 4 is strictly positive: neither -1 nor 0 is greater than zero.","Zero is not a positive number."]
],
"08":[
["The function squares the argument: (-3)^2 is positive.","Substitute -3 into x^2 with parentheses."],
["The two positional arguments are a=2 and b=5; the function adds them.","Match arguments to parameters before calculating."],
["f(2) returns 2+1, which println displays.","Evaluate the function call, then the print."]
],
"09":[
["Julia's 2.0 is ordinarily a Float64 decimal literal, despite representing a whole number.","Look at the written numeric type, not whether the value is mathematically whole."],
["Float64 binary approximations make 0.1+0.2 differ slightly from the stored 0.3.","== checks represented values, not ideal decimal arithmetic."],
["isapprox compares within tolerance; the small Float64 difference is accepted.","Distinguish approximate comparison from ==."]
],
"10":[
["The ratio x²/x³=1/x approaches zero for x→∞, satisfying little-o.","Form f/g and inspect its limit."],
["The standard sin(x)/x limit is 1, even though direct evaluation at 0 is undefined.","A limit differs from direct substitution."],
["The exponential exp(x) grows faster than the polynomial x².","Compare growth for large x, not only small inputs."]
],
"11":[
["The dot product is 1·3+2·4.","Multiply corresponding entries, then add."],
["The Euclidean norm is sqrt(0²+3²+4²).","Square components before taking the square root."],
["The matrix has two rows and three columns; size returns (rows,columns).","Semicolons separate rows in Julia matrix literals."]
],
"12":[
["The backslash operator finds an x solving Ax=b.","Backslash solves a system, unlike multiplication or elementwise division."],
["Solve diagonal equations independently: 2x₁=4 and 4x₂=8.","Divide each right-hand entry by its matching diagonal coefficient."],
["If Ax=b, then Ax-b equals the zero vector.","Substitute the defining equation into the residual."]
],
"13":[
["A zero pivot requires a suitable row swap where possible, avoiding division by zero.","Elimination needs a usable nonzero pivot."],
["Pivoted LR/LU includes a permutation: PA=LU with the matching convention.","Row swaps must appear in the matrix identity."],
["First x₁=3, then 2·3+x₂=8 yields x₂=2.","Forward substitution solves the top row first."]
],
"14":[
["Orthonormal columns give Q'Q=I.","Consider all pairwise inner products of the columns."],
["Standard real Cholesky needs a symmetric positive-definite matrix.","A merely square or singular matrix is insufficient."],
["The decomposition is validated by a small reconstruction error norm(A-Q*R).","Reconstruct A by multiplication, not by adding factors."]
],
"15":[
["Least squares minimizes the sum of squared residuals ||Ax-b||₂².","The objective measures prediction errors."],
["For a constant least-squares fit, the optimal value is the mean of 2,4,6.","Calculate the arithmetic average."],
["The normal equations are A'Ax=A'b for real matrices.","Multiply by the transpose in the least-squares condition."]
],
"16":[
["norm(A*x-b) measures the residual, not necessarily the forward solution error.","Substitute the computed x into the equations."],
["An ill-conditioned problem can amplify small perturbations, so a tiny residual need not imply accurate x.","Differentiate equation satisfaction from error in the solution."],
["The stated Übung 1 requirements include Julia source, PDF representations, and a ZIP.","Check the difference between executable source and the required copies."]
]
};

export function questionFeedback(lesson, questionIndex, choiceIndex) {
  if (!lesson || !/^\d{2}$/.test(lesson.id) || !Number.isInteger(questionIndex) ||
      !Number.isInteger(choiceIndex)) return null;
  const q=lesson.questions?.[questionIndex], entry=feedbackByLesson[lesson.id]?.[questionIndex];
  if (!q || !entry || choiceIndex<0 || choiceIndex>=q.choices.length) return null;
  const correct=choiceIndex===q.correct;
  return {correct,explanation:entry[correct?0:1],codingVerified:false};
}
