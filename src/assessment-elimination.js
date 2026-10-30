export default {
  "id": "elimination",
  "title": "Gaussian elimination and residual checking",
  "topics": [
    "arrays",
    "matrix-methods",
    "numerical-safety"
  ],
  "context": "Gaussian elimination transforms a system into a triangular one using elementary row operations. In A=[2 1;4 3] with b=[5,11], the first pivot is 2 and the multiplier for eliminating the lower coefficient is 4/2=2. Subtract twice the first row from the second, including the right-hand side. Transforming the coefficients but not the right-hand side would alter the solution set.\n\nBack-substitution gives the last unknown first, followed by the preceding one. Always check the candidate against the original system using the residual r=A*x−b. A small residual measures equation mismatch but does not automatically guarantee a small forward error in ill-conditioned systems. The two new remediation problems concern a zero pivot that requires a row exchange and a separate system's residual.",
  "invariant": "Equivalent row operations preserve exact solutions when applied consistently to the augmented system, and the original-system residual measures equation mismatch.",
  "steps": [
    {
      "label": "Step 1 · update the eliminated row's right-hand side",
      "code": "A=[2.0 1.0;4.0 3.0]\nb=[5.0,11.0]\nf=A[2,1]/A[1,1]\nb[2]-=f*b[1]\nprintln(b[2])",
      "stdout": "1.0",
      "options": [
        "0.0",
        "1.0",
        "5.0",
        "11.0"
      ],
      "correct": 1,
      "hint": "The multiplier is 2 and the update is 11−2×5.",
      "explanation": "The second right-hand side becomes 1.0, matching the corresponding row operation.",
      "feedback": [
        "The rhs update is not zero.",
        "The second right-hand side becomes 1.0, matching the corresponding row operation.",
        "Five belongs to the original first equation.",
        "Eleven is the old second right-hand side."
      ]
    },
    {
      "label": "Step 2 · calculate both unknowns",
      "code": "A=[2.0 1.0;4.0 3.0]\nb=[5.0,11.0]\nf=A[2,1]/A[1,1]\nA[2,:].-=f.*A[1,:]\nb[2]-=f*b[1]\nx2=b[2]/A[2,2]\nx1=(b[1]-A[1,2]*x2)/A[1,1]\nprintln([x1,x2])",
      "stdout": "[2.0, 1.0]",
      "options": [
        "[1.0, 2.0]",
        "[2.0, 1.0]",
        "[2.0, 2.0]",
        "[5.0, 11.0]"
      ],
      "correct": 1,
      "hint": "First solve x₂=1, then use 2x₁+x₂=5.",
      "explanation": "The triangular system yields x₂=1.0 and x₁=2.0.",
      "feedback": [
        "This reverses the unknowns.",
        "The triangular system yields x₂=1.0 and x₁=2.0.",
        "Both variables equal to two violate the equations.",
        "The rhs vector is not the solution vector."
      ]
    },
    {
      "label": "Step 3 · verify the original residual",
      "code": "A=[2.0 1.0;4.0 3.0]\nb=[5.0,11.0]\nx=[2.0,1.0]\nprintln(A*x-b)",
      "stdout": "[0.0, 0.0]",
      "options": [
        "[1.0, 0.0]",
        "[0.0, 0.0]",
        "[2.0, 1.0]",
        "[5.0, 11.0]"
      ],
      "correct": 1,
      "hint": "Multiply original A by x, then subtract original b.",
      "explanation": "A*x=[5,11], so both residual components are zero.",
      "feedback": [
        "The first equation is satisfied too.",
        "A*x=[5,11], so both residual components are zero.",
        "That vector is x, not the residual.",
        "That vector is b, which is subtracted."
      ]
    }
  ],
  "remediation": [
    {
      "label": "Remediation A · exchange rows at a zero pivot",
      "code": "A=[0.0 2.0;3.0 1.0]\nA[[1,2],:]=A[[2,1],:]\nprintln(A[1,1])",
      "stdout": "3.0",
      "options": [
        "0.0",
        "1.0",
        "2.0",
        "3.0"
      ],
      "correct": 3,
      "hint": "An entire row swap moves the original second row to the first position.",
      "explanation": "The new leading entry is 3.0 rather than the unusable zero pivot.",
      "feedback": [
        "Zero was the pivot before the swap.",
        "One is the moved row's second column.",
        "Two is the original first row's second column.",
        "The new leading entry is 3.0 rather than the unusable zero pivot."
      ]
    },
    {
      "label": "Remediation B · new two-equation residual",
      "code": "A=[1.0 2.0;3.0 4.0]\nb=[5.0,11.0]\nx=[1.0,2.0]\nprintln(A*x-b)",
      "stdout": "[0.0, 0.0]",
      "options": [
        "[1.0, 2.0]",
        "[0.0, 0.0]",
        "[5.0, 11.0]",
        "[-1.0, 1.0]"
      ],
      "correct": 1,
      "hint": "Evaluate the two row dot-products 5 and 11 before subtracting b.",
      "explanation": "The candidate satisfies both original equations, producing zero residual.",
      "feedback": [
        "This is the candidate vector rather than its residual.",
        "The candidate satisfies both original equations, producing zero residual.",
        "This is the original right-hand side, not the residual.",
        "Those mismatches are absent for this solution."
      ]
    }
  ]
};
