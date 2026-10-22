import {createSemesterRehearsal} from "./semester-rehearsal.js";

// This is an in-page rehearsal, not a second editor, grader or progress store.
export function initSemesterRehearsal({doc=document,onOpen=()=>{},onNewSet=()=>{},initialSeed=Date.now()}={}){
  const panel=doc.getElementById("semester-rehearsal");
  const items=doc.getElementById("semester-rehearsal-items");
  const status=doc.getElementById("semester-rehearsal-status");
  const regenerate=doc.getElementById("semester-rehearsal-new");
  const launch=doc.getElementById("semester-rehearsal-open");
  if(!panel||!items||!status||!regenerate||!launch)
    throw Error("Mixed rehearsal controls are missing.");
  let seed=Number.isSafeInteger(initialSeed)&&initialSeed>=0?initialSeed:0;
  let current=[],activeId=null;

  const node=(tag,cls,text)=>{
    const el=doc.createElement(tag);
    if(cls)el.className=cls;
    if(text!==undefined)el.textContent=text;
    return el;
  };
  function render(){
    current=createSemesterRehearsal(seed);
    items.replaceChildren();
    for(const [index,task] of current.entries()){
      const article=node("article","rehearsal-item");
      article.dataset.area=task.area;
      article.dataset.kind=task.kind;
      article.dataset.sourceId=task.id;
      const eyebrow=node("p","rehearsal-meta",
        (index+1)+"/6 · "+task.topic+" · "+(task.kind==="proof"?"Reasoning":"Julia coding"));
      const title=node("h3","rehearsal-title",task.title);
      const prompt=node("p","rehearsal-question",task.prompt);
      const context=node("p","rehearsal-context",task.context);
      article.append(eyebrow,title,prompt,context);
      if(task.kind==="proof"){
        const input=node("textarea","rehearsal-working");
        input.rows=4;
        input.placeholder="Write your derivation (this tab only)";
        input.setAttribute("aria-label","Your attempt: "+task.title);
        input.setAttribute("spellcheck","false");
        article.append(input);
      }
      const controls=node("div","rehearsal-actions");
      const reveal=node("button","secondary","Show approach");
      reveal.type="button";
      reveal.setAttribute("aria-expanded","false");
      const work=node("button","secondary rehearsal-work","Open exercise in lesson "+task.lesson);
      work.type="button";
      const approach=node("div","rehearsal-approach");
      approach.hidden=true;
      const heading=node("h4",null,"Approach to check");
      const steps=node("ol",null);
      for(const step of task.steps)steps.append(node("li",null,step));
      approach.append(heading,steps);
      if(task.checks?.length){
        approach.append(node("p",null,"Existing Julia Test cases: "+task.checks.join(", ")+"."));
      }
      approach.append(node("p",null,task.followup));
      if(task.warning)approach.append(node("p","rehearsal-warning",task.warning));
      reveal.addEventListener("click",()=>{
        approach.hidden=!approach.hidden;
        reveal.textContent=approach.hidden?"Show approach":"Hide approach";
        reveal.setAttribute("aria-expanded",String(!approach.hidden));
      });
      work.addEventListener("click",()=>{activeId=task.id;onOpen({...task});});
      controls.append(reveal,work);
      article.append(controls,approach);
      items.append(article);
    }
    status.textContent="Six exercises · three syllabus areas · no automatic grade";
  }
  regenerate.addEventListener("click",()=>{
    const hasWork=[...items.querySelectorAll(".rehearsal-working")].some(input=>input.value.trim());
    if(hasWork&&!doc.defaultView.confirm("Discard your written rehearsal attempts and create a new set?"))return;
    seed=(seed+1)>>>0;
    activeId=null;
    render();
    onNewSet();
  });
  launch.addEventListener("click",()=>{
    panel.open=true;
    panel.scrollIntoView({behavior:"auto",block:"start"});
    regenerate.focus({preventScroll:true});
  });
  render();
  return {
    current:()=>[...current],
    returnToActive(){
      panel.open=true;
      const target=[...items.children].find(item=>item.dataset.sourceId===activeId);
      if(!target){panel.scrollIntoView({behavior:"auto",block:"start"});return false;}
      target.scrollIntoView({behavior:"auto",block:"start"});
      target.querySelector(".rehearsal-work")?.focus({preventScroll:true});
      return true;
    }
  };
}
