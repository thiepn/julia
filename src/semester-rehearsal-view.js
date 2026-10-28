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
  // Volatile, per-generated-set reflections. Never persisted or graded.
  const reviewByArea=new Map();
  const comparisonSync=new Map();

  const node=(tag,cls,text)=>{
    const el=doc.createElement(tag);
    if(cls)el.className=cls;
    if(text!==undefined)el.textContent=text;
    return el;
  };
  function render(){
    current=createSemesterRehearsal(seed);
    reviewByArea.clear();
    comparisonSync.clear();
    for(const task of current){
      if(!reviewByArea.has(task.area))reviewByArea.set(task.area,{assumptions:"",boundary:"",coverage:""});
    }
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
        ["Source-authored Julia Test names",codeSource.checks?.join(", ")||"No named tests supplied"],
        ["Original proof reference",proofSource.source],
        ["Original coding reference",codeSource.source]
      ]){
        const section=node("section","rehearsal-comparison-source");
        section.append(node("h4",null,heading),node("p",null,content));
        compareBody.append(section);
      }
      const testDetails=node("section","rehearsal-source-checks");
      testDetails.append(node("h4",null,"Original Julia Test assertions (reference only)"));
      if(codeSource.checkDetails?.length){
        for(const check of codeSource.checkDetails){
          const row=node("div","rehearsal-source-check");
          row.append(node("strong",null,check.name),node("code",null,check.assertion));
          testDetails.append(row);
        }
      }else testDetails.append(node("p",null,"No original Julia assertions available."));
      compareBody.append(testDetails);
      compareBody.append(node("p","rehearsal-warning",
        "Related by syllabus topic only. These are distinct original exercises; source tests are not executed here and a proof does not establish Julia test success."));
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
      comparisonSync.set(comparison,syncComparison);
      comparison.addEventListener("toggle",()=>{if(comparison.open)syncComparison();});
      comparison.append(compareBody,notes);
      const review=node("section","rehearsal-transfer-review");
      review.append(node("h4",null,"Proof-to-code review · your notes, not a grade"));
      const reviewPrompts=[
        ["assumptions","Assumption transfer","Which precise original proof assumption is relevant to this coding input? Explain if the algorithm actually satisfies it, or why the two tasks are not equivalent."],
        ["boundary","Boundary or counterexample","Give a concrete boundary input or counterexample, predict what should happen, and say which proof assumption or algorithm condition is stressed."],
        ["coverage","Test coverage gaps","Name the original Julia Test cases that address your boundary input. What remains untested? A test name or written plan is not a test result."]
      ];
      for(const [key,heading,question] of reviewPrompts){
        const field=node("div","rehearsal-review-field");
        const input=node("textarea","rehearsal-review-input");
        input.id="rehearsal-review-"+task.area+"-"+task.kind+"-"+key;
        input.rows=3;
        input.dataset.reviewArea=task.area;
        input.dataset.reviewField=key;
        input.value=reviewByArea.get(task.area)[key];
        input.placeholder="Reasoning in this browser tab only; no automatic verification";
        input.setAttribute("spellcheck","false");
        const label=node("label",null,heading+" — "+question);
        label.htmlFor=input.id;
        field.append(label,input);review.append(field);
      }
      const progress=node("p","rehearsal-review-progress","0 of 3 review sections drafted · not checked or graded");
      progress.dataset.reviewArea=task.area;
      progress.setAttribute("role","status");
      review.append(progress);
      comparison.append(review);
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
    // Populate source note mirrors before the first details toggle event.
    for(const sync of comparisonSync.values())sync();
    status.textContent="Six exercises · three syllabus areas · no automatic grade";
  }
  regenerate.addEventListener("click",()=>{
    const hasWork=[...items.querySelectorAll(".rehearsal-working")].some(input=>input.value.trim());
    const hasReview=[...reviewByArea.values()].some(review=>Object.values(review).some(value=>value.trim()));
    if((hasWork||hasReview||attempted.size>0)&&!doc.defaultView.confirm("Start a new set? In-page proof, coding and comparison notes and attempt markers will be discarded; saved lesson drafts remain unchanged."))return;
    seed=(seed+1)>>>0;
    activeId=null;
    attempted.clear();
    render();
    onNewSet();
  });
  // One delegated listener handles any number of regeneration cycles.
  // The paired proof/coding panels mirror a single per-area review, not two copies.
  items.addEventListener("input",event=>{
    const input=event.target;
    if(input.matches(".rehearsal-review-input")){
      const {reviewArea,reviewField}=input.dataset;
      const review=reviewByArea.get(reviewArea);
      if(!review||!Object.hasOwn(review,reviewField))return;
      review[reviewField]=input.value;
      for(const other of items.querySelectorAll(".rehearsal-review-input")){
        if(other!==input&&other.dataset.reviewArea===reviewArea&&other.dataset.reviewField===reviewField)
          other.value=input.value;
      }
      const drafted=Object.values(review).filter(value=>value.trim()).length;
      for(const progress of items.querySelectorAll(".rehearsal-review-progress")){
        if(progress.dataset.reviewArea===reviewArea)
          progress.textContent=drafted+" of 3 review sections drafted · not checked or graded";
      }
    }else if(input.matches(".rehearsal-working")){
      // Update both paired snapshots immediately, even while collapsed.
      // A browser's native details "toggle" event may arrive asynchronously.
      const area=input.closest(".rehearsal-item")?.dataset.area;
      for(const [comparison,sync] of comparisonSync){
        if(comparison.closest(".rehearsal-item")?.dataset.area===area)sync();
      }
    }
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
