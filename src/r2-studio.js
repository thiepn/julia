// R2 UI-only controller. Reparents existing canonical elements without copying
// exercises, drafts, model state, local Julia execution, progress or results.
export function initR2Studio({doc=document,lessons,navigate}){
  const get=id=>doc.getElementById(id);
  const node=(tag,cls,html)=>{
    const n=doc.createElement(tag);if(cls)n.className=cls;
    if(html!==undefined)n.innerHTML=html;return n;
  };
  const main=get("lesson-main"),shell=doc.querySelector(".shell"),
    sidebar=doc.querySelector(".sidebar"),compiler=get("compiler-panel");
  if(!main||!sidebar||!compiler||lessons.length!==16)throw Error("Canonical Julia Lab shell missing.");
  const course=node("section","r2-page r2-course"),mixed=node("section","r2-page r2-mixed"),
    utils=node("section","r2-page r2-utilities");
  course.id="r2-course";mixed.id="r2-mixed";utils.id="r2-utilities";
  course.append(node("header","r2-course-hero",
    '<div class="r2-kicker">AMP · JULIA</div><h1>Algorithmische Mathematik<br><em>und Programmieren.</em></h1>'+
    '<p>16 original lessons in Julia and numerical mathematics.</p>'+
    '<button type="button" id="r2-hero-continue" class="r2-button r2-primary">Continue learning →</button>'+
    '<span id="r2-course-progress" role="status"></span>'),
    node("header","r2-course-heading",'<h2>Course curriculum</h2><p>Choose a lesson to begin.</p>'),sidebar);
  sidebar.classList.add("r2-course-list");
  mixed.append(node("header","r2-page-heading",'<span class="r2-kicker">CUMULATIVE PRACTICE</span>'+
    '<h1>Mixed semester practice</h1><p>Six original source-linked reasoning and Julia coding exercises.</p>'),
    get("semester-rehearsal"),
    node("footer","r2-mixed-navigation",'<button id="r2-mixed-prev" class="r2-button r2-secondary">← Previous</button>'+
    '<span id="r2-mixed-progress" role="status">1 of 6</span>'+
    '<button id="r2-mixed-next" class="r2-button r2-primary">Next →</button>'));
  utils.append(node("header","r2-page-heading",'<span class="r2-kicker">COURSE UTILITIES</span>'+
    '<h1>Tools & settings</h1><p>Local backups, ILIAS preparation, offline access, and compiler setup.</p>'));
  for(const id of ["submission-workflow","course-backup","offline-access","settings-panel","bridge-diagnostics"]){
    const x=get(id);if(x)utils.append(x);
  }
  const settings=get("settings-panel");if(settings)settings.hidden=false;
  const top=doc.querySelector(".topbar");
  top.querySelector(".brand").href="#course";
  top.querySelector(".brand small").textContent="Interactive Mathematics Studio";
  get("settings-toggle").hidden=true;
  const globalNav=node("nav","r2-global-nav",'<button id="r2-course-open" type="button">Course</button>'+
    '<button id="r2-mixed-open" type="button">Mixed practice</button>'+
    '<button id="r2-utilities-open" type="button" aria-label="Tools and settings">Tools</button>');
  globalNav.setAttribute("aria-label","Main navigation");
  top.querySelector(".top-right").prepend(globalNav);
  const lessonHead=node("header","r2-lesson-head",'<div class="r2-breadcrumb">'+
    '<button id="r2-back-course" type="button">Course</button><span>/</span>'+
    '<span id="r2-lesson-unit"></span></div>');
  const toolbar=doc.querySelector(".study-toolbar");
  const picker=toolbar.querySelector(".study-lesson-select");
  picker.classList.add("r2-lesson-picker");
  lessonHead.append(picker,get("lesson-meta"),get("lesson-title"),get("lesson-goal"));
  toolbar.remove();
  const tabs=node("nav","r2-stage-tabs",'<button type="button" data-r2-stage="learn">01 <span>Learn</span></button>'+
    '<button type="button" data-r2-stage="check">02 <span>Check</span></button>'+
    '<button type="button" data-r2-stage="code">03 <span>Code</span></button>'+
    '<button type="button" data-r2-stage="explore">04 <span>Explore</span></button>');
  tabs.setAttribute("aria-label","Lesson activities");
  const learn=node("section","r2-activity r2-learn"),
    check=node("section","r2-activity r2-check"),
    code=node("section","r2-activity r2-code"),
    explore=node("section","r2-activity r2-explore");
  learn.id="r2-stage-learn";check.id="r2-stage-check";
  code.id="r2-stage-code";explore.id="r2-stage-explore";
  const learnPanel=get("theory-title")?.closest("section"),
    checkPanel=get("practice-title")?.closest("section"),
    codePanel=get("coding-title")?.closest("section");
  if(!learnPanel||!checkPanel||!codePanel)throw Error("Canonical lesson sections missing.");
  learn.append(learnPanel,node("footer","r2-stage-footer",
    '<span>Concept & worked example</span>'+
    '<button type="button" data-r2-forward="check" class="r2-button r2-primary">Try a question →</button>'));
  check.append(node("header","r2-inner-head",'<span class="r2-kicker">UNDERSTANDING</span>'+
    '<h2>Check your understanding</h2><span id="r2-question-index" role="status">Question 1 of 3</span>'),
    checkPanel,node("footer","r2-stage-footer",
    '<button type="button" id="r2-question-prev" class="r2-button r2-secondary">← Previous</button>'+
    '<button type="button" id="r2-question-next" class="r2-button r2-primary">Next question →</button>'));
  const layout=node("div","r2-code-layout"),
    instructions=node("section","r2-instructions"),
    editor=node("section","r2-editor"),
    editorHead=node("header","r2-editor-head",'<span>main.jl</span>'+
      '<span id="r2-editor-status" role="status">Saved locally</span>'),
    editorActions=node("div","r2-editor-actions",
      '<button id="r2-run" type="button" class="r2-button r2-primary">Run Julia</button>'+
      '<button id="r2-export" type="button" class="r2-button r2-secondary">Download .jl</button>'+
      '<button id="r2-exports" type="button" class="r2-button r2-text">Export & backup</button>');
  const draftTitle=codePanel.querySelector(".draft-title"),
    draft=get("scratch-code"),draftActions=codePanel.querySelector(".draft-actions");
  editor.append(editorHead,draftTitle,draft,draftActions,editorActions);
  const extras=node("details","r2-compiler-extras");
  extras.append(node("summary",null,"External compiler, comparison and other tools"));
  const runner=compiler.querySelector(".local-runner");
  for(const item of [...compiler.children]){
    if(item===runner||item.classList?.contains("compiler-heading"))continue;
    extras.append(item);
  }
  if(runner)compiler.append(runner,extras);
  editor.append(compiler);instructions.append(codePanel);
  layout.append(instructions,editor);code.append(layout);
  explore.append(node("header","r2-inner-head",'<span class="r2-kicker">NUMERICAL STUDIO</span>'+
    '<h2>Explore & experiment</h2><p>Manipulate the original numerical models and inspect their output.</p>'),
    node("div","r2-lab-picker",'<label for="r2-lab-choice">Experiment</label>'+
      '<select id="r2-lab-choice"></select>'));
  const labIds=["numerical-explorer","elimination-lab","precision-lab",
    "fitting-lab","program-trace","factor-lab","sensitivity-lab",
    "ue02-lab","amp-root-workshop","amp-condition-workshop",
    "amp-mission-workshop","linear-methods","completion-depth",
    "plotting-workshop","repair-lab"];
  get("lab-directory")?.remove();
  for(const id of labIds){const part=get(id);if(part){
    part.classList.add("r2-lab");explore.append(part);
  }}
  const oldFooter=main.querySelector(".lesson-footer"),
    stages=node("div","r2-stage-content");
  stages.append(learn,check,code,explore);
  main.replaceChildren(lessonHead,tabs,stages);
  if(oldFooter)main.append(oldFooter);
  shell.replaceChildren(course,main,mixed,utils);
  doc.querySelector(".study-mobile-dock")?.remove();
  const action=node("div","r2-mobile-action",'<button id="r2-mobile-next" type="button" '+
    'class="r2-button r2-primary">Try a question →</button>');
  doc.body.append(action);
  const viewport=doc.defaultView.visualViewport;
  if(viewport)viewport.addEventListener("resize",()=>{
    action.classList.toggle("r2-keyboard-visible",
      doc.defaultView.innerHeight-viewport.height>170);
  });
  let currentView="lesson",currentStage="learn",question=0,mixedIndex=0,
    currentLesson="",nextStage=null;
  const validStages=["learn","check","code","explore"];
  function showView(view){
    currentView=view;doc.body.dataset.r2View=view;
    for(const [name,item] of [["course",course],["lesson",main],["mixed",mixed],["utilities",utils]])
      item.hidden=name!==view;
    action.hidden=view!=="lesson";
    for(const name of ["course","mixed","utilities"])
      get("r2-"+name+"-open").setAttribute("aria-current",view===name?"page":"false");
  }
  function showStage(stage){
    if(!validStages.includes(stage))return;
    currentStage=stage;showView("lesson");doc.body.dataset.r2Stage=stage;
    for(const [name,item] of [["learn",learn],["check",check],["code",code],["explore",explore]])
      item.hidden=name!==stage;
    tabs.querySelectorAll("button").forEach(b=>{
      const active=b.dataset.r2Stage===stage;
      b.setAttribute("aria-pressed",String(active));
      b.setAttribute("aria-current",active?"step":"false");
    });
    if(stage==="check")syncQuestions();
    if(stage==="explore")syncLabs();
    get("r2-mobile-next").textContent=stage==="learn"?"Try a question →":
      stage==="check"?(question===2?"Start coding →":"Next question →"):
      stage==="code"?"Run Julia":"Back to coding";
    doc.defaultView.scrollTo(0,0);
  }
  function show(view){if(validStages.includes(view))showStage(view);
    else if(["course","mixed","utilities"].includes(view)){
      showView(view);if(view==="mixed"){get("semester-rehearsal").open=true;syncMixed();}
      doc.defaultView.scrollTo(0,0);
    }}
  function syncQuestions(){
    const qs=[...get("questions").querySelectorAll(".question")];
    question=Math.max(0,Math.min(question,qs.length-1));
    qs.forEach((q,i)=>q.classList.toggle("r2-question-inactive",i!==question));
    get("r2-question-index").textContent="Question "+(question+1)+" of "+qs.length;
    get("r2-question-prev").disabled=question===0;
    get("r2-question-next").textContent=question===qs.length-1?
      "Start coding →":"Next question →";
    if(currentStage==="check")get("r2-mobile-next").textContent=
      question===qs.length-1?"Start coding →":"Next question →";
  }
  new MutationObserver(syncQuestions).observe(get("questions"),{childList:true});
  function advanceQuestion(by){
    if(by>0&&question>=get("questions").children.length-1)showStage("code");
    else{question=Math.max(0,Math.min(2,question+by));syncQuestions();}
  }
  get("r2-question-prev").addEventListener("click",()=>advanceQuestion(-1));
  get("r2-question-next").addEventListener("click",()=>advanceQuestion(1));
  function syncMixed(){
    const qs=[...get("semester-rehearsal-items").children];
    mixedIndex=Math.max(0,Math.min(mixedIndex,qs.length-1));
    qs.forEach((q,i)=>q.classList.toggle("r2-mixed-inactive",i!==mixedIndex));
    get("r2-mixed-progress").textContent=(mixedIndex+1)+" of "+qs.length;
    get("r2-mixed-prev").disabled=mixedIndex===0;
    get("r2-mixed-next").disabled=mixedIndex===qs.length-1;
  }
  new MutationObserver(()=>{mixedIndex=0;syncMixed();}).observe(
    get("semester-rehearsal-items"),{childList:true});
  get("r2-mixed-prev").addEventListener("click",()=>{mixedIndex--;syncMixed();});
  get("r2-mixed-next").addEventListener("click",()=>{mixedIndex++;syncMixed();});
  function syncLabs(){
    const choice=get("r2-lab-choice"),prior=choice.value;
    const available=labIds.map(get).filter(n=>n&&!n.hidden);
    choice.replaceChildren(...available.map(n=>{
      const opt=doc.createElement("option");opt.value=n.id;
      opt.textContent=n.querySelector("h2")?.textContent.trim()||"Julia lab";return opt;
    }));
    choice.value=available.some(x=>x.id===prior)?prior:available[0]?.id||"";
    choice.parentElement.hidden=available.length<2;
    labIds.map(get).filter(Boolean).forEach(n=>n.classList.toggle(
      "r2-lab-inactive",n.id!==choice.value));
  }
  get("r2-lab-choice").addEventListener("change",syncLabs);
  function update(id){
    const lesson=lessons.find(l=>l.id===id)||lessons[0];
    get("r2-lesson-unit").textContent=lesson.stage+" / "+lesson.id;
    get("r2-course-progress").textContent=get("progress-label").textContent;
    get("r2-hero-continue").textContent=get("continue-lesson").textContent+" →";
    if(currentLesson!==id){question=0;currentLesson=id;}
    get("lesson-jump").value=id;syncLabs();syncQuestions();
    const target=nextStage||"learn";nextStage=null;showStage(target);
  }
  get("r2-hero-continue").addEventListener("click",()=>get("continue-lesson").click());
  for(const name of ["course","mixed","utilities"]){
    get("r2-"+name+"-open").addEventListener("click",()=>{
      location.hash="#"+name;show(name);
    });
  }
  get("r2-back-course").addEventListener("click",()=>{
    location.hash="#course";show("course");
  });
  tabs.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>showStage(b.dataset.r2Stage)));
  get("r2-mobile-next").addEventListener("click",()=>{
    if(currentStage==="learn")showStage("check");
    else if(currentStage==="check")advanceQuestion(1);
    else if(currentStage==="code")get("local-runner-run").click();
    else showStage("code");
  });
  learn.querySelector("[data-r2-forward]").addEventListener("click",()=>showStage("check"));
  get("r2-run").addEventListener("click",()=>get("local-runner-run").click());
  get("r2-export").addEventListener("click",()=>get("download-draft").click());
  get("r2-exports").addEventListener("click",()=>{
    location.hash="#utilities";show("utilities");get("submission-workflow").open=true;
  });
  get("semester-rehearsal-open").addEventListener("click",()=>{
    location.hash="#mixed";show("mixed");
  });
  get("lesson-jump").replaceChildren(...lessons.map(l=>{
    const opt=doc.createElement("option");opt.value=l.id;
    opt.textContent=l.id+" · "+l.title;return opt;
  }));
  get("lesson-jump").addEventListener("change",()=>{
    const i=lessons.findIndex(x=>x.id===get("lesson-jump").value);
    if(i>=0)navigate(i);
  });
  get("scratch-code").addEventListener("input",()=>{
    get("r2-editor-status").textContent=
      get("draft-feedback")?.textContent?.toLowerCase().includes("unsaved")?
        "Unsaved — copy source":"Saved locally";
  });
  return {show,showStage,update,selectLab:id=>{
    const choice=get("r2-lab-choice");
    if([...choice.options].some(opt=>opt.value===id)){
      choice.value=id;syncLabs();
    }
  },setNextStage:s=>{if(validStages.includes(s))nextStage=s;},
    getView:()=>currentView,getStage:()=>currentStage};
}
