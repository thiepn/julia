export default {
  "id": "quadrature",
  "title": "Composite integration and error",
  "topics": [
    "loops",
    "vector-scans",
    "numerical-safety"
  ],
  "context": "A composite trapezoid approximates a definite integral using endpoint half-weights and full interior weights. Its result is a weighted sum multiplied by the interval spacing h=(b−a)/n. For f(x)=x² on [0,2], the exact integral is 8/3, providing independent mathematical evidence to judge the approximation. First trace the coarse mesh, then refine it, then calculate its error against the exact result. Do not confuse agreement between two approximations with proof of correctness.\n\nFor a smooth integrand, composite trapezoidal error often scales as h², so halving the spacing can reduce the error by about a factor of four. This asymptotic rule does not mean a finite mesh integrates the parabola exactly. The two genuinely different remediation tasks change both the integrand and quadrature rule to check whether the idea transfers.",
  "invariant": "An estimate and an independently known exact integral must remain distinct. The quadrature rule itself cannot certify its own absolute error without additional mathematical information.",
  "steps": [
    {
      "label": "Step 1 · coarse trapezoidal mesh",
      "code": "function trap(n)\n h=2.0/n\n s=2.0\n for k in 1:n-1\n  s+=(k*h)^2\n end\n return h*s\nend\nprintln(trap(2))",
      "stdout": "3.0",
      "options": [
        "2.0",
        "2.5",
        "3.0",
        "4.0"
      ],
      "correct": 2,
      "hint": "The interior x=1 contributes 1, while the endpoints together contribute 2.",
      "explanation": "The h=1 weighted sum is 2+1=3, hence the printed estimate 3.0.",
      "feedback": [
        "2.0 is the interval width, not the integral estimate.",
        "2.5 is the midpoint-rule result for this mesh.",
        "The h=1 weighted sum is 2+1=3, hence the printed estimate 3.0.",
        "4.0 omits the endpoint half weights."
      ]
    },
    {
      "label": "Step 2 · refined mesh",
      "code": "function trap(n)\n h=2.0/n\n s=2.0\n for k in 1:n-1\n  s+=(k*h)^2\n end\n return h*s\nend\nprintln(trap(4))",
      "stdout": "2.75",
      "options": [
        "2.5",
        "2.75",
        "3.0",
        "3.25"
      ],
      "correct": 1,
      "hint": "Use h=0.5 and the interior positions 0.5, 1.0, 1.5.",
      "explanation": "The weighted sum is 2+0.25+1+2.25=5.5; multiplying by 0.5 gives 2.75.",
      "feedback": [
        "This is the midpoint estimate, not the trapezoid estimate.",
        "The weighted sum is 2+0.25+1+2.25=5.5; multiplying by 0.5 gives 2.75.",
        "3.0 was the coarse-mesh estimate.",
        "3.25 uses the incorrect total contribution."
      ]
    },
    {
      "label": "Step 3 · measured error",
      "code": "estimate=2.75\nexact=8/3\nprintln(round(abs(estimate-exact),digits=6))",
      "stdout": "0.083333",
      "options": [
        "0.0",
        "0.083333",
        "0.25",
        "0.333333"
      ],
      "correct": 1,
      "hint": "Subtract the exact integral, not the preceding coarse estimate.",
      "explanation": "The error equals |2.75−8/3|=1/12, rounded to six decimal places.",
      "feedback": [
        "The finite trapezoidal rule is not exact for x².",
        "The error equals |2.75−8/3|=1/12, rounded to six decimal places.",
        "This is not the difference from the exact integral.",
        "0.333333 is the larger coarse-grid error."
      ]
    }
  ],
  "remediation": [
    {
      "label": "Remediation A · different integrand, linear function",
      "code": "function linear_area()\n h=1.0\n weighted=0.5*(1.0+5.0)+3.0\n return h*weighted\nend\nprintln(linear_area())",
      "stdout": "6.0",
      "options": [
        "4.0",
        "5.0",
        "6.0",
        "8.0"
      ],
      "correct": 2,
      "hint": "Use endpoints 1 and 5 and interior sample 3 for f(x)=2x+1.",
      "explanation": "A trapezoid integrates an affine function exactly; its weighted sum is 6.0.",
      "feedback": [
        "Four omits part of the integral.",
        "Five undercounts the interior contribution.",
        "A trapezoid integrates an affine function exactly; its weighted sum is 6.0.",
        "Eight double counts a sample."
      ]
    },
    {
      "label": "Remediation B · use a different quadrature rule",
      "code": "function midpoint_square()\n total=0.0\n for i in 1:2\n  total+=(i-0.5)^2\n end\n return total\nend\nprintln(midpoint_square())",
      "stdout": "2.5",
      "options": [
        "2.0",
        "2.5",
        "2.75",
        "3.0"
      ],
      "correct": 1,
      "hint": "Use midpoint samples 0.5 and 1.5, not cell endpoints.",
      "explanation": "The sum 0.5²+1.5²=2.5 differs from both trapezoidal estimates.",
      "feedback": [
        "Two omits some midpoint area.",
        "The sum 0.5²+1.5²=2.5 differs from both trapezoidal estimates.",
        "2.75 belongs to the refined trapezoidal method.",
        "3.0 belongs to the coarse trapezoidal method."
      ]
    }
  ]
};
