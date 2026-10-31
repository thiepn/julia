export default {
  "id": "conditioning",
  "title": "Diagonal conditioning and perturbation bounds",
  "topic": "Linear algebra sensitivity",
  "context": "For A=diag(1,0.01), the infinity-norm condition number is 100. The original right-hand side [1,0.01] gives solution [1,1]. Perturb the smaller right-hand-side entry by 0.0001 and calculate its effect on the second solution component. Compare the relative solution change to the relative input change, both measured using infinity norms. This example attains the condition-number bound for the selected perturbation, but arbitrary perturbations need not attain it.",
  "assumption": "A is invertible, b and x are nonzero and the same infinity norm is used for both relative-change comparisons.",
  "questions": [
    {
      "id": "kappa",
      "prompt": "Compute the infinity-norm matrix condition number.",
      "code": "using LinearAlgebra\nA=[1.0 0.0;0.0 0.01]\nprintln(norm(A,Inf)*norm(inv(A),Inf))",
      "output": "100.0",
      "options": [
        "1.0",
        "10.0",
        "100.0",
        "10000.0"
      ],
      "correct": 2,
      "reason": "For this diagonal matrix, the infinity norms of A and its inverse are 1 and 100, respectively.",
      "hint": "The condition number multiplies the matrix and inverse norms.",
      "feedback": [
        "One would describe a perfectly conditioned matrix.",
        "Ten understates the inverse norm.",
        "For this diagonal matrix, the infinity norms of A and its inverse are 1 and 100, respectively.",
        "Ten thousand incorrectly squares the amplification."
      ]
    },
    {
      "id": "solution",
      "prompt": "Solve the perturbed second equation.",
      "code": "b2=0.01+0.0001\nprintln(round(b2/0.01,digits=4))",
      "output": "1.01",
      "options": [
        "1.0",
        "1.001",
        "1.01",
        "1.1"
      ],
      "correct": 2,
      "reason": "The perturbed second component is 0.0101 and division by 0.01 gives 1.01.",
      "hint": "A diagonal system divides each right-hand side by its diagonal coefficient.",
      "feedback": [
        "This ignores the input perturbation.",
        "1.001 is too small a change.",
        "The perturbed second component is 0.0101 and division by 0.01 gives 1.01.",
        "1.1 corresponds to a much larger input perturbation."
      ]
    },
    {
      "id": "factor",
      "prompt": "Compute the actual relative error-amplification ratio.",
      "code": "relative_x=0.01/1.0\nrelative_b=0.0001/1.0\nprintln(round(relative_x/relative_b,digits=1))",
      "output": "100.0",
      "options": [
        "1.0",
        "10.0",
        "100.0",
        "1000.0"
      ],
      "correct": 2,
      "reason": "The relative output change 0.01 divided by the relative input change 0.0001 equals 100.",
      "hint": "Use the unperturbed infinity norms of the original b and x, both equal to one.",
      "feedback": [
        "One would imply no relative amplification.",
        "Ten understates this perturbation's sensitivity.",
        "The relative output change 0.01 divided by the relative input change 0.0001 equals 100.",
        "One thousand exceeds the computed amplification."
      ]
    }
  ]
};
