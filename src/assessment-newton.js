export default {
  "id": "newton",
  "title": "Newton iteration and stopping conditions",
  "topics": [
    "functions",
    "root-finding",
    "numerical-safety"
  ],
  "context": "Newton's method linearizes a nonlinear equation near the current iterate. For f(x)=x²−2, the update x_new=x−(x²−2)/(2x) uses both the residual and derivative at x. Starting at 1.5, the residual is 0.25 and the derivative is 3, giving the next iterate about 1.416667. The update is undefined when x=0 because the derivative vanishes.\n\nA successful step is not a proof of convergence from arbitrary initial points. Check the change in absolute residual for this particular input, and distinguish a residual test from a step-size test. A production numerical method should document tolerance, iteration cap, derivative-zero handling and stagnation behavior. The two original remediation problems guard a zero derivative and check a separate step-size stopping condition.",
  "invariant": "A Newton step requires a nonzero derivative. A smaller residual on a particular iteration is observed evidence, not a guarantee of global convergence.",
  "steps": [
    {
      "label": "Step 1 · evaluate the derivative",
      "code": "x=1.5\nprintln(2*x)",
      "stdout": "3.0",
      "options": [
        "1.5",
        "2.0",
        "3.0",
        "4.0"
      ],
      "correct": 2,
      "hint": "For f(x)=x²−2, the derivative is 2x evaluated at the present guess.",
      "explanation": "The derivative at 1.5 is 2×1.5=3.0.",
      "feedback": [
        "The starting point is not its derivative.",
        "Two is the coefficient before evaluation.",
        "The derivative at 1.5 is 2×1.5=3.0.",
        "Four does not equal the derivative at 1.5."
      ]
    },
    {
      "label": "Step 2 · one Newton update",
      "code": "x=1.5\nnext=x-(x^2-2)/(2*x)\nprintln(round(next,digits=6))",
      "stdout": "1.416667",
      "options": [
        "1.333333",
        "1.414214",
        "1.416667",
        "1.5"
      ],
      "correct": 2,
      "hint": "Divide residual 0.25 by derivative 3 before subtracting.",
      "explanation": "The new iterate is 1.5−0.25/3=1.416667 to six digits.",
      "feedback": [
        "The correction in this choice is too large.",
        "1.414214 is closer to a later Newton iterate.",
        "The new iterate is 1.5−0.25/3=1.416667 to six digits.",
        "The current iterate must change because the residual is nonzero."
      ]
    },
    {
      "label": "Step 3 · check improvement of residual",
      "code": "x=1.5\nnext=x-(x^2-2)/(2*x)\nprintln(abs(next^2-2)<abs(x^2-2))",
      "stdout": "true",
      "options": [
        "true",
        "false",
        "0.25",
        "nothing"
      ],
      "correct": 0,
      "hint": "Compare the two residual magnitudes before and after the update.",
      "explanation": "The residual decreases for this starting point, so the strict comparison is true.",
      "feedback": [
        "The residual decreases for this starting point, so the strict comparison is true.",
        "The next residual is smaller than the initial one.",
        "The script prints a Boolean rather than 0.25.",
        "No guard in this snippet returns a sentinel."
      ]
    }
  ],
  "remediation": [
    {
      "label": "Remediation A · guard a zero derivative",
      "code": "function guarded(x)\n x==0&&return nothing\n return x-(x^2-2)/(2*x)\nend\nprintln(guarded(0.0))",
      "stdout": "nothing",
      "options": [
        "0.0",
        "nothing",
        "NaN",
        "Inf"
      ],
      "correct": 1,
      "hint": "For x=0, the derivative 2x vanishes and the guard executes.",
      "explanation": "The guard returns nothing before the Newton division is attempted.",
      "feedback": [
        "Zero is an invalid input, not the returned iterate.",
        "The guard returns nothing before the Newton division is attempted.",
        "The check exits before producing NaN.",
        "The check exits before producing infinity."
      ]
    },
    {
      "label": "Remediation B · check a step-size condition",
      "code": "x=1.5\nnext=x-(x^2-2)/(2*x)\nprintln(abs(next-x)<0.1)",
      "stdout": "true",
      "options": [
        "true",
        "false",
        "0.1",
        "0.25"
      ],
      "correct": 0,
      "hint": "The step magnitude is 0.25/3, around 0.083333.",
      "explanation": "The step is less than one tenth, so the comparison prints true.",
      "feedback": [
        "The step is less than one tenth, so the comparison prints true.",
        "The step magnitude is below the specified threshold.",
        "The output is a Boolean, not the tolerance value.",
        "0.25 is the residual at the old iterate, not its step size."
      ]
    }
  ]
};
