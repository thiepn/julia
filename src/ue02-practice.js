export const CANCELLATION_EXAMPLE = [
  "using PrettyTables",
  "eps = [1e-4, 1e-8, 1e-12, 1e-16]",
  "direct = sqrt.(1 .+ eps) .- 1",
  "stable = eps ./ (sqrt.(1 .+ eps) .+ 1)",
  "data = hcat(eps, direct, stable)",
  'pretty_table(data; column_labels=["epsilon", "direct", "rationalized"])'
].join("\n");
export const CONDITION_EXAMPLE = [
  "function relative_condition_sin(x)",
  "    fx = sin(x)",
  "    return iszero(fx) ? Inf : abs(x * cos(x) / fx)",
  "end",
  "for x in [0.1, 1.0, 3.0]",
  "    println((x=x, kappa=relative_condition_sin(x)))",
  "end"
].join("\n");
export const UE02_CASES = Object.freeze({
  cancellation:{
    label:"Cancellation and PrettyTables.jl",
    question:"Why can direct subtraction lose significant digits as epsilon shrinks?",
    explanation:"Compare sqrt(1+ε)−1 with ε/(sqrt(1+ε)+1). These are algebraically equal for ε>0, but subtraction of nearly equal Float64 numbers can erase small differences. The table is a browser-computed illustration; the Julia example uses PrettyTables.jl.",
    code:CANCELLATION_EXAMPLE
  },
  condition:{
    label:"Relative condition of sin(x)",
    question:"How does relative sensitivity change near a zero of sin(x)?",
    explanation:"For f(x)=sin(x) and f(x)≠0, the local relative condition is |x cos(x)/sin(x)|. This describes problem sensitivity, not the stability of a particular algorithm. Numerical samples do not prove a limiting result.",
    code:CONDITION_EXAMPLE
  }
});
export function cancellationRows(epsilons=[1e-4,1e-8,1e-12,1e-16]) {
  return epsilons.map(eps=>{
    if(!(eps>0)&&eps!==0 || !Number.isFinite(eps)) throw Error("epsilon must be finite and nonnegative");
    return {epsilon:eps,direct:Math.sqrt(1+eps)-1,rationalized:eps/(Math.sqrt(1+eps)+1)};
  });
}
export function relativeConditionSin(x) {
  if(!Number.isFinite(x)) throw Error("x must be finite");
  const f=Math.sin(x);
  return f===0?Infinity:Math.abs(x*Math.cos(x)/f);
}
export function initUe02Practice(doc=document) {
  const section=doc.querySelector("#ue02-lab"),choose=doc.querySelector("#ue02-case");
  const code=doc.querySelector("#ue02-code"),body=doc.querySelector("#ue02-table-body");
  const question=doc.querySelector("#ue02-question"),explanation=doc.querySelector("#ue02-explanation"),feedback=doc.querySelector("#ue02-feedback");
  function renderCase(){
    const c=UE02_CASES[choose.value];
    code.textContent=c.code;
    question.textContent=c.question;
    explanation.textContent=c.explanation;
    feedback.textContent="";
    body.replaceChildren();
    if(choose.value==="cancellation") {
      for(const r of cancellationRows()){
        const row=doc.createElement("tr");
        for(const value of [r.epsilon,r.direct,r.rationalized]){
          const cell=doc.createElement("td");cell.textContent=value.toExponential(6);row.append(cell);
        }
        body.append(row);
      }
    } else {
      for(const x of [0.1,1,3]){
        const row=doc.createElement("tr");
        for(const value of [x,Math.sin(x),relativeConditionSin(x)]){
          const cell=doc.createElement("td");cell.textContent=value.toPrecision(7);row.append(cell);
        }
        body.append(row);
      }
    }
    doc.querySelector("#ue02-table-head").textContent=choose.value==="cancellation"?
      "ε / direct / rationalized":"x / sin(x) / relative condition";
  }
  choose.addEventListener("change",renderCase);
  doc.querySelector("#ue02-copy").addEventListener("click",async()=>{
    try{await navigator.clipboard.writeText(UE02_CASES[choose.value].code);feedback.textContent="Julia example copied. Run it in your Julia environment.";}
    catch{feedback.textContent="Clipboard unavailable. Select the code above to copy.";}
  });
  renderCase();
  return {showForLesson(id){section.hidden=!["09","16"].includes(id);}};
}
