// L5 AMP reasoning content. Julia source executes only in CI, never in a browser.
const raw=[
  {
    "id": "contracts",
    "title": "Contracts and boundary cases",
    "explain": "An algorithm has a contract that states its accepted inputs and promised outputs. A division routine cannot use its usual formula when the divisor is zero, and a numerical average cannot use its usual formula on an empty collection. In mathematics, these are domain restrictions; in programs, they must become explicit checks. Returning `nothing` makes an undefined numeric result distinguishable from a legitimate zero. A precondition states what must hold at entry, a postcondition states what the calculation guarantees, and a boundary policy explains what happens when the normal precondition fails.\n\nA good implementation checks boundary inputs before performing operations that assume valid data. This is not merely a way to prevent crashes: it prevents false mathematical claims. To validate a contract, test at least one normal input, one boundary and a reversed or negative input when meaningful. The output of a function should be a value the caller can reuse; printing the value is a separate operation.",
    "invariant": "Division contract: if the denominator is nonzero, the quotient is numerator/denominator; if it is zero, the function returns nothing instead of an invented number.",
    "examples": [
      {
        "title": "Handle a zero divisor",
        "code": "function safe_ratio(a,b)\n    if b == 0\n        return nothing\n    end\n    return a / b\nend\nprintln(safe_ratio(12,3))\nprintln(safe_ratio(3,0))",
        "output": "4.0\nnothing",
        "trace": [
          "Test the first divisor, which is nonzero.",
          "Compute 12/3 and print 4.0.",
          "Return nothing for the zero divisor before dividing."
        ],
        "reason": "The guard implements an explicit boundary policy, and the normal branch implements the mathematical ratio for supported inputs.",
        "pitfall": "Treating a missing quotient as numerical zero would make an incorrect mathematical assertion."
      },
      {
        "title": "Nonnegative distance",
        "code": "function gap(a,b)\n    if a >= b\n        return a-b\n    end\n    return b-a\nend\nprintln(gap(9,4))\nprintln(gap(4,9))",
        "output": "5\n5",
        "trace": [
          "Compare the arguments before subtracting.",
          "Take larger minus smaller in the selected branch.",
          "Both input orders yield the same nonnegative gap."
        ],
        "reason": "The branch structure reproduces absolute difference and includes equality, where the result should be zero.",
        "pitfall": "Always subtracting the second argument from the first could return a negative distance."
      }
    ],
    "checks": [
      {
        "prompt": "What happens at the guarded boundary?",
        "code": "function ratio(a,b)\n    b == 0 && return nothing\n    return a/b\nend\nprintln(ratio(8,0))",
        "output": "nothing",
        "choices": [
          "0",
          "nothing",
          "Inf",
          "8"
        ],
        "correct": 1,
        "feedback": [
          "Zero would falsely represent an ordinary quotient.",
          "The guard returns nothing before division.",
          "Division by zero is never attempted.",
          "The numerator is not the return value."
        ],
        "hint": "Identify the first reached return statement."
      },
      {
        "prompt": "What does the equality boundary return?",
        "code": "function distance(a,b)\n    if a > b\n        return a-b\n    end\n    return b-a\nend\nprintln(distance(7,7))",
        "output": "0",
        "choices": [
          "-7",
          "7",
          "0",
          "14"
        ],
        "correct": 2,
        "feedback": [
          "Subtracting equal inputs does not give negative seven.",
          "The function returns a difference, not an input.",
          "The fallback computes 7-7=0.",
          "The function never adds its two inputs."
        ],
        "hint": "Compare equal arguments first."
      }
    ]
  },
  {
    "id": "invariants",
    "title": "Loop invariants and proof",
    "explain": "A loop invariant describes a condition that remains true at the start and end of each iteration. For a running sum, the accumulator equals the sum of all entries already visited. The argument for correctness has three steps: initialization, maintenance and termination. Initialization establishes the property before the loop; maintenance shows the next step preserves it; termination combines the invariant with the fact that every item has been processed.\n\nThis is a program version of induction. Instead of testing only a few examples, the invariant explains why a whole class of inputs is handled correctly. A counter has a similar invariant: after visiting k entries, it equals the number of those entries satisfying a predicate. A function-local accumulator avoids global-scope ambiguities when Julia code runs as a script rather than in an interactive session.",
    "invariant": "Running-sum invariant: after k processed entries, total equals the sum of exactly those k entries. Initially k=0 and total=0; each iteration adds the next entry; at termination every entry has been included.",
    "examples": [
      {
        "title": "Maintain an accumulated sum",
        "code": "function sum_loop(v)\n    total = 0\n    for x in v\n        total += x\n    end\n    return total\nend\nprintln(sum_loop([1,2,3,4]))",
        "output": "10",
        "trace": [
          "Before processing values, total is zero.",
          "Each iteration adds one new value to the maintained sum.",
          "The final accumulated result is 1+2+3+4=10."
        ],
        "reason": "This invariant proves the returned sum equals the sum of every processed entry, including the empty-vector case.",
        "pitfall": "Confusing the current loop element with the running total loses all earlier contributions."
      },
      {
        "title": "Count odd entries",
        "code": "function count_odd(v)\n    n = 0\n    for x in v\n        if isodd(x)\n            n += 1\n        end\n    end\n    return n\nend\nprintln(count_odd([1,2,3,5,6]))",
        "output": "3",
        "trace": [
          "Begin with a count of zero.",
          "Increment only when the current element is odd.",
          "Exactly three values satisfy the predicate."
        ],
        "reason": "The count tracks successful tests among the processed prefix, not the number of iterations that happened.",
        "pitfall": "Incrementing on every loop iteration would count all entries, including even numbers."
      }
    ],
    "checks": [
      {
        "prompt": "Which sum is returned?",
        "code": "function total(v)\n    s = 0\n    for x in v\n        s += x\n    end\n    return s\nend\nprintln(total([3,-1,4]))",
        "output": "6",
        "choices": [
          "3",
          "4",
          "6",
          "8"
        ],
        "correct": 2,
        "feedback": [
          "Three is just the first term.",
          "Four ignores some contributions.",
          "3-1+4 equals six.",
          "Eight ignores the negative entry."
        ],
        "hint": "Track the accumulator after each iteration."
      },
      {
        "prompt": "How many positive entries are counted?",
        "code": "function positives(v)\n    n = 0\n    for x in v\n        if x > 0\n            n += 1\n        end\n    end\n    return n\nend\nprintln(positives([-2,0,5,7]))",
        "output": "2",
        "choices": [
          "0",
          "1",
          "2",
          "4"
        ],
        "correct": 2,
        "feedback": [
          "Two positive values occur.",
          "Only one of the two positives would be counted.",
          "Both five and seven satisfy x>0.",
          "Zero and negative two are excluded."
        ],
        "hint": "Check whether zero passes a strict comparison."
      }
    ]
  },
  {
    "id": "vector-scans",
    "title": "Vector scans and cost",
    "explain": "A vector algorithm visits indexed entries and accumulates a result. A dot product multiplies entries at matching positions before summing. A scan for the maximum adjacent difference examines neighboring pairs, not every pair. Julia uses one-based indexing, so the second entry is v[2] and its immediate predecessor is v[1].\n\nRuntime analysis counts work as a function of input size n. A single scan processes O(n) elements; keeping just one scalar accumulator requires O(1) additional memory. These properties do not prove correctness, so the program also needs an invariant: after k steps, the accumulator equals the sum or maximum over the k processed cases. The worked code intentionally assumes compatible vector lengths for the dot product, which a production implementation should validate.",
    "invariant": "Dot-product invariant: after processing k positions, the accumulator equals the sum of pairwise products a[i]*b[i] for i=1..k. It makes one pass and uses a single scalar accumulator.",
    "examples": [
      {
        "title": "Manual dot product",
        "code": "function dot_manual(a,b)\n    s = 0\n    for i in eachindex(a)\n        s += a[i]*b[i]\n    end\n    return s\nend\nprintln(dot_manual([2,3],[4,5]))",
        "output": "23",
        "trace": [
          "The first matching product is 2×4=8.",
          "The second matching product is 3×5=15.",
          "Add the contributions to get 23."
        ],
        "reason": "The loop computes a mathematical dot product in linear time when vector sizes are compatible.",
        "pitfall": "Adding the vectors instead of multiplying corresponding entries computes a different operation."
      },
      {
        "title": "Largest adjacent difference",
        "code": "function max_step(v)\n    best = 0\n    for i in 2:length(v)\n        best = max(best,abs(v[i]-v[i-1]))\n    end\n    return best\nend\nprintln(max_step([3,8,6,11]))",
        "output": "5",
        "trace": [
          "Compare the first neighbors, obtaining difference five.",
          "The middle pair has difference two, so best remains five.",
          "The last pair has difference five, preserving the maximum."
        ],
        "reason": "Only adjacent pairs are inspected. The method needs n−1 comparisons for n entries.",
        "pitfall": "Comparing arbitrary nonadjacent entries would change the definition of this problem."
      }
    ],
    "checks": [
      {
        "prompt": "What dot product is printed?",
        "code": "function dot2(a,b)\n    s = 0\n    for i in eachindex(a)\n        s += a[i]*b[i]\n    end\n    return s\nend\nprintln(dot2([1,4],[3,2]))",
        "output": "11",
        "choices": [
          "8",
          "9",
          "11",
          "15"
        ],
        "correct": 2,
        "feedback": [
          "Eight is one pair's contribution only.",
          "Nine is not the sum of both products.",
          "1×3+4×2 equals eleven.",
          "Fifteen exceeds the two stated products."
        ],
        "hint": "Multiply at matching indexes first."
      },
      {
        "prompt": "What is the largest adjacent difference?",
        "code": "function largest_change(v)\n    best = 0\n    for i in 2:length(v)\n        best = max(best,abs(v[i]-v[i-1]))\n    end\n    return best\nend\nprintln(largest_change([1,6,4,9]))",
        "output": "5",
        "choices": [
          "3",
          "4",
          "5",
          "8"
        ],
        "correct": 2,
        "feedback": [
          "The maximum neighbor change is greater than three.",
          "Four does not occur as the maximum difference.",
          "The neighbor differences are five, two and five.",
          "Eight compares nonadjacent entries."
        ],
        "hint": "Compare only consecutive positions."
      }
    ]
  },
  {
    "id": "matrix-methods",
    "title": "Matrix products and elimination",
    "explain": "A matrix stores entries by row and column. Julia writes A[i,j] for row i, column j, and `[2 1;4 3]` for a two-row matrix. Matrix-vector multiplication computes one dot product per row; it is not the same as broadcasted elementwise multiplication. In a 2×2 system, elimination subtracts a multiple of the pivot row from the lower row to make the lower entry of the pivot column zero.\n\nThe multiplier is the lower entry divided by a nonzero pivot. Elimination preserves the solutions of the original system when the right-hand side receives the matching row operation. A general solver must also account for a zero or very small pivot, row exchanges and floating-point error. These examples show one local elimination step only; they are not a complete stable linear-system solver.",
    "invariant": "Row-operation invariant: replacing a row with itself minus a multiple of another row preserves the solution set when applied to the entire augmented system. A nonzero pivot is required to calculate the multiplier.",
    "examples": [
      {
        "title": "Multiply a matrix by a vector",
        "code": "A = [2 1; 4 3]\nx = [1,2]\nprintln(A*x)",
        "output": "[4, 10]",
        "trace": [
          "The first row produces 2×1+1×2=4.",
          "The second row produces 4×1+3×2=10.",
          "Assemble the two row results as a vector."
        ],
        "reason": "Matrix-vector multiplication implements one row dot product per output component.",
        "pitfall": "A dotted elementwise product is not the same operation as A*x."
      },
      {
        "title": "Eliminate a lower entry",
        "code": "A = Float64.([2 1;4 3])\nfactor = A[2,1]/A[1,1]\nA[2,1] -= factor*A[1,1]\nA[2,2] -= factor*A[1,2]\nprintln(A[2,1])\nprintln(A[2,2])",
        "output": "0.0\n1.0",
        "trace": [
          "Compute the factor 4/2=2.0.",
          "Subtract two times the first row from the second row.",
          "The updated row entries are 0.0 and 1.0."
        ],
        "reason": "The operation zeros the lower-left entry and simplifies the system's coefficient matrix.",
        "pitfall": "Dividing by a zero pivot would require a separate pivoting strategy."
      }
    ],
    "checks": [
      {
        "prompt": "What vector does multiplication return?",
        "code": "A = [1 2;3 1]\nx = [2,4]\nprintln(A*x)",
        "output": "[10, 10]",
        "choices": [
          "[6, 8]",
          "[10, 10]",
          "[8, 10]",
          "[10, 8]"
        ],
        "correct": 1,
        "feedback": [
          "These are not the row dot products.",
          "Each row dot product equals ten.",
          "The first row produces ten, not eight.",
          "The second row produces ten, not eight."
        ],
        "hint": "Compute a separate dot product for each row."
      },
      {
        "prompt": "What is the eliminated entry?",
        "code": "A = Float64.([3 2;6 5])\nf = A[2,1]/A[1,1]\nA[2,1] -= f*A[1,1]\nprintln(A[2,1])",
        "output": "0.0",
        "choices": [
          "0.0",
          "2.0",
          "3.0",
          "6.0"
        ],
        "correct": 0,
        "feedback": [
          "The update computes 6-2×3=0.",
          "Two is the elimination multiplier.",
          "Three is the original pivot.",
          "Six is the old lower entry."
        ],
        "hint": "Subtract the pivot contribution from the lower entry."
      }
    ]
  },
  {
    "id": "root-finding",
    "title": "Bisection and stopping rules",
    "explain": "Bisection approximates a zero of a continuous function with opposite endpoint signs. At each step, inspect the midpoint and retain the half-interval that brackets the root. If the initial width is W, after k halvings it is W/2^k. This provides an explicit worst-case uncertainty bound based on the bracket width rather than a guess about the number of significant digits.\n\nTo justify bisection, check continuity on the interval and verify a sign change at the endpoints or detect an endpoint root. The simple fixed-step demonstrations use known monotone functions for clarity. A full solver needs an iteration limit, tolerance, checks for exact roots and safeguards against floating-point stagnation. Its invariant is that the target root remains in the retained interval.",
    "invariant": "Bracketing invariant: after each midpoint update, the retained closed interval still contains a root; its width is half the previous width. This argument relies on a valid initial bracket and continuity.",
    "examples": [
      {
        "title": "Three updates for sqrt(2)",
        "code": "function trace_root()\n    lo,hi = 1.0,2.0\n    for step in 1:3\n        mid = (lo+hi)/2\n        if mid^2 > 2\n            hi = mid\n        else\n            lo = mid\n        end\n    end\n    println(lo)\n    println(hi)\nend\ntrace_root()",
        "output": "1.375\n1.5",
        "trace": [
          "The midpoint 1.5 squares above two, so update hi.",
          "The midpoint 1.25 squares below two, so update lo.",
          "The midpoint 1.375 squares below two, leaving [1.375,1.5]."
        ],
        "reason": "Each iteration keeps the root bracketed and halves the remaining interval width.",
        "pitfall": "Neither endpoint should be presented as the exact irrational root."
      },
      {
        "title": "Bracket the linear root 3",
        "code": "function linear_bracket()\n    lo,hi = 0.0,8.0\n    for step in 1:2\n        mid = (lo+hi)/2\n        if mid > 3\n            hi = mid\n        else\n            lo = mid\n        end\n    end\n    println(lo)\n    println(hi)\nend\nlinear_bracket()",
        "output": "2.0\n4.0",
        "trace": [
          "Test midpoint four; it lies above three, so update hi.",
          "Test midpoint two; it lies below three, so update lo.",
          "The final retained interval is [2,4]."
        ],
        "reason": "For the displayed linear function, comparison with three is equivalent to testing the sign of f(x)=x-3.",
        "pitfall": "Replacing the wrong endpoint would discard the desired root."
      }
    ],
    "checks": [
      {
        "prompt": "What upper endpoint remains after two steps?",
        "code": "function upper()\n    lo,hi = 0.0,8.0\n    for k in 1:2\n        mid = (lo+hi)/2\n        if mid > 3\n            hi = mid\n        else\n            lo = mid\n        end\n    end\n    println(hi)\nend\nupper()",
        "output": "4.0",
        "choices": [
          "2.0",
          "3.0",
          "4.0",
          "8.0"
        ],
        "correct": 2,
        "feedback": [
          "Two is the final lower endpoint.",
          "The root itself is not assigned to the upper endpoint.",
          "The first upper update sets four and the second leaves it.",
          "Eight is the old upper endpoint."
        ],
        "hint": "Track endpoints separately after every test."
      },
      {
        "prompt": "What interval width follows three halvings?",
        "code": "function width3()\n    w = 8.0\n    for k in 1:3\n        w /= 2\n    end\n    println(w)\nend\nwidth3()",
        "output": "1.0",
        "choices": [
          "1.0",
          "2.0",
          "4.0",
          "0.5"
        ],
        "correct": 0,
        "feedback": [
          "Three halvings reduce eight to one.",
          "Two is the width after two halvings.",
          "Four is the width after one halving.",
          "Half a unit would require four halvings."
        ],
        "hint": "Count the actual number of divisions by two."
      }
    ]
  },
  {
    "id": "numerical-safety",
    "title": "Floating point and numerical guards",
    "explain": "Floating-point data approximates real numbers using finite binary representations. The decimal fraction 0.1 is not stored exactly, so the expression `0.1+0.2` need not compare exactly equal to the literal `0.3`. `isapprox` can check closeness within a tolerance, but the correct tolerance depends on the mathematical scale and algorithm. A successful approximate comparison is not proof that a calculation was exact.\n\nNonfinite values also require special handling. A floating-point division by zero can produce infinity, and zero divided by zero produces NaN. Their comparisons have special rules: NaN is not equal to itself. `isfinite` can reject infinities and NaNs before they contaminate later calculations. Empty collections and zero divisors are different boundary types; a sound algorithm's contract should distinguish each and avoid silently manufacturing numerical answers.",
    "invariant": "Safety condition: before using a computed value in subsequent finite arithmetic, check that it belongs to the intended domain and, where required, is finite. Tolerance-based comparisons need a scale-aware justification.",
    "examples": [
      {
        "title": "Compare exact and approximate results",
        "code": "println(0.1+0.2 == 0.3)\nprintln(isapprox(0.1+0.2,0.3))",
        "output": "false\ntrue",
        "trace": [
          "Floating-point values approximate the written decimals.",
          "Exact equality compares stored results, giving false.",
          "isapprox judges the results sufficiently close by its tolerance."
        ],
        "reason": "An approximate numerical check should express an allowed error, not assume all binary floating-point sums are exact.",
        "pitfall": "An unqualified tolerance can conceal errors when the numerical scale changes."
      },
      {
        "title": "Handle an empty average",
        "code": "function mean_or_nothing(v)\n    isempty(v) && return nothing\n    return sum(v)/length(v)\nend\nprintln(mean_or_nothing([2,4,6]))\nprintln(mean_or_nothing(Int[]))",
        "output": "4.0\nnothing",
        "trace": [
          "For the nonempty vector, sum twelve and divide by three.",
          "For the empty vector, the guard returns before division.",
          "Print the numeric mean and the explicit no-result sentinel."
        ],
        "reason": "An empty input has no ordinary arithmetic mean, and nothing communicates that absence unambiguously.",
        "pitfall": "Returning zero would falsely state a measured mean for a dataset with no entries."
      }
    ],
    "checks": [
      {
        "prompt": "Is NaN equal to itself?",
        "code": "x = 0.0/0.0\nprintln(x == x)",
        "output": "false",
        "choices": [
          "true",
          "false",
          "0.0",
          "nothing"
        ],
        "correct": 1,
        "feedback": [
          "NaN does not compare equal to itself.",
          "Floating-point NaN equality is false.",
          "The equality operator returns a Boolean.",
          "The script has no branch returning nothing."
        ],
        "hint": "Check special equality semantics for NaN."
      },
      {
        "prompt": "Does isfinite accept positive infinity?",
        "code": "x = 1.0/0.0\nprintln(isfinite(x))",
        "output": "false",
        "choices": [
          "true",
          "false",
          "Inf",
          "Error"
        ],
        "correct": 1,
        "feedback": [
          "An infinity is nonfinite.",
          "isfinite returns false for infinity.",
          "The function returns Boolean, not the operand.",
          "Floating-point division produces infinity here."
        ],
        "hint": "Classify the floating-point quotient first."
      }
    ]
  }
];
export const ALGORITHM_UNITS=Object.freeze(raw.map(u=>Object.freeze({...u,
 examples:Object.freeze(u.examples.map(e=>Object.freeze({...e,trace:Object.freeze(e.trace)}))),
 checks:Object.freeze(u.checks.map((q,i)=>Object.freeze({...q,id:u.id+"-"+(i+1),choices:Object.freeze(q.choices),feedback:Object.freeze(q.feedback)})))
})));
export const ALGORITHM_ANSWERS_KEY="amp-julia-learn:algorithms-v1";
export function algorithmUnit(id){return ALGORITHM_UNITS.find(u=>u.id===id)||null;}
export function gradeAlgorithmCheck(question,selection){
 if(!question)return {valid:false,correct:false,feedback:"No question selected."};
 const index=Number(selection);
 if(!Number.isInteger(index)||String(index)!==String(selection)||index<0||index>=question.choices.length)
  return {valid:false,correct:false,feedback:"Select one answer."};
 return {valid:true,correct:index===question.correct,feedback:question.feedback[index]};
}
export function readAlgorithmAnswers(storage=globalThis.localStorage){
 try{
  const source=JSON.parse(storage.getItem(ALGORITHM_ANSWERS_KEY)||"{}");
  if(!source||typeof source!=="object"||Array.isArray(source))return {};
  const valid={};
  for(const [key,answer] of Object.entries(source)){
   const q=ALGORITHM_UNITS.flatMap(u=>u.checks).find(item=>item.id===key);
   if(q&&typeof answer==="string"&&gradeAlgorithmCheck(q,answer).valid)valid[key]=answer;
  }
  return valid;
 }catch{return {};}
}
export function writeAlgorithmAnswer(q,selection,storage=globalThis.localStorage){
 const result=gradeAlgorithmCheck(q,selection);
 if(!result.valid)return {...result,saved:false};
 try{
  const answers=readAlgorithmAnswers(storage);answers[q.id]=String(selection);
  storage.setItem(ALGORITHM_ANSWERS_KEY,JSON.stringify(answers));return {...result,saved:true};
 }catch{return {...result,saved:false};}
}
