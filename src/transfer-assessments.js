// Original L8 transfer problems; genuine Julia CI executes the sources.
// The web interface only presents code and keyed reasoning, not a Julia interpreter.
const authored=[
  {
    "id": "nonuniform",
    "title": "Nonuniform numerical integration",
    "explain": "The composite trapezoidal rule also works on a nonuniform grid, but every subinterval needs its own width. For f(x)=x²+1 sampled at x=0,1,3, the function values are 1,2,10 and the interval widths are 1 and 2. Using a single h would incorrectly treat the second cell as having the same width as the first. The transfer task calculates a numerical estimate, evaluates the exact antiderivative independently, and compares both results.",
    "proof": "The first trapezoid has area (1+2)/2×1=1.5. The second has area (2+10)/2×2=12. Their sum is 13.5. The analytic integral from 0 to 3 is [x³/3+x]₀³=12, hence the true absolute error is 1.5. A numerical estimate cannot certify its own accuracy by self-comparison; independent mathematical information is required. Convexity also explains why these trapezoids overestimate this function.",
    "precondition": "Sample positions must be strictly increasing and each cell must use its actual width.",
    "steps": [
      {
        "kind": "output",
        "ask": "Compute the nonuniform composite trapezoidal sum.",
        "code": "x=[0.0,1.0,3.0]\ny=[1.0,2.0,10.0]\na=sum((x[i+1]-x[i])*(y[i]+y[i+1])/2 for i in 1:2)\nprintln(a)",
        "stdout": "13.5",
        "options": [
          "12.0",
          "12.5",
          "13.5",
          "14.0"
        ],
        "key": 2,
        "reason": "The separate cell areas 1.5 and 12 add to 13.5.",
        "hint": "The second cell has width two, not one.",
        "feedback": [
          "12 is the exact integral rather than the approximation.",
          "The second cell contributes twelve.",
          "The separate cell areas 1.5 and 12 add to 13.5.",
          "The cell areas do not add to fourteen."
        ]
      },
      {
        "kind": "output",
        "ask": "Evaluate the exact analytic integral.",
        "code": "b=3.0\nprintln(b^3/3+b)",
        "stdout": "12.0",
        "options": [
          "9.0",
          "10.0",
          "12.0",
          "13.5"
        ],
        "key": 2,
        "reason": "The antiderivative x³/3+x gives 9+3=12 at x=3.",
        "hint": "Include the integral of the constant term.",
        "feedback": [
          "Nine omits the constant term.",
          "Ten undercounts that term.",
          "The antiderivative x³/3+x gives 9+3=12 at x=3.",
          "13.5 is the trapezoidal estimate."
        ]
      },
      {
        "kind": "output",
        "ask": "Calculate the true absolute quadrature error.",
        "code": "println(abs(13.5-12.0))",
        "stdout": "1.5",
        "options": [
          "0.0",
          "0.5",
          "1.5",
          "2.0"
        ],
        "key": 2,
        "reason": "Absolute error equals |approximation−exact integral|.",
        "hint": "Use the independent analytic result 12.",
        "feedback": [
          "The trapezoids are not exact for this parabola.",
          "The difference exceeds half a unit.",
          "Absolute error equals |approximation−exact integral|.",
          "The difference is 1.5 rather than 2."
        ]
      }
    ],
    "justify": {
      "kind": "justification",
      "ask": "Which interpretation of the grid is mathematically valid?",
      "code": "x=[0.0,1.0,3.0]\nprintln([x[i+1]-x[i] for i in 1:2])",
      "stdout": "[1.0, 2.0]",
      "options": [
        "One global width h=1 is valid because the first step is one.",
        "Nonuniform sample spacing makes trapezoidal quadrature impossible.",
        "Each cell requires its own width multiplied by average endpoint height.",
        "A convex function always has zero trapezoidal approximation error."
      ],
      "key": 2,
      "reason": "The printed widths differ: each trapezoidal area must include its own local base length.",
      "hint": "Note the two entries in the printed width vector.",
      "feedback": [
        "The second cell is twice as wide as the first.",
        "Nonuniform trapezoids are well-defined for ordered samples.",
        "The printed widths differ: each trapezoidal area must include its own local base length.",
        "Convexity does not remove approximation error."
      ]
    }
  },
  {
    "id": "root-transfer",
    "title": "Bracketing a different nonlinear root",
    "explain": "Apply bisection to f(x)=x²−5 on [2,3]. A root lies within the bracket because the continuous function has opposite signs at these endpoints. Trace two sign-based interval updates and compute the uncertainty bound for the midpoint. The transferred justification problem then uses a symmetric interval [-3,3] for the same polynomial, a case where the simple endpoint sign-change test fails despite interior roots.",
    "proof": "The endpoint function values are -1 and 4, so the product is -4. The midpoint 2.5 is above √5, giving [2,2.5]. The midpoint 2.25 is again above √5, giving [2,2.25]. This interval has width 0.25, hence its midpoint is within 0.125 of a bracketed root. On [-3,3] both endpoint function values equal 4, but roots ±√5 remain inside. Opposite endpoint signs are sufficient for a root, not necessary for one to exist.",
    "precondition": "Continuity and opposing endpoint signs justify the standard bisection bracket guarantee.",
    "steps": [
      {
        "kind": "output",
        "ask": "Calculate the product of the endpoint function values.",
        "code": "println((2^2-5)*(3^2-5))",
        "stdout": "-4",
        "options": [
          "-4",
          "-1",
          "0",
          "4"
        ],
        "key": 0,
        "reason": "The endpoint evaluations are -1 and 4; their product is -4, which confirms the required opposing signs.",
        "hint": "Evaluate f(2) and f(3) separately.",
        "feedback": [
          "The values -1 and 4 multiply to -4.",
          "-1 is only the lower endpoint value.",
          "Neither endpoint is a root.",
          "4 is only the upper endpoint value."
        ]
      },
      {
        "kind": "output",
        "ask": "Find the retained bracket after two halvings.",
        "code": "function bracket()\n lo,hi=2.0,3.0\n for k in 1:2\n  m=(lo+hi)/2\n  if m^2>5\n   hi=m\n  else\n   lo=m\n  end\n end\n return [lo,hi]\nend\nprintln(bracket())",
        "stdout": "[2.0, 2.25]",
        "options": [
          "[2.0, 2.5]",
          "[2.0, 2.25]",
          "[2.25, 2.5]",
          "[2.0, 3.0]"
        ],
        "key": 1,
        "reason": "Both midpoints 2.5 and 2.25 are on the high side of √5.",
        "hint": "The first and second upper endpoints change; the lower stays at 2.",
        "feedback": [
          "Only one halving was performed.",
          "Both midpoints 2.5 and 2.25 are on the high side of √5.",
          "The lower endpoint has not moved.",
          "This is the initial bracket."
        ]
      },
      {
        "kind": "output",
        "ask": "Find the midpoint location-error bound.",
        "code": "lo,hi=2.0,2.25\nprintln((hi-lo)/2)",
        "stdout": "0.125",
        "options": [
          "0.0625",
          "0.125",
          "0.25",
          "0.5"
        ],
        "key": 1,
        "reason": "The midpoint error is at most half the final bracket width.",
        "hint": "The final interval is only 0.25 wide.",
        "feedback": [
          "This bound would need another halving.",
          "The midpoint error is at most half the final bracket width.",
          "0.25 is the full remaining width.",
          "0.5 is the original midpoint bound."
        ]
      }
    ],
    "justify": {
      "kind": "justification",
      "ask": "What does the absence of an endpoint sign change establish?",
      "code": "f(x)=x^2-5\nprintln(f(-3.0)*f(3.0)<0)",
      "stdout": "false",
      "options": [
        "There are no roots at all inside [-3,3].",
        "The sign-change test guarantees successful bisection here.",
        "The test fails even though two roots lie strictly inside this interval.",
        "The polynomial must have a discontinuity between the endpoints."
      ],
      "key": 2,
      "reason": "The endpoint-sign test returns false despite roots at ±√5; it cannot prove root absence.",
      "hint": "Consider both positive and negative solutions of x²=5.",
      "feedback": [
        "Both roots lie within the stated interval.",
        "The test prints false; its sufficient condition fails.",
        "The endpoint-sign test returns false despite roots at ±√5; it cannot prove root absence.",
        "A polynomial is continuous on the entire real line."
      ]
    }
  },
  {
    "id": "regression",
    "title": "Least-squares fit instead of exact interpolation",
    "explain": "Estimate a straight-line model for three noncollinear observations (0,1), (1,2), (2,2). With more equations than unknown coefficients, the data need not admit an exact linear interpolant. Least squares instead minimizes the sum of squared residuals. Derive the centered slope, compute the intercept from sample means, and measure the resulting squared error. The conceptual transfer asks why a nonzero residual does not invalidate the method.",
    "proof": "The means are x̄=1 and ȳ=5/3. The centered numerator Σ(x−x̄)(y−ȳ)=1 and denominator Σ(x−x̄)²=2, giving slope 1/2. The intercept is 5/3−1/2=7/6. Predicted values are [7/6,5/3,13/6]. Residuals [-1/6,1/3,-1/6] have squared sum 1/6≈0.166667. These nonzero residuals can still correspond to an optimal least-squares solution.",
    "precondition": "Valid slope estimation requires variation in x; all identical x-values yield a zero denominator.",
    "steps": [
      {
        "kind": "output",
        "ask": "Compute the centered least-squares slope.",
        "code": "x=[0.0,1.0,2.0]\ny=[1.0,2.0,2.0]\nxbar=sum(x)/length(x)\nybar=sum(y)/length(y)\nm=sum((x.-xbar).*(y.-ybar))/sum((x.-xbar).^2)\nprintln(m)",
        "stdout": "0.5",
        "options": [
          "0.0",
          "0.25",
          "0.5",
          "1.0"
        ],
        "key": 2,
        "reason": "The centered numerator is one and the denominator is two.",
        "hint": "Use the centered x and y deviations.",
        "feedback": [
          "The correlation is not zero for these points.",
          "The denominator is two rather than four.",
          "The centered numerator is one and the denominator is two.",
          "One is the numerator, not the slope."
        ]
      },
      {
        "kind": "output",
        "ask": "Calculate the least-squares regression intercept from the recorded slope and sample means.",
        "code": "xbar=1.0\nybar=5.0/3.0\nm=0.5\nprintln(round(ybar-m*xbar,digits=6))",
        "stdout": "1.166667",
        "options": [
          "0.5",
          "1.0",
          "1.166667",
          "1.666667"
        ],
        "key": 2,
        "reason": "The intercept is 7/6, printed to six decimal places.",
        "hint": "Subtract slope times x̄ from mean y.",
        "feedback": [
          "0.5 is the slope rather than the intercept.",
          "This undercounts the mean adjustment.",
          "The intercept is 7/6, printed to six decimal places.",
          "This is mean y, before subtracting the slope."
        ]
      },
      {
        "kind": "output",
        "ask": "Calculate the squared residual sum.",
        "code": "x=[0.0,1.0,2.0]\ny=[1.0,2.0,2.0]\npred=7/6 .+ 0.5 .* x\nprintln(round(sum((y.-pred).^2),digits=6))",
        "stdout": "0.166667",
        "options": [
          "0.0",
          "0.083333",
          "0.166667",
          "0.333333"
        ],
        "key": 2,
        "reason": "The sum of all three squared residuals equals 1/6, demonstrating nonzero error despite an optimal line.",
        "hint": "Square each residual before summing.",
        "feedback": [
          "The observations are not all on the fitted line.",
          "This is only half the correct sum.",
          "The squared errors sum to 1/6, not zero.",
          "This is twice the correct sum."
        ]
      }
    ],
    "justify": {
      "kind": "justification",
      "ask": "Why can the fitted line be optimal despite mismatched observations?",
      "code": "observed=[1.0,2.0,2.0]\npredicted=[7/6,5/3,13/6]\nprintln(observed==predicted)",
      "stdout": "false",
      "options": [
        "Every nonzero residual proves the coefficients are wrong.",
        "Least squares minimizes total squared residuals; exact interpolation is unnecessary.",
        "The slope is necessarily zero whenever the residual is nonzero.",
        "All x-values must be identical to apply the least-squares formula."
      ],
      "key": 1,
      "reason": "An optimal least-squares solution can have nonzero residuals for an overdetermined system.",
      "hint": "Distinguish optimization from solving every observation exactly.",
      "feedback": [
        "A nonzero residual is expected for some inconsistent datasets.",
        "An optimal least-squares solution can have nonzero residuals for an overdetermined system.",
        "Nonzero residuals do not force zero slope.",
        "Identical x-values undermine slope identification."
      ]
    }
  },
  {
    "id": "jacobi-transfer",
    "title": "Simultaneous Jacobi iteration",
    "explain": "Apply the Jacobi algorithm, not Gaussian elimination, to the system 2x+y=5 and x+3y=6. Start at the zero vector. Every component of the next iterate must be evaluated from the preceding iterate, giving a simultaneous rather than in-place update. Calculate two iterations, then evaluate the maximum absolute residual of the second. The justification checks strict diagonal dominance, a sufficient condition for convergence in this particular system.",
    "proof": "The update equations are x_new=(5−y_old)/2 and y_new=(6−x_old)/3. Iteration one gives [2.5,2.0]; iteration two gives [1.5,7/6]≈[1.5,1.166667]. Substitution into the original system yields residuals [-5/6,-1], so the infinity norm is 1.0. The matrix has |2|>|1| in row one and |3|>|1| in row two, supporting Jacobi convergence. Convergence does not make early iterates exact solutions.",
    "precondition": "Jacobi updates both coordinates using old values; strict row diagonal dominance is sufficient for convergence here.",
    "steps": [
      {
        "kind": "output",
        "ask": "Compute the first simultaneous Jacobi update.",
        "code": "A=[2.0 1.0;1.0 3.0]\nb=[5.0,6.0]\nx=zeros(2)\nnext=[(b[1]-x[2])/A[1,1],(b[2]-x[1])/A[2,2]]\nprintln(next)",
        "stdout": "[2.5, 2.0]",
        "options": [
          "[2.5, 2.0]",
          "[2.0, 2.5]",
          "[5.0, 6.0]",
          "[1.5, 1.0]"
        ],
        "key": 0,
        "reason": "The diagonal entries divide each right-hand side at the zero iterate.",
        "hint": "The new entries are 5/2 and 6/3.",
        "feedback": [
          "The diagonal entries divide each right-hand side at the zero iterate.",
          "The components are in the original variable order.",
          "The right-hand side is not the iterate.",
          "The proposed values do not follow the update rule."
        ]
      },
      {
        "kind": "output",
        "ask": "Compute the second update without in-place reuse.",
        "code": "old=[2.5,2.0]\nnext=[(5.0-old[2])/2.0,(6.0-old[1])/3.0]\nprintln(round.(next,digits=6))",
        "stdout": "[1.5, 1.166667]",
        "options": [
          "[1.5, 1.166667]",
          "[1.5, 1.5]",
          "[2.5, 2.0]",
          "[2.0, 1.166667]"
        ],
        "key": 0,
        "reason": "Use both old coordinates rather than mixing new and old values.",
        "hint": "The two new entries are 1.5 and 3.5/3.",
        "feedback": [
          "Use both old coordinates rather than mixing new and old values.",
          "This uses the new x prematurely.",
          "This repeats the previous iterate.",
          "The first new component equals 1.5."
        ]
      },
      {
        "kind": "output",
        "ask": "Compute the maximum absolute residual of the second iterate.",
        "code": "A=[2.0 1.0;1.0 3.0]\nb=[5.0,6.0]\nx=[1.5,7/6]\nprintln(round(maximum(abs.(A*x-b)),digits=6))",
        "stdout": "1.0",
        "options": [
          "0.0",
          "0.5",
          "0.833333",
          "1.0"
        ],
        "key": 3,
        "reason": "The absolute residuals are 5/6 and 1; take the maximum.",
        "hint": "The infinity norm of the residual equals 1.0.",
        "feedback": [
          "Two iterations do not yield the exact answer.",
          "Half a unit is below the maximum residual.",
          "5/6 is the smaller residual magnitude.",
          "The absolute residuals are 5/6 and 1; take the maximum."
        ]
      }
    ],
    "justify": {
      "kind": "justification",
      "ask": "Why does the matrix satisfy a sufficient Jacobi convergence condition?",
      "code": "A=[2.0 1.0;1.0 3.0]\nprintln(abs(A[1,1])>abs(A[1,2]) && abs(A[2,2])>abs(A[2,1]))",
      "stdout": "true",
      "options": [
        "All linear systems converge under Jacobi whenever any diagonal entry is nonzero.",
        "Strict row diagonal dominance supports Jacobi convergence for this specific matrix.",
        "Diagonal dominance makes the first iterate an exact solution.",
        "Jacobi must reuse each freshly updated coordinate during the same iteration."
      ],
      "key": 1,
      "reason": "Both rows are strictly diagonally dominant, a standard sufficient Jacobi convergence condition.",
      "hint": "Compare each diagonal magnitude with its row's off-diagonal sum.",
      "feedback": [
        "The property is not universal for arbitrary matrices.",
        "Both rows are strictly diagonally dominant, a standard sufficient Jacobi convergence condition.",
        "Convergence does not imply immediate exactness.",
        "Reusing fresh coordinates describes another iteration method."
      ]
    }
  },
  {
    "id": "difference",
    "title": "Finite differences and truncation accuracy",
    "explain": "Approximate the derivative of f(x)=x³ at x=2 with h=0.1. Compute both the forward difference and centered difference, using different stencils but the same target derivative. The exact derivative is 12. Compare the numerical values, then compute the centered scheme's absolute error. The justification examines why symmetric sampling can suppress a leading truncation term and why very small h can still cause floating-point roundoff problems.",
    "proof": "The forward approximation is [(2.1)³−2³]/0.1=12.61 and has error 0.61. The centered approximation is [(2.1)³−(1.9)³]/0.2=12.01 and has error 0.01. Taylor expansions show that the forward formula generally has O(h) truncation error while the symmetric centered formula has O(h²) truncation error for smooth functions. These asymptotic claims do not imply that infinitely small h always improves finite-precision results.",
    "precondition": "The function must be sufficiently smooth near x and both sampling points must belong to its domain.",
    "steps": [
      {
        "kind": "output",
        "ask": "Compute the forward finite-difference estimate of f′(2) using h=0.1.",
        "code": "x=2.0\nh=0.1\nprintln(round(((x+h)^3-x^3)/h,digits=2))",
        "stdout": "12.61",
        "options": [
          "11.9",
          "12.0",
          "12.01",
          "12.61"
        ],
        "key": 3,
        "reason": "The cubic difference is 1.261; divide by 0.1.",
        "hint": "Evaluate f(x+h) and f(x), not the symmetric pair.",
        "feedback": [
          "This is not the correct cubic difference.",
          "This is the exact analytic derivative.",
          "This is the centered approximation.",
          "The cubic difference is 1.261; divide by 0.1."
        ]
      },
      {
        "kind": "output",
        "ask": "Compute the centered finite-difference estimate of f′(2) with h=0.1.",
        "code": "x=2.0\nh=0.1\nprintln(round(((x+h)^3-(x-h)^3)/(2*h),digits=2))",
        "stdout": "12.01",
        "options": [
          "12.0",
          "12.01",
          "12.21",
          "12.61"
        ],
        "key": 1,
        "reason": "The numerator is 9.261−6.859=2.402; divide by 0.2.",
        "hint": "Use f(x+h) and f(x−h) with denominator 2h.",
        "feedback": [
          "This is the exact derivative, not the approximation.",
          "The numerator is 9.261−6.859=2.402; divide by 0.2.",
          "The numerical numerator was miscalculated.",
          "This is the forward difference."
        ]
      },
      {
        "kind": "output",
        "ask": "Compute the centered difference's absolute error.",
        "code": "println(round(abs(12.01-12.0),digits=2))",
        "stdout": "0.01",
        "options": [
          "0.0",
          "0.01",
          "0.1",
          "0.61"
        ],
        "key": 1,
        "reason": "The centered estimate differs from 12 by 0.01.",
        "hint": "Compare the result with the analytic derivative.",
        "feedback": [
          "The centered estimate is not exact.",
          "The centered estimate differs from 12 by 0.01.",
          "This is ten times larger than the actual error.",
          "This is the forward difference error."
        ]
      }
    ],
    "justify": {
      "kind": "justification",
      "ask": "What supports the better truncation accuracy of the centered formula?",
      "code": "println(abs(12.01-12.0)<abs(12.61-12.0))",
      "stdout": "true",
      "options": [
        "Symmetry cancels the first-order Taylor truncation term for smooth functions.",
        "Any decrease in h always improves Float64 accuracy without exception.",
        "Centered differences are exact for every polynomial.",
        "Forward differences approximate second derivatives rather than first derivatives."
      ],
      "key": 0,
      "reason": "The centered stencil cancels the leading first-order truncation term for smooth f.",
      "hint": "Use Taylor expansions and consider roundoff separately.",
      "feedback": [
        "The centered stencil cancels the leading first-order truncation term for smooth f.",
        "Very small h can amplify cancellation and roundoff.",
        "This cubic example still has a nonzero truncation error.",
        "Both formulas approximate first derivatives."
      ]
    }
  }
];
export const TRANSFER_CASES=Object.freeze(authored.map(c=>Object.freeze({...c,
 steps:Object.freeze(c.steps.map((q,i)=>Object.freeze({...q,id:c.id+"-step-"+(i+1),
  options:Object.freeze(q.options),feedback:Object.freeze(q.feedback)}))),
 justify:Object.freeze({...c.justify,id:c.id+"-justify",
  options:Object.freeze(c.justify.options),feedback:Object.freeze(c.justify.feedback)})
})));
export const TRANSFER_STORAGE_KEY="amp-julia-learn:transfer-v1";
const questions=TRANSFER_CASES.flatMap(c=>[...c.steps,c.justify]);
const indexed=new Map(questions.map(q=>[q.id,q]));
if(indexed.size!==20||TRANSFER_CASES.length!==5)throw Error("Invalid transfer inventory");
export function gradeTransferAnswer(q,value){
 if(!q||indexed.get(q.id)!==q)return {valid:false,correct:false,feedback:"Unknown question."};
 const i=Number(value);
 if(!Number.isInteger(i)||String(i)!==String(value)||i<0||i>=q.options.length)
  return {valid:false,correct:false,feedback:"Select an answer."};
 return {valid:true,correct:i===q.key,feedback:q.feedback[i]};
}
export function readTransferAnswers(storage=globalThis.localStorage){
 try{
  const saved=JSON.parse(storage.getItem(TRANSFER_STORAGE_KEY)||"{}");
  if(!saved||typeof saved!=="object"||Array.isArray(saved))return {};
  const clean={};
  for(const [id,value] of Object.entries(saved)){
   const q=indexed.get(id);
   if(q&&typeof value==="string"&&gradeTransferAnswer(q,value).valid)clean[id]=value;
  }
  return clean;
 }catch{return {};}
}
export function writeTransferAnswer(q,value,storage=globalThis.localStorage){
 const grade=gradeTransferAnswer(q,value);
 if(!grade.valid)return {...grade,saved:false};
 try{const saved=readTransferAnswers(storage);saved[q.id]=String(value);
  storage.setItem(TRANSFER_STORAGE_KEY,JSON.stringify(saved));
  return {...grade,saved:true};
 }catch{return {...grade,saved:false};}
}
export function transferEvidence(answers={}){
 const units=TRANSFER_CASES.map(c=>{
  const checks=[...c.steps,c.justify].map(q=>{
   const value=Object.hasOwn(answers,q.id)?answers[q.id]:undefined;
   const grade=typeof value==="string"?gradeTransferAnswer(q,value):{valid:false,correct:false};
   return {kind:q.kind,attempted:grade.valid,correct:grade.valid&&grade.correct};
  });
  return {id:c.id,answered:checks.filter(x=>x.attempted).length,
   correct:checks.filter(x=>x.correct).length,
   incorrect:checks.filter(x=>x.attempted&&!x.correct).length,
   justificationCorrect:checks.at(-1).correct,total:4};
 });
 return {cases:units,answered:units.reduce((a,c)=>a+c.answered,0),
  correct:units.reduce((a,c)=>a+c.correct,0),total:20};
}
