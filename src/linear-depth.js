// Original AMP transfer after Gaussian elimination, QR and least squares.
// Contracts use the existing Julia draft and existing source-based test exporter.
const T=(id,lesson,title,concept,starter,steps,question,source,checks)=>Object.freeze({
 id,lesson,title,concept,starter,steps:Object.freeze(steps),question,source,
 checks:Object.freeze(checks.map(([name,assertion])=>Object.freeze({name,assertion})))
});
export const LINEAR_TRACKS=Object.freeze({
 pivoted_lr:T("pivoted_lr","12","Pivoted LR: row permutations are part of the factorization",
 "Partial pivoting generally produces P*A=L*U, with the row permutation explicitly recorded. In Julia, A[F.p,:] ≈ F.L*F.U for F=lu(A). Test the reconstructed matrix, not hard-coded permutation indices.",
 "using LinearAlgebra\nfunction pivoted_lr(A)\n    # Return (p=..., L=..., U=...) for the row-permuted matrix.\n    # Assume an invertible square real matrix.\nend",
 ["Explain why an unpivoted first step can fail at a zero leading entry.","Use lu(A), inspect F.p, F.L and F.U.","Test A[F.p,:] ≈ L*U on unseen 2×2 and 3×3 matrices.","Check that the returned factors retain triangular structure."],
 "If the first pivot is zero, why can a row swap preserve the original linear system?",
 "Original transfer from lessons 12–13, Julia LinearAlgebra LU reference",[
 ["row swap","@test begin A=[0. 2.;1. 3.]; F=pivoted_lr(A); norm(A[F.p,:]-F.L*F.U)<1e-12 end"],
 ["three by three","@test begin A=[2. 1. 0.; 4. 3. 1.; 0. 2. 4.]; F=pivoted_lr(A); norm(A[F.p,:]-F.L*F.U)<1e-10 end"],
 ["triangular factors","@test begin A=[0. 1.; 3. 2.]; F=pivoted_lr(A); norm(tril(F.U,-1))<1e-12 && norm(triu(F.L,1))<1e-12 end"],
 ["distinct inputs","@test begin A=[3. 1.; 1. 2.]; F=pivoted_lr(A); norm(A[F.p,:]-F.L*F.U)<1e-12 end"]
 ]),
 qr_fit:T("qr_fit","15","QR least squares: implement and certify a fit",
 "For an n×2 full-column-rank design matrix A=[1 t], QR reduces least squares to a triangular solve. The optimum residual r=A*c-y satisfies A'*r≈0, even when the residual is nonzero.",
 "using LinearAlgebra\nfunction fit_qr(t,y)\n    # Return (coefficients=..., residual=..., orthogonality=...).\n    # Assume matching vectors, length >= 3, and nonconstant t.\nend",
 ["Build the n×2 design matrix for unfamiliar t and y.","Use qr(A) or A\\y, not inv(A'*A)*(A'*y).","Return the computed coefficients and ||A*c-y||₂.","Verify A'*(A*c-y)≈0 for a noisy dataset."],
 "Why can the least-squares residual be nonzero even when A'*(A*c-y)=0?",
 "Original independent transfer from lessons 14–15, Julia LinearAlgebra QR/least squares",[
 ["exact nonstandard line","@test begin r=fit_qr([-2.,0.,3.,4.],[-5.,-1.,5.,7.]); r.coefficients≈[-1.,2.] && r.residual<1e-10 end"],
 ["noisy data","@test begin r=fit_qr([0.,1.,2.,3.],[1.,3.,4.,8.]); r.orthogonality<1e-10 && r.residual>0.1 end"],
 ["column orthogonality","@test begin t=[-3.,-1.,1.,4.]; y=[2.,3.,4.,7.]; r=fit_qr(t,y); A=hcat(ones(length(t)),t); norm(A'*(A*r.coefficients-y))<1e-10 end"],
 ["arbitrary t","@test begin t=[5.,8.,11.,14.]; y=[3.,6.,9.,12.]; r=fit_qr(t,y); r.coefficients≈[-2.,1.] end"]
 ]),
 rank_aware_fit:T("rank_aware_fit","15","Rank-aware least squares and shape validation",
 "For an n×p real matrix with n≥p and full column rank, a unique least-squares minimizer exists. With dependent columns, many minimizers can have the same fitted values. Return nothing rather than pretending coefficients are unique.",
 "using LinearAlgebra\nfunction fit_rank_aware(A,b)\n    # Return nothing for invalid shapes or rank-deficient columns.\n    # Otherwise return (coefficients=..., residual=...).\nend",
 ["Check size(A,1), size(A,2) and length(b) before solving.","Detect rank(A)<size(A,2); do not use det(A'*A).","Use a QR-based solve and compute the original residual.","Test full rank, repeated columns, mismatched b and wide matrices."],
 "Why does a minimal residual not imply a unique coefficient vector?",
 "Original independent transfer from Julia LinearAlgebra rank and lesson 15",[
 ["full column rank","@test begin A=[1. 0.; 1. 1.; 1. 3.; 1. 4.]; r=fit_rank_aware(A,[2.,4.,8.,10.]); r!==nothing && r.coefficients≈[2.,2.] && r.residual<1e-10 end"],
 ["dependent columns","@test fit_rank_aware([1. 2.; 2. 4.; 3. 6.],[1.,2.,3.])===nothing"],
 ["incompatible response","@test fit_rank_aware([1. 0.; 0. 1.; 1. 1.],[1.,2.])===nothing"],
 ["wide input","@test fit_rank_aware([1. 0. 0.; 0. 1. 0.],[1.,2.])===nothing"]
 ])
});
const P=(id,lesson,sourcePart,title,assumptions,target,steps,transfer)=>Object.freeze({
 id,lesson,sourcePart,title,assumptions,target,steps:Object.freeze(steps),transfer,notice:""
});
export const LINEAR_PROOFS=Object.freeze([
 P("B-pivot","12","Independent extension of Gaussian elimination","Row permutations in LR",
 "A square nonsingular matrix and a factorization computed using partial pivoting.",
 "Show why applying recorded row swaps gives P*A=L*U and why solving via the factors reconstructs the original system.",
 ["Track the first row permutation as a matrix multiplication.","Express each elimination multiplier in L.","Relate the row-permuted right-hand side P*b to triangular solves.","Explain why pivoting does not change the unknown vector."],
 "Use a 3×3 example where the first pivot vanishes."),
 P("B-qr","14","Independent extension of QR factorization","QR and orthogonal projection",
 "A real n×p matrix with independent columns; Q has orthonormal columns and R is invertible upper triangular.",
 "Derive the least-squares normal equations and show how QR reduces them to R*c=Q'*y without forming A'*A.",
 ["Write the residual y-Q*R*c.","Apply Q' to the residual and derive orthogonality.","Use Q'Q=I to isolate the triangular system.","Explain the residual component perpendicular to the column space."],
 "Apply the derivation to a rectangular 4×2 design matrix."),
 P("B-normal","15","Independent extension of least squares","Condition of the normal equations",
 "A has full column rank; the spectral condition numbers use the 2-norm.",
 "Prove κ₂(A'*A)=κ₂(A)² in exact arithmetic and explain why this makes the normal equations fragile in finite precision.",
 ["Use singular values σᵢ(A)>0.","Identify the eigenvalues of A'*A as σᵢ².","Take the ratio of largest and smallest singular values.","Distinguish exact equivalence from floating-point reliability."],
 "Choose two nearly dependent columns and compare QR with normal equations.")
]);
const X=(id,lesson,title,intent,lines)=>Object.freeze({id,lesson,title,intent,code:lines.join("\n")});
export const LINEAR_EXPERIMENTS=Object.freeze({
 pivoted_lr:X("pivoted_lr","12","Real Julia pivoted LR for a zero first pivot",
 "Inspect row permutations, triangular reconstruction and solves without assuming the first diagonal is nonzero.",[
 "using LinearAlgebra, Test",
 "for A in ([0.0 2.0;1.0 3.0], [2.0 1.0 0.0;4.0 3.0 1.0;0.0 2.0 4.0])",
 "    F=lu(A)",
 "    residual=norm(A[F.p,:]-F.L*F.U)",
 "    @test residual < 1e-10",
 "    b=ones(size(A,1))",
 "    @test norm(A*(A\\b)-b)<1e-10",
 "    println((permutation=F.p,reconstruction=residual))",
 "end"
 ]),
 qr_orthogonality:X("qr_orthogonality","14","Real Julia QR with a rectangular design",
 "Verify Q'Q≈I, A≈Q*R and orthogonality of the least-squares residual using actual Julia LinearAlgebra.",[
 "using LinearAlgebra, Test",
 "A=[1.0 -2.0;1.0 -1.0;1.0 1.0;1.0 3.0]",
 "y=[-2.0,0.0,2.5,7.0]",
 "F=qr(A)",
 "Q=Matrix(F.Q)[:,1:size(A,2)]",
 "R=Matrix(F.R)",
 "c=F\\y",
 "residual=A*c-y",
 "@test norm(A-Q*R)<1e-12",
 "@test norm(Q'*Q-I)<1e-12",
 "@test norm(A'*residual)<1e-11",
 "println((coefficients=c,residual=norm(residual),orthogonality=norm(A'*residual)))"
 ]),
 normal_equations:X("normal_equations","15","Real Julia QR versus normal equations near rank loss",
 "Inspect the condition growth of A'*A. A failing normal-equation solve is evidence about this numerical representation, not mathematical nonuniqueness.",[
 "using LinearAlgebra, Test",
 "t=1.0 .+ (0:3).*1e-8",
 "y=3.0 .+ (0:3).*2e-8",
 "A=hcat(ones(length(t)),t)",
 "@test rank(A)==2",
 "c=qr(A)\\y",
 "@test norm(A*c-y)<1e-7",
 "println((condition_A=cond(A),condition_normal=cond(A'*A),qr_coefficients=c,qr_residual=norm(A*c-y)))",
 "try",
 "    normal=(A'*A)\\(A'*y)",
 "    println((normal_coefficients=normal,normal_residual=norm(A*normal-y)))",
 "catch err",
 "    println((normal_equation_failure=typeof(err),))",
 "end"
 ])
});
