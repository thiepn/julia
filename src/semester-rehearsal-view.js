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
  // Session-only attempt indicators, never grades or persistent progress.
  const attempted=new Set();
  let comparisonListeners=new AbortController();

  const node=(tag,cls,text)=>{
    const el=doc.createElement(tag);
    if(cls)el.className=cls;
    if(text!==undefined)el.textContent=text;
    return el;
  };
  function render(){
    comparisonListeners.abort();
    comparisonListeners=new AbortController();
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
      const indicator=node("p","rehearsal-attempt-status","Not yet attempted · not graded");
      indicator.setAttribute("role","status");
      article.append(indicator);
      const markAttempt=()=>{
        attempted.add(task.kind+":"+task.id);
        indicator.textContent="Attempt started · not graded";
      };
      const plan=node("details","rehearsal-reasoning");
      plan.append(node("summary",null,"Plan before revealing the approach"));
      const prompts=node("ol");
      const questions=task.kind==="proof"?
        ["What is the precise claim or counterexample?",
         "Which assumptions and definitions are necessary?",
         "How can each implication and boundary case be checked?"]:
        ["What inputs and outputs must the algorithm handle?",
         "Which edge cases should the Julia tests cover?",
         "What would constitute actual execution evidence?"];
      for(const question of questions)prompts.append(node("li",null,question));
      plan.append(prompts);article.append(plan);
      {
        const input=node("textarea","rehearsal-working");
        input.rows=4;
        input.placeholder=task.kind==="proof"?"Write your derivation (this tab only)":"Plan your algorithm and test cases (this tab only)";
        input.setAttribute("aria-label","Your attempt: "+task.title);
        input.setAttribute("spellcheck","false");
        input.addEventListener("input",markAttempt);
        article.append(input);
      }
      // The comparison is a read-only source reference, not a proof checker.
      const comparison=node("details","rehearsal-comparison");
      comparison.append(node("summary",null,"Compare proof assumptions and Julia test obligations"));
      const compareBody=node("div","rehearsal-comparison-body");
      const sourceTasks=current.filter(other=>other.area===task.area);
      const proofSource=sourceTasks.find(other=>other.kind==="proof");
      const codeSource=sourceTasks.find(other=>other.kind==="coding");
      for(const [heading,content] of [
        ["Original proof claim",proofSource.prompt],
        ["Proof assumptions",proofSource.context],
        ["Original coding task",codeSource.prompt],
        ["Algorithm context",codeSource.context],
        ["Source-authored Julia Test names",codeSource.checks?.join(", ")||"No named tests supplied"]
      ]){
        const section=node("section","rehearsal-comparison-source");
        section.append(node("h4",null,heading),node("p",null,content));
        compareBody.append(section);
      }
      compareBody.append(node("p","rehearsal-warning",
        "Related by syllabus topic only. These are distinct original exercises; a proof does not establish Julia test success."));
      const notes=node("div","rehearsal-comparison-notes");
      const syncComparison=()=>{
        notes.replaceChildren();
        for(const related of sourceTasks){
          const relatedItem=[...items.children].find(item=>item.dataset.sourceId===related.id);
          const label=related.kind==="proof"?"Your proof reasoning":"Your coding and test plan";
          notes.append(node("h4",null,label),node("p",null,
            relatedItem?.querySelector(".rehearsal-working")?.value||"No attempt written in this session."));
        }
      };
      comparison.addEventListener("toggle",()=>{if(comparison.open)syncComparison();});
      items.addEventListener("input",event=>{
        if(comparison.open&&event.target.matches(".rehearsal-working"))syncComparison();
      },{signal:comparisonListeners.signal});
      comparison.append(compareBody,notes);
      article.append(comparison);
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
      work.addEventListener("click",()=>{activeId=task.id;markAttempt();onOpen({...task});});
      const paired=node("button","secondary rehearsal-pair",
        task.kind==="proof"?"Continue with Julia coding in this topic":"Review the proof for this topic");
      paired.type="button";
      paired.dataset.rehearsalPair=task.area;
      paired.setAttribute("aria-label",(task.kind==="proof"?"Open coding transfer":"Open proof reasoning")+" · "+task.topic);
      controls.append(reveal,paired,work);
      article.append(controls,approach);
      items.append(article);
    }
    status.textContent="Six exercises · three syllabus areas · no automatic grade";
  }
  regenerate.addEventListener("click",()=>{
    const hasWork=[...items.querySelectorAll(".rehearsal-working")].some(input=>input.value.trim());
    if((hasWork||attempted.size>0)&&!doc.defaultView.confirm("Start a new set? In-page notes and attempt markers will be discarded; saved lesson drafts remain unchanged."))return;
    seed=(seed+1)>>>0;
    activeId=null;
    attempted.clear();
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
      return activeId;
    }
  };
}
