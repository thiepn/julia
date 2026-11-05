export default {
  "id": "stability",
  "title": "Catastrophic cancellation and stable formulas",
  "topics": [
    "types",
    "numerical-safety",
    "contracts"
  ],
  "context": "Floating-point evaluation does not always preserve algebraic identities from real arithmetic. In Float64, the perturbation 1e−16 is too small to change the stored value 1.0. The expression (sqrt(1+x)−1)/x therefore subtracts two rounded equal numbers and returns zero for this x, even though the mathematical limit at x=0 is one half. The relative error is huge because crucial information disappeared before division.\n\nRationalization gives 1/(sqrt(1+x)+1) for nonzero x where the original expression is defined. This form avoids subtracting nearly equal numbers and retains the correct limiting value in the example. The remediation uses specialized logarithmic and exponential functions on an entirely different operation to test transfer of the same numerical principle.",
  "invariant": "A numerically stable formula avoids destroying a small significant difference by subtraction of rounded nearly equal values. Equality in exact arithmetic is not enough to guarantee identical floating-point behavior.",
  "steps": [
    {
      "label": "Step 1 · lose the perturbation in Float64",
      "code": "x=1e-16\nprintln(1.0+x==1.0)",
      "stdout": "true",
      "options": [
        "true",
        "false",
        "1.0",
        "nothing"
      ],
      "correct": 0,
      "hint": "Compare the small perturbation to Float64 precision near one.",
      "explanation": "The stored sum rounds back to one, so the equality comparison is true.",
      "feedback": [
        "The stored sum rounds back to one, so the equality comparison is true.",
        "The mathematical real sum differs, but the rounded result does not.",
        "The equality operation prints Boolean rather than a float.",
        "No missing-value sentinel is present."
      ]
    },
    {
      "label": "Step 2 · evaluate naive cancellation",
      "code": "x=1e-16\nnaive=(sqrt(1.0+x)-1.0)/x\nprintln(naive)",
      "stdout": "0.0",
      "options": [
        "0.0",
        "0.5",
        "1.0",
        "Inf"
      ],
      "correct": 0,
      "hint": "The square-root input has already become one after rounding.",
      "explanation": "The subtraction returns exactly zero, then division by nonzero x returns 0.0.",
      "feedback": [
        "The subtraction returns exactly zero, then division by nonzero x returns 0.0.",
        "One half is the limiting real value, not this naive result.",
        "One is the rounded square-root value before subtracting.",
        "The denominator is tiny but not zero."
      ]
    },
    {
      "label": "Step 3 · evaluate the rationalized identity",
      "code": "x=1e-16\nstable=1/(sqrt(1.0+x)+1)\nprintln(stable)",
      "stdout": "0.5",
      "options": [
        "0.0",
        "0.5",
        "1.0",
        "2.0"
      ],
      "correct": 1,
      "hint": "The denominator is approximately two without a small difference of near-equals.",
      "explanation": "The stable computation gives 1/(1+1)=0.5 for this rounded input.",
      "feedback": [
        "The stable form has no canceled numerator.",
        "The stable computation gives 1/(1+1)=0.5 for this rounded input.",
        "One is the rounded square-root term, not the result.",
        "Two is the denominator rather than its reciprocal."
      ]
    }
  ],
  "remediation": [
    {
      "label": "Remediation A · log1p retains a tiny increment",
      "code": "x=1e-16\nprintln(log(1+x)==0.0)\nprintln(log1p(x)>0.0)",
      "stdout": "true\ntrue",
      "options": [
        "true\nfalse",
        "false\ntrue",
        "true\ntrue",
        "false\nfalse"
      ],
      "correct": 2,
      "hint": "Ordinary log loses the increment when computing 1+x; log1p preserves it.",
      "explanation": "log(1+x) evaluates to zero while log1p(x) remains positive.",
      "feedback": [
        "The specialized function does retain a positive value.",
        "Ordinary log sees a rounded argument of one.",
        "log(1+x) evaluates to zero while log1p(x) remains positive.",
        "Both claims conflict with this particular small input."
      ]
    },
    {
      "label": "Remediation B · expm1 preserves a tiny difference",
      "code": "x=1e-16\nprintln(exp(x)-1==0.0)\nprintln(expm1(x)>0.0)",
      "stdout": "true\ntrue",
      "options": [
        "false\ntrue",
        "true\ntrue",
        "true\nfalse",
        "false\nfalse"
      ],
      "correct": 1,
      "hint": "Compare the ordinary subtraction with the small-argument specialized function.",
      "explanation": "exp(x)−1 rounds to zero, while expm1(x) still returns a positive tiny number.",
      "feedback": [
        "The ordinary subtraction does round to zero.",
        "exp(x)−1 rounds to zero, while expm1(x) still returns a positive tiny number.",
        "The specialized function returns a positive value.",
        "The two expressions do not both fail to preserve the increment."
      ]
    }
  ]
};
