export default {
  "id": "contraction",
  "title": "Fixed-point contraction and a posteriori error",
  "topic": "Convergence proofs",
  "context": "Iterate g(x)=(x+2)/4 on [0,1] from x₀=0. The function maps [0,1] to [0.5,0.75] and has Lipschitz constant q=1/4. Compute x₂ and use the a posteriori error bound q/(1-q) times the most recent step length. An observed small step alone is not a convergence theorem: the invariant complete interval and q<1 are necessary hypotheses of this guarantee.",
  "assumption": "The complete interval [0,1] is invariant under g and its global Lipschitz constant is q=0.25<1.",
  "questions": [
    {
      "id": "iterate",
      "prompt": "Find the second iterate from x₀=0.",
      "code": "g(x)=(x+2)/4\nx0=0.0\nx1=g(x0)\nx2=g(x1)\nprintln(x2)",
      "output": "0.625",
      "options": [
        "0.5",
        "0.6",
        "0.625",
        "0.75"
      ],
      "correct": 2,
      "reason": "The first iterate is 0.5 and the second is (0.5+2)/4=0.625.",
      "hint": "Apply the same function twice, not once.",
      "feedback": [
        "0.5 is the first iterate.",
        "0.6 is not obtained from the formula.",
        "The first iterate is 0.5 and the second is (0.5+2)/4=0.625.",
        "0.75 is the image of the endpoint x=1."
      ]
    },
    {
      "id": "bound",
      "prompt": "Find the a posteriori error certificate for x₂.",
      "code": "q=0.25\nx1=0.5\nx2=0.625\nprintln(round(q/(1-q)*abs(x2-x1),digits=6))",
      "output": "0.041667",
      "options": [
        "0.03125",
        "0.041667",
        "0.125",
        "0.166667"
      ],
      "correct": 1,
      "reason": "Multiply the latest step length 0.125 by q/(1-q)=1/3; rounding gives 0.041667.",
      "hint": "The contraction error bound is not identical to the observed step length.",
      "feedback": [
        "This uses only q rather than q/(1-q).",
        "Multiply the latest step length 0.125 by q/(1-q)=1/3; rounding gives 0.041667.",
        "0.125 is the step length itself.",
        "0.166667 uses an incorrect factor."
      ]
    },
    {
      "id": "assumption",
      "prompt": "Verify the numerical contraction-factor condition.",
      "code": "q=1/4\nprintln(q<1)",
      "output": "true",
      "options": [
        "true",
        "false",
        "0.25",
        "nothing"
      ],
      "correct": 0,
      "reason": "The comparison is true; a valid theorem still additionally requires the invariant complete domain.",
      "hint": "The printed result is Boolean, not the factor itself.",
      "feedback": [
        "The comparison is true; a valid theorem still additionally requires the invariant complete domain.",
        "One quarter is strictly less than one.",
        "The program prints the result of a comparison.",
        "No missing-result sentinel occurs."
      ]
    }
  ]
};
