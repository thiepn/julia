export default {
  "id": "power",
  "title": "Power iteration: spectral gap and convergence",
  "topic": "Eigenvalue algorithms",
  "context": "Apply power iteration to the diagonal matrix A=diag(4,1), starting from [1,1] and normalizing after each multiplication by the first component. The dominant eigenvector is [1,0]. The ratio of subdominant to dominant eigenvalue magnitude is 1/4, so the unwanted component shrinks geometrically at each successful normalized step. The convergence argument assumes a unique dominant eigenvalue and a nonzero starting component in its eigenvector direction.",
  "assumption": "The dominant eigenvalue is simple in magnitude, |λ₂/λ₁|<1, and the initial dominant eigenvector coefficient is nonzero.",
  "questions": [
    {
      "id": "vector",
      "prompt": "Compute the normalized vector after two power steps.",
      "code": "function power2()\n x=[1.0,1.0]\n for k in 1:2\n  v=[4*x[1],x[2]]\n  x=v./v[1]\n end\n return x\nend\nprintln(power2())",
      "output": "[1.0, 0.0625]",
      "options": [
        "[1.0, 0.25]",
        "[1.0, 0.0625]",
        "[4.0, 1.0]",
        "[1.0, 0.5]"
      ],
      "correct": 1,
      "reason": "The first normalized result is [1,0.25], and the second is [1,0.0625].",
      "hint": "The secondary component is divided by four in each normalized iteration.",
      "feedback": [
        "This is the output of only one iteration.",
        "The first normalized result is [1,0.25], and the second is [1,0.0625].",
        "That is unnormalized rather than after two steps.",
        "The secondary component does not halve on each step."
      ]
    },
    {
      "id": "third",
      "prompt": "Compute the relative unwanted component after three steps.",
      "code": "ratio=1.0/4.0\nprintln(ratio^3)",
      "output": "0.015625",
      "options": [
        "0.00390625",
        "0.015625",
        "0.0625",
        "0.25"
      ],
      "correct": 1,
      "reason": "The relative second component is multiplied by 1/4 on each iteration, giving 1/64 after three.",
      "hint": "The spectral-gap ratio controls geometric decay in this diagonal example.",
      "feedback": [
        "This is the fourth-step result.",
        "The relative second component is multiplied by 1/4 on each iteration, giving 1/64 after three.",
        "This is the second-step ratio.",
        "This is the first-step ratio."
      ]
    },
    {
      "id": "gap",
      "prompt": "Check the strict spectral-gap inequality.",
      "code": "dominant=4.0\nother=1.0\nprintln(abs(other/dominant)<1)",
      "output": "true",
      "options": [
        "true",
        "false",
        "0.25",
        "nothing"
      ],
      "correct": 0,
      "reason": "The ratio is one quarter and the comparison is true, though a bad starting vector can still fail.",
      "hint": "Compare eigenvalue magnitudes, not their algebraic signs.",
      "feedback": [
        "The ratio is one quarter and the comparison is true, though a bad starting vector can still fail.",
        "0.25 is strictly less than one.",
        "The ratio is not greater than or equal to one.",
        "The output is a Boolean comparison, not the ratio."
      ]
    }
  ]
};
