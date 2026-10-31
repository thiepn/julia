export default {
  "id": "euler",
  "title": "Euler method: local and global error",
  "topic": "ODE discretization",
  "context": "Solve y′(t)=2t and y(0)=0 on [0,1] by explicit Euler using h=1/4. The exact solution is t². Euler uses left-endpoint values and returns 0.75 after four steps rather than the exact value one. Since the right-hand side is independent of y, errors are not amplified by solution dependence. Bound each local truncation error by Mh²/2 with M=2, then sum four such bounds to obtain a global error certificate.",
  "assumption": "The exact solution has |y″|≤2, and f(t,y)=2t has Lipschitz constant zero with respect to y.",
  "questions": [
    {
      "id": "iterate",
      "prompt": "Compute four explicit Euler updates.",
      "code": "function euler()\n h=0.25\n y=0.0\n for j in 0:3\n  y+=h*(2*j*h)\n end\n return y\nend\nprintln(euler())",
      "output": "0.75",
      "options": [
        "0.5",
        "0.625",
        "0.75",
        "1.0"
      ],
      "correct": 2,
      "reason": "The increments 0, 0.125, 0.25 and 0.375 sum to 0.75 at the final grid point.",
      "hint": "Use the previous left endpoint in every Euler step.",
      "feedback": [
        "This omits one or more updates.",
        "0.625 is not the complete sum.",
        "The increments 0, 0.125, 0.25 and 0.375 sum to 0.75 at the final grid point.",
        "1.0 is the exact solution, not the approximation."
      ]
    },
    {
      "id": "local",
      "prompt": "Compute the local truncation error upper bound per step.",
      "code": "M=2.0\nh=0.25\nprintln(M*h^2/2)",
      "output": "0.0625",
      "options": [
        "0.03125",
        "0.0625",
        "0.125",
        "0.25"
      ],
      "correct": 1,
      "reason": "The bound |y″|≤2 implies a one-step local truncation error at most Mh²/2=2×(0.25)²/2=0.0625, before accumulating across steps.",
      "hint": "Use M h²/2 for a single step, not for the whole interval.",
      "feedback": [
        "This drops a factor in the expression.",
        "The local absolute error bound is 2×0.25²/2=0.0625.",
        "0.125 is twice the correct per-step bound.",
        "0.25 is the accumulated four-step bound."
      ]
    },
    {
      "id": "global",
      "prompt": "Compute the accumulated global error upper bound.",
      "code": "N=4\nlocal_error=0.0625\nprintln(N*local_error)",
      "output": "0.25",
      "options": [
        "0.0625",
        "0.125",
        "0.25",
        "0.5"
      ],
      "correct": 2,
      "reason": "With no amplification from previous state errors, four local errors bounded by 0.0625 sum to 0.25.",
      "hint": "The error propagation argument requires Lipschitz constant zero here.",
      "feedback": [
        "0.0625 is only one step's contribution.",
        "0.125 covers only two contributions.",
        "With no amplification from previous state errors, four local errors bounded by 0.0625 sum to 0.25.",
        "0.5 doubles the proven bound."
      ]
    }
  ]
};
