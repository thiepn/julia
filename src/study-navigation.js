// Presentation-only navigation over canonical lessons and existing content.
// No second route registry, progress store, compiler, or saved preference.
export function initStudyNavigation({doc=document,lessons,navigate}={}){
  if(!Array.isArray(lessons)||typeof navigate!=="function")throw Error("Canonical lesson navigation required.");
  const get=id=>doc.getElementById(id);
  const jump=get("lesson-jump"),menu=get("mobile-course-toggle"),items=get("nav-items"),
    labs=get("lab-shortcuts"),labMenu=get("lab-directory"),labCount=get("lab-count");
  const options=lessons.map((lesson,index)=>{
    const item=doc.createElement("option");
    item.value=lesson.id;
    item.textContent=(index+1).toString().padStart(2,"0")+" · "+lesson.title;
    return item;
  });
  jump.replaceChildren(...options);
  jump.addEventListener("change",()=>{
    const index=lessons.findIndex(l=>l.id===jump.value);
    if(index>=0)navigate(index);
  });
  menu.addEventListener("click",()=>{
    const now=items.dataset.mobileClosed==="true";
    items.dataset.mobileClosed=now?"false":"true";
    menu.setAttribute("aria-expanded",String(now));
    menu.textContent=now?"Close lessons":"All lessons";
  });
  items.addEventListener("click",event=>{
    if(event.target.closest(".lesson-link")){
      items.dataset.mobileClosed="true";
      menu.setAttribute("aria-expanded","false");
      menu.textContent="All lessons";
    }
  });
  const targets={
    learn:"theory-title",practice:"practice-title",code:"coding-title",
    run:"compiler-panel",labs:"lab-directory"
  };
  function jumpTo(id){
    const el=get(id);
    if(!el||el.hidden)return false;
    if(id==="lab-directory")el.open=true;
    el.scrollIntoView({block:"start",behavior:"auto"});
    if(id!=="lab-directory"){
      const heading=el.matches("h1,h2,h3")?el:el.querySelector("h2,h3");
      if(heading){heading.setAttribute("tabindex","-1");heading.focus({preventScroll:true});}
    }
    return true;
  }
  for(const button of doc.querySelectorAll("[data-study-jump]")){
    button.addEventListener("click",()=>{
      const id=targets[button.dataset.studyJump];
      if(id)jumpTo(id);
    });
  }
  const labIds=[
    "numerical-explorer","elimination-lab","precision-lab","fitting-lab",
    "program-trace","factor-lab","sensitivity-lab","ue02-lab",
    "amp-root-workshop","amp-condition-workshop","amp-mission-workshop",
    "linear-methods","completion-depth","plotting-workshop"
  ];
  function sync(lessonId){
    if(lessons.some(l=>l.id===lessonId))jump.value=lessonId;
    labs.replaceChildren();
    let count=0;
    for(const id of labIds){
      const section=get(id);
      if(!section||section.hidden)continue;
      const heading=section.querySelector("h2");
      if(!heading)continue;
      const anchor=doc.createElement("button");
      anchor.type="button";anchor.className="lab-shortcut";
      anchor.textContent=heading.textContent.trim();
      anchor.addEventListener("click",()=>{labMenu.open=false;jumpTo(id);});
      labs.append(anchor);count++;
    }
    labCount.textContent=String(count);
    labMenu.hidden=count===0;
    if(count===0)labMenu.open=false;
  }
  return {sync,jumpTo};
}
