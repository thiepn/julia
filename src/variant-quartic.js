export default {
  "id": "quartic",
  "title": "Composite trapezoids: certified error",
  "topic": "Numerical integration and error bounds",
  "context": "Estimate the integral of x⁴ over [-1,1] by four equal trapezoids. The exact integral is 2/5. The classic error theorem requires a continuous second derivative and a global upper bound M on its magnitude. Here f″(x)=12x² and M=12. Report the numerical result, its measured error and the rigorous theorem-based bound, distinguishing all three quantities.",
  "assumption": "f is twice continuously differentiable on the whole interval and the bound M=12 applies everywhere, not only at sample points.",
  "questions": [
    {
      "id": "estimate",
      "prompt": "Compute four equal trapezoids for x⁴ on [-1,1].",
      "code": "function approximate()\n xs=-1.0:0.5:1.0\n ys=[x^4 for x in xs]\n return 0.5*(sum(ys)-(first(ys)+last(ys))/2)\nend\nprintln(approximate())",
      "output": "0.5625",
      "options": [
        "0.4",
        "0.5",
        "0.5625",
        "0.625"
      ],
      "correct": 2,
      "reason": "The endpoint-adjusted weighted sum is 1.125, so h=0.5 gives the estimate 0.5625.",
      "hint": "Half-weight both endpoints and use full weight at interior points.",
      "feedback": [
        "0.4 is the exact integral, not this estimate.",
        "0.5 omits some weighted contributions.",
        "The endpoint-adjusted weighted sum is 1.125, so h=0.5 gives the estimate 0.5625.",
        "0.625 overcounts part of the area."
      ]
    },
    {
      "id": "error",
      "prompt": "Compare the estimate with the exact integral.",
      "code": "println(round(abs(0.5625-2/5),digits=4))",
      "output": "0.1625",
      "options": [
        "0.0",
        "0.0625",
        "0.1625",
        "0.5"
      ],
      "correct": 2,
      "reason": "The true absolute error is |0.5625-0.4|=0.1625, using the independently known integral.",
      "hint": "Do not substitute the theoretical upper bound for the observed error.",
      "feedback": [
        "The finite rule is not exact for this quartic.",
        "0.0625 is too small for the measured difference.",
        "The true absolute error is |0.5625-0.4|=0.1625, using the independently known integral.",
        "0.5 is a valid upper bound, not the measured error."
      ]
    },
    {
      "id": "bound",
      "prompt": "Evaluate the standard composite trapezoidal error bound.",
      "code": "interval=2.0\nh=0.5\nM=12.0\nprintln(interval*h^2*M/12)",
      "output": "0.5",
      "options": [
        "0.125",
        "0.1625",
        "0.5",
        "1.0"
      ],
      "correct": 2,
      "reason": "The theorem yields (b-a)Mh²/12=2×12×0.25/12=0.5; it is conservative but valid.",
      "hint": "Use the maximum of |f″| over the entire interval.",
      "feedback": [
        "0.125 omits factors from the global theorem.",
        "0.1625 is the actual error rather than the generic bound.",
        "The theorem yields (b-a)Mh²/12=2×12×0.25/12=0.5; it is conservative but valid.",
        "1.0 is twice the calculated bound."
      ]
    }
  ]
};
