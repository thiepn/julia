export const PLOT_RECIPES = Object.freeze({
  "04":{
    title:"Two curves and figure export",
    task:"Compare a sine wave and a shifted sine wave. Inspect labels, legend and sampling density.",
    code:[
      "using Plots",
      "x = range(-pi, pi; length=150)",
      'p = plot(x, sin.(x); label="sin(x)", xlabel="x", ylabel="value")',
      'plot!(p, x, sin.(x .+ 0.4); label="shifted sine")',
      'savefig(p, "julia-curves.png")'
    ].join("\n"),
    checks:"Check both labelled curves, consistent axes, and a PNG saved by Julia."
  },
  "05":{
    title:"Geometry without distorted axes",
    task:"Draw an ellipse with semi-axes 3 and 1. Change aspect_ratio and check what visual distortion means.",
    code:[
      "using Plots",
      "theta = range(0, 2pi; length=240)",
      'p = plot(3 .* cos.(theta), sin.(theta); aspect_ratio=:equal, label="ellipse")',
      'savefig(p, "julia-ellipse.svg")'
    ].join("\n"),
    checks:"The sampled curve should close. Equal axis scaling is necessary to compare geometry."
  },
  "06":{
    title:"Plot a matrix-transformed curve",
    task:"Apply a shear matrix to an ellipse, retaining all paired coordinates.",
    code:[
      "using Plots",
      "theta = range(0, 2pi; length=240)",
      "points = [2 .* cos.(theta) sin.(theta)]'",
      "A = [1.0 0.6; 0.0 1.0]",
      "mapped = A * points",
      'p = plot(vec(points[1,:]), vec(points[2,:]); aspect_ratio=:equal, label="input")',
      'plot!(p, vec(mapped[1,:]), vec(mapped[2,:]); label="sheared")',
      'savefig(p, "julia-shear.png")'
    ].join("\n"),
    checks:"The first row contains x and the second y. Verify dimensions before multiplying."
  }
});
export function recipeForLesson(id) {return PLOT_RECIPES[id]||null;}
export function initPlottingPractice(doc=document){
  const section=doc.querySelector("#plotting-workshop"),title=doc.querySelector("#plotting-recipe-title");
  const task=doc.querySelector("#plotting-recipe-task"),code=doc.querySelector("#plotting-recipe-code");
  const checks=doc.querySelector("#plotting-recipe-checks"),feedback=doc.querySelector("#plotting-recipe-feedback");
  let current=null;
  doc.querySelector("#plotting-recipe-copy").addEventListener("click",async()=>{
    if(!current)return;
    try{await navigator.clipboard.writeText(current.code);feedback.textContent="Julia plot example copied; execute it locally to produce the saved image.";}
    catch{feedback.textContent="Clipboard unavailable. Select the Julia source above to copy.";}
  });
  return {showForLesson(id){
    current=recipeForLesson(id);section.hidden=!current;
    if(!current)return;
    title.textContent=current.title;task.textContent=current.task;
    code.textContent=current.code;checks.textContent=current.checks;feedback.textContent="";
  }};
}
