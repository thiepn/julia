export default {
  "id": "bracketing",
  "title": "Bisection brackets and error bounds",
  "topics": [
    "conditions",
    "loops",
    "root-finding"
  ],
  "context": "Bisection requires a continuous function and an initial interval whose endpoint signs differ, or an explicitly detected endpoint root. The midpoint partitions the interval, and the sign test retains the half containing a root. For f(x)=x²−2 over [1,2], the method brackets sqrt(2) without evaluating the root's decimal representation. The first two steps trace the midpoint and its corresponding updated bracket.\n\nAfter k successful halvings, the interval width is the original width divided by 2^k. The midpoint is at most half this remaining width from a root inside the bracket. The width bound differs from a residual bound on |f(m)|. The remediation asks whether a different function even permits bisection on a supplied interval, then calculates a step count using logarithms.",
  "invariant": "A correctly initialized sign-changing bracket retains a root after every valid update. A width W implies a midpoint distance at most W/2 from the bracketed root.",
  "steps": [
    {
      "label": "Step 1 · first midpoint",
      "code": "a,b=1.0,2.0\nprintln((a+b)/2)",
      "stdout": "1.5",
      "options": [
        "1.0",
        "1.25",
        "1.5",
        "2.0"
      ],
      "correct": 2,
      "hint": "Compute the arithmetic mean of 1.0 and 2.0.",
      "explanation": "The first midpoint is (1+2)/2=1.5; no endpoint has been updated.",
      "feedback": [
        "1.0 is the lower endpoint.",
        "1.25 is from a later subinterval.",
        "The first midpoint is (1+2)/2=1.5; no endpoint has been updated.",
        "2.0 is the upper endpoint."
      ]
    },
    {
      "label": "Step 2 · retain the root-containing half",
      "code": "a,b=1.0,2.0\nm=(a+b)/2\nif m^2>2\n b=m\nelse\n a=m\nend\nprintln(b-a)",
      "stdout": "0.5",
      "options": [
        "0.25",
        "0.5",
        "1.0",
        "1.5"
      ],
      "correct": 1,
      "hint": "Since 1.5² exceeds 2, the upper endpoint becomes 1.5.",
      "explanation": "The new bracket [1.0,1.5] has width 0.5.",
      "feedback": [
        "0.25 would require another halving.",
        "The new bracket [1.0,1.5] has width 0.5.",
        "1.0 is the original width.",
        "1.5 is the new upper endpoint."
      ]
    },
    {
      "label": "Step 3 · midpoint uncertainty after four halvings",
      "code": "width=1.0/2.0^4\nprintln(width/2)",
      "stdout": "0.03125",
      "options": [
        "0.5",
        "0.0625",
        "0.03125",
        "0.125"
      ],
      "correct": 2,
      "hint": "Divide the original width by 16, then halve that width.",
      "explanation": "A width 1/16 implies a midpoint error at most 1/32=0.03125.",
      "feedback": [
        "A bound of 0.5 ignores all refinements.",
        "0.0625 is the full width, not half of it.",
        "A width 1/16 implies a midpoint error at most 1/32=0.03125.",
        "0.125 corresponds to fewer halvings."
      ]
    }
  ],
  "remediation": [
    {
      "label": "Remediation A · test a different invalid bracket",
      "code": "f(x)=x^2+1\nprintln(f(-1.0)*f(1.0)<0)",
      "stdout": "false",
      "options": [
        "true",
        "false",
        "0.0",
        "nothing"
      ],
      "correct": 1,
      "hint": "x²+1 is positive at both supplied endpoints.",
      "explanation": "Their product is positive, so the strict sign-change condition is false.",
      "feedback": [
        "Continuity does not guarantee a sign change.",
        "Their product is positive, so the strict sign-change condition is false.",
        "The result is a Boolean comparison.",
        "No sentinel return appears in this program."
      ]
    },
    {
      "label": "Remediation B · compute required iterations",
      "code": "width=2.0\nlimit=0.125\nprintln(ceil(Int,log2(width/limit)))",
      "stdout": "4",
      "options": [
        "2",
        "3",
        "4",
        "5"
      ],
      "correct": 2,
      "hint": "Calculate width/limit=16 and log₂(16).",
      "explanation": "Four halvings reduce interval width 2 to the target 0.125.",
      "feedback": [
        "Two halvings leave 0.5.",
        "Three halvings leave 0.25.",
        "Four halvings reduce interval width 2 to the target 0.125.",
        "Five is not the minimum required count."
      ]
    }
  ]
};
