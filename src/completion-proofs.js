// Original scaffolds anchored to supplied WS26/27 sheets. Never reproduce an answer key.
export const VERIFIED_SHEETS=Object.freeze([
 Object.freeze({id:"AMP-WS2627-UE01",sheet:1,source:"Uebung_01.pdf",due:"2026-10-22T08:00:00+02:00",parts:Object.freeze(["1.1","1.2","1.3"])}),
 Object.freeze({id:"AMP-WS2627-UE02",sheet:2,source:"Uebung_02.pdf",due:"2026-10-29T08:00:00+01:00",parts:Object.freeze(["2.1","2.2","2.3"])})
]);
const P=(id,lesson,sourcePart,title,assumptions,target,steps,transfer,notice="")=>Object.freeze({
 id,lesson,sourcePart,title,assumptions,target,steps:Object.freeze(steps),transfer,notice
});
export const PROOF_SCAFFOLDS=Object.freeze([
 P("UE01-model","10","Übung 1, 1.1","SIR conservation and modelling",
 "The official S,I,R differential equations and N=S+I+R; births, deaths and compartment transfers affect the total differently.",
 "Derive an equation for the total; state model assumptions and one structural weakness.",
 ["Differentiate N before simplifying.","Group terms representing internal transfers.","Separate external births and deaths from internal changes.","Consider what additional V and T compartments would measure."],
 "Explain conservation in an original two-compartment exchange system with rate alpha."),
 P("UE01-norm","05","Übung 1, 1.2(b–d)","Norm equivalence and matrix-induced norms",
 "A vector norm satisfies definiteness, absolute homogeneity and the triangle inequality; a matrix-induced norm needs an invertible transformation.",
 "Build a proof of the norm bounds and identify how a transformed norm changes the unit boundary.",
 ["Compare the maximum component with the sum of absolute components.","Identify how dimension n enters each bound.","Explain where invertibility is required in norm definiteness.","Distinguish M(S1) from the preimage defining the norm boundary."],
 "Repeat the proof plan for a different invertible matrix, then construct a singular counterexample."),
 P("UE01-limits","10","Übung 1, 1.3","Taylor, limits and growth",
 "Apply a valid Taylor expansion and remainder or a correctly justified limit theorem; numerical graphs are evidence, not proof.",
 "Establish leading-order behavior near zero and compare fixed polynomial and exponential growth.",
 ["State domain and limiting variable.","Identify the first nonzero Taylor term.","If using l'Hospital, verify a legitimate indeterminate form.","Identify which bound holds uniformly for sufficiently large x."],
 "Use the same approach on a new smooth function and identify its leading error."),
 P("UE02-derivative","16","Übung 2, 2.1(a,c)","Relative condition and composition",
 "The local relative condition is a derivative limit when f(x) and x are nonzero. Composition/inverse formulas require further nonvanishing and regularity.",
 "Relate a derivative to a limiting relative perturbation quotient, and justify the composition and inverse rules.",
 ["Set x_tilde=x*(1+epsilon) and take a limit.","Apply the chain rule and track nonzero factors.","Check domain/derivative hypotheses for the inverse.","Check whether a finite quotient equals a derivative at the base point."],
 "For f(x)=x^2, x=1, x_tilde=2, compare the finite quotient with the local condition.",
 "EDITORIAL WARNING: Formula (2) on the supplied sheet appears to assert finite quotient equality for general x_tilde; in general this is not identical to the limiting condition. Confirm lecturer intent; do not silently change the official wording."),
 P("UE02-roots","16","Übung 2, 2.2(a)","Conditioning of a quadratic root",
 "Positive coefficients, nonnegative discriminant and a defined relative root are necessary for the stated measures.",
 "Differentiate the smaller-root formula and explain what happens near a repeated root.",
 ["Write the discriminant and the expression for the smaller root.","Differentiate separately with respect to each coefficient.","Identify the singular denominator as the roots approach equality.","Distinguish conditioning of the mathematical root from cancellation in one expression."],
 "Investigate an independent polynomial with coefficients different from the assignment."),
 P("UE02-landau","10","Übung 2, 2.3","Continuity, Lipschitz and Landau bounds",
 "Neighborhood assumptions matter; a big-O statement must specify constants and limiting neighborhoods.",
 "Relate continuity to o(1), derive Lipschitz big-O bounds and compare sum with maximum for nonnegative functions.",
 ["Translate little-o of 1 into a limit of a remainder.","Use an explicit Lipschitz constant.","Compare g+h with max(g,h) using nonnegativity.","Explain the role of positive multiplicative constants in big-O."],
 "Generalize the sum/max comparison to three nonnegative functions.")
]);
export function proofScaffoldsForLesson(lesson){return PROOF_SCAFFOLDS.filter(p=>p.lesson===lesson);}
