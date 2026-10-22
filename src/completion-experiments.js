// Real Julia sources; no browser-side Julia execution or synthetic learning scores.
export const QUALIFIED_EXPERIMENTS=Object.freeze({
 spacing:Object.freeze({id:"spacing",lesson:"09",title:"Machine-number spacing",
  intent:"Compare representations across Float32 and Float64 using real Julia.",
  code:[
    "using Test",
    "for T in (Float32, Float64)",
    "    oneval = one(T)",
    "    gap = nextfloat(oneval)-oneval",
    "    @test gap == eps(T)",
    "    @test prevfloat(oneval) < oneval < nextfloat(oneval)",
    "    println((type=T,spacing=gap,decimal=T(0.1)))",
    "end",
    "@test nextfloat(floatmax(Float64)) == Inf"
  ].join("\n")}),
 cancellation:Object.freeze({id:"cancellation",lesson:"09",title:"Cancellation across scales",
  intent:"Compare direct subtraction to an algebraically rationalized result.",
  code:[
    "using Test",
    "for t in (1e-3, 1e-9, 1e-13)",
    "    direct = sqrt(1+t)-1",
    "    stable = t/(sqrt(1+t)+1)",
    "    @test isfinite(stable) && stable > 0",
    "    println((t=t,direct=direct,stable=stable,relative_gap=abs(direct-stable)/stable))",
    "end",
    "@test (sqrt(1+1e-13)-1) != 1e-13/(sqrt(1+1e-13)+1)"
  ].join("\n")}),
 residual:Object.freeze({id:"residual",lesson:"16",title:"Residual and forward sensitivity",
  intent:"Compute real solution changes while checking matching residuals.",
  code:[
    "using LinearAlgebra, Test",
    "for delta in (1e-2, 1e-6, 1e-10)",
    "    A = [1.0 0.0; 0.0 delta]",
    "    b = [1.0, 1.0]",
    "    db = [0.0, delta]",
    "    x = A \\ b",
    "    y = A \\ (b+db)",
    "    @test isapprox(norm(y-x),1.0;atol=1e-6)",
    "    @test norm(A*y-(b+db)) < 1e-9",
    "    println((delta=delta,condition=cond(A),change=norm(y-x),residual=norm(A*y-(b+db))))",
    "end"
  ].join("\n")})
});
export function experimentsForLesson(lesson){return Object.values(QUALIFIED_EXPERIMENTS).filter(e=>e.lesson===lesson);}
