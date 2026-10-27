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
  // Course home is a syllabus and a preview of real lesson source, not a dashboard.
  const courseHero=node("header","r2-course-hero",
    '<div class="r2-course-identity"><span class="r2-course-language">Julia</span>'+
    '<span>AMP · Universität zu Köln</span></div>'+
    '<div class="r2-course-hero-main"><div><h1>Algorithmische Mathematik<br>und Programmieren</h1>'+
    '<p>16 lessons · Julia programming and numerical methods</p></div>'+
    '<div class="r2-course-hero-actions"><span id="r2-course-progress" role="status"></span>'+
    '<button type="button" id="r2-hero-continue" class="r2-button r2-primary">Continue learning →</button></div></div>');
  const coursePath=node("section","r2-course-path");
  coursePath.append(node("header","r2-course-heading",
    '<h2>Course curriculum</h2>'),sidebar);
  sidebar.classList.add("r2-course-list");
  const nextPreview=node("aside","r2-next-lesson");
  nextPreview.setAttribute("aria-labelledby","r2-next-lesson-title");
  nextPreview.innerHTML=
    '<div class="r2-preview-header"><span id="r2-preview-mode">UP NEXT · LESSON SOURCE</span><span>Julia</span></div>'+
    '<p id="r2-next-lesson-title" class="r2-preview-lesson"></p><p id="r2-next-lesson-goal"></p>'+
    '<div class="r2-preview-checkpoint" id="r2-preview-checkpoint"></div>'+
    '<nav class="r2-preview-prereqs" aria-label="Suggested previous lessons" id="r2-preview-prereqs"></nav>'+
    '<div class="r2-preview-file"><span>example.jl</span><span>Read-only</span></div>'+
    '<pre class="r2-preview-code"><code id="r2-next-lesson-code"></code></pre>'+
    '<div class="r2-preview-footer"><span id="r2-next-lesson-source"></span>'+
    '<div class="r2-preview-actions"><button type="button" id="r2-resume-current" class="r2-button r2-secondary" hidden></button>'+
    '<button type="button" id="r2-next-code" class="r2-button r2-primary">Open code workspace →</button></div></div>';
  const courseLayout=node("div","r2-course-layout");
  courseLayout.append(nextPreview,coursePath);
  course.append(courseHero,courseLayout);
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
  lessonHead.append(picker,get("lesson-meta"),get("lesson-title"),get("lesson-goal"),
    node("div","r2-lesson-path",
      '<nav id="r2-lesson-prereqs" aria-label="Suggested prior lessons"></nav>'+
      '<div class="r2-lesson-path-actions">'+
      '<span id="r2-lesson-checkpoint" role="status"></span>'+
      '<button type="button" id="r2-lesson-previous">← Previous lesson</button>'+
      '<button type="button" id="r2-lesson-next">Next lesson →</button></div>'));
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
  // Reuse the exact canonical lesson text and Julia example; move, never duplicate,
  // their authoritative DOM nodes into a source-led reading workspace.
  const reading=node("div","r2-learn-reading"),
    examplePane=node("section","r2-example-pane"),
    exampleHead=node("header","r2-example-head",
      '<span>example.jl <span class="r2-example-mode">Read-only · not executed</span></span>'+
      '<button type="button" id="r2-copy-example">Copy example</button>'),
    exampleActions=node("footer","r2-example-actions",
      '<span id="r2-example-source"></span>'+
      '<button type="button" id="r2-example-code" class="r2-button r2-primary">Open Code →</button>'+
      '<span id="r2-example-feedback" role="status" aria-live="polite"></span>');
  const examplePre=get("example-code").closest("pre"),
    originalHeading=learnPanel.querySelector(".section-title"),
    originalLabel=learnPanel.querySelector(".code-label");
  if(!examplePre||!originalHeading||!originalLabel)throw Error("Canonical Julia example missing.");
  reading.append(originalHeading,get("lesson-theory"));
  examplePane.append(exampleHead,examplePre,exampleActions);
  learnPanel.replaceChildren(reading,examplePane);
  learnPanel.classList.add("r2-learn-paper");
  learn.append(learnPanel,node("footer","r2-stage-footer",
    '<span id="r2-reading-source"></span>'+
    '<button type="button" data-r2-forward="check" class="r2-button r2-primary">Check understanding →</button>'));

  // The original question nodes, evaluator and feedback stay inside checkPanel.
  // The question index only reflects that DOM's selected/correct/retry state.
  const checkLayout=node("div","r2-check-layout"),
    questionTools=node("nav","r2-question-tools",
      '<span id="r2-question-index" role="status">Question 1 of 3</span>'+
      '<div id="r2-question-steps" role="group" aria-label="Choose checkpoint question"></div>'),
    checkReference=node("aside","r2-check-reference",
      '<header class="r2-check-reference-head"><span>example.jl</span><span>Read-only</span></header>'+
      '<pre class="r2-check-reference-code"><code id="r2-check-code"></code></pre>'+
      '<div class="r2-check-reference-actions"><span id="r2-check-source"></span>'+
      '<button type="button" id="r2-review-concept">Review concept</button>'+
      '<button type="button" id="r2-check-code-button">Open Code →</button></div>');
  checkReference.setAttribute("aria-label","Lesson Julia source reference");
  checkPanel.classList.add("r2-check-paper");
  checkLayout.append(checkPanel,checkReference);
  check.append(questionTools,checkLayout,node("footer","r2-stage-footer",
    '<button type="button" id="r2-question-prev" class="r2-button r2-secondary">← Previous</button>'+
    '<button type="button" id="r2-question-next" class="r2-button r2-primary">Next question →</button>'));
  const layout=node("div","r2-code-layout"),
    instructions=node("details","r2-instructions"),
    editor=node("section","r2-editor"),
    editorHead=node("header","r2-editor-head",
      '<div class="r2-file-tab" aria-label="Current Julia source file"><span class="r2-file-badge">jl</span>'+
      '<span>main.jl</span></div><span id="r2-editor-status" role="status">Saved locally</span>'),
    editorActions=node("div","r2-editor-actions",
      '<button id="r2-run" type="button" class="r2-button r2-primary">Run Julia</button>'+
      '<button id="r2-tests-jump" type="button" class="r2-button r2-secondary" hidden>Julia tests</button>'+
      '<button id="r2-exports" type="button" class="r2-button r2-text">Export & backup</button>'),
    editorWell=node("div","r2-editor-well"),
    lineNumbers=node("div","r2-line-numbers"),
    editorFoot=node("div","r2-editor-foot",
      '<span id="r2-cursor-location">Ln 1, Col 1</span>'+
      '<span id="r2-draft-size">0 / 50000 bytes</span>'),
    terminal=node("section","r2-terminal",
      '<header class="r2-terminal-head"><span>Julia terminal</span>'+
      '<button type="button" id="r2-terminal-clear" class="r2-terminal-clear">Clear output</button></header>'),
    testDesk=node("details","r2-test-desk"),
    testPane=node("div","r2-test-panes"),
    casePane=node("section","r2-test-cases-pane"),
    resultPane=node("section","r2-test-results-pane"),
    runnerSetup=node("details","r2-runner-setup");
  lineNumbers.setAttribute("aria-hidden","true");
  const draftTitle=codePanel.querySelector(".draft-title"),
    draft=get("scratch-code"),draftActions=codePanel.querySelector(".draft-actions"),
    externalTests=get("external-tests");
  // Keep the original test controls, assertions and authentic local result targets.
  const originalTestActions=externalTests.querySelector(".external-test-actions"),
    originalTestPreview=get("external-test-details"),
    originalTestIntro=externalTests.querySelector(".external-test-run"),
    originalTestOutput=get("external-test-local-output").closest("pre");
  casePane.append(get("external-test-heading"),get("external-test-cases"),
    originalTestActions,originalTestPreview);
  resultPane.append(node("header","r2-test-results-head",
      '<span>Local Julia Test results</span><span id="r2-test-verification" role="status">Not run</span>'),
    originalTestIntro,get("external-test-feedback"),
    get("external-test-local-status"),originalTestOutput);
  testPane.append(casePane,resultPane);
  externalTests.prepend(testPane);
  testDesk.id="r2-test-desk";
  testDesk.append(node("summary","r2-test-desk-summary",
    '<strong>Julia tests</strong><span id="r2-test-case-count">0 cases</span>'),externalTests);
  testDesk.open=true;
  editorWell.append(lineNumbers,draft);
  // Canonical file actions live in the workspace toolbar: do not create copies.
  editorActions.insertBefore(draftActions,get("r2-exports"));
  editor.append(editorHead,editorActions,draftTitle,editorWell,editorFoot);
  const extras=node("details","r2-compiler-extras");
  extras.append(node("summary",null,"External compiler and comparison tools · unverified"));
  const runner=compiler.querySelector(".local-runner");
  const preview=get("local-plot-preview");
  for(const item of [...compiler.children]){
    if(item===runner||item===preview||item.classList?.contains("compiler-heading"))continue;
    extras.append(item);
  }
  if(runner){
    const status=get("local-runner-status"),
      output=get("local-runner-output").closest("pre"),
      images=get("local-runner-images");
    terminal.append(status,output,images);
    const diagnosticStatus=get("local-runner-diagnostic-status"),
      diagnosticOutput=get("local-runner-diagnostic-output").closest("pre");
    const diagnosticPane=node("section","r2-runner-diagnostics",
      '<h3 id="r2-runner-diagnostics-heading">Local Julia environment diagnostics</h3>');
    diagnosticPane.setAttribute("aria-labelledby","r2-runner-diagnostics-heading");
    diagnosticPane.append(diagnosticStatus,diagnosticOutput);
    runnerSetup.append(node("summary",null,"Local Julia connection"),runner,diagnosticPane);
    runnerSetup.open=true;
  }
  editor.append(terminal,testDesk,runnerSetup);
  // Local plot files and third-party services are separate from actual Julia execution.
  if(preview)compiler.append(preview);
  compiler.append(extras);
  editor.append(compiler);
  instructions.append(node("summary","r2-task-summary",
    '<strong id="r2-task-heading">Coding task</strong><span id="r2-task-summary-text"></span>'),codePanel);
  instructions.setAttribute("aria-labelledby","r2-task-heading");
  const wideLayout=doc.defaultView.matchMedia("(min-width:768px)");
  const adjustTask=()=>{instructions.open=wideLayout.matches;};
  adjustTask();
  wideLayout.addEventListener?.("change",adjustTask);
  layout.append(editor,instructions);code.append(layout);
  const explorerBar=node("div","r2-lab-bar"),
    explorerNav=node("nav","r2-lab-shortcuts"),
    explorerWorkbench=node("div","r2-explore-workbench"),
    explorerStage=node("div","r2-explore-stage"),
    explorerSource=node("aside","r2-explore-source",
      '<header class="r2-explore-source-head"><strong>Julia source</strong>'+
      '<span id="r2-explore-source-state"></span></header>'+
      '<div id="r2-explore-source-content"></div>'+
      '<footer class="r2-explore-source-actions">'+
      '<button id="r2-explore-open-code" type="button">Open Code workspace</button></footer>');
  explorerNav.setAttribute("aria-label","Numerical experiment shortcuts");
  explorerSource.setAttribute("aria-label","Julia code for selected numerical experiment");
  explorerBar.append(node("div","r2-lab-picker",
    '<label for="r2-lab-choice">Experiment</label><select id="r2-lab-choice"></select>'),
    explorerNav);
  explore.append(node("header","r2-inner-head",
    '<h2>Explore & experiment</h2>'),explorerBar);
  explorerWorkbench.append(explorerStage,explorerSource);
  explore.append(explorerWorkbench);
  const labIds=["numerical-explorer","elimination-lab","precision-lab",
    "fitting-lab","program-trace","factor-lab","sensitivity-lab",
    "ue02-lab","amp-root-workshop","amp-condition-workshop",
    "amp-mission-workshop","linear-methods","completion-depth",
    "plotting-workshop","repair-lab"];
  get("lab-directory")?.remove();
  for(const id of labIds){const part=get(id);if(part){
    part.classList.add("r2-lab");explorerStage.append(part);
  }}
  // Numerical controllers bind to their original DOM early during app bootstrap.
  // Mirror only the generated source text; do not move controls or code nodes.
  const sourceSpecs={
    "elimination-lab":["elim-julia","elim-copy"],
    "precision-lab":["precision-julia","precision-copy"],
    "fitting-lab":["fit-julia","fit-copy"],
    "factor-lab":["factor-julia","factor-copy"],
    "sensitivity-lab":["sensitivity-julia","sensitivity-copy"],
    "plotting-workshop":["plotting-recipe-code","plotting-recipe-copy"],
    "ue02-lab":["ue02-code","ue02-copy"]
  };
  // Explore is not connected to document until the R2 shell mounts below.
  const sourceSlot=explorerSource.querySelector("#r2-explore-source-content"),
    sourceState=explorerSource.querySelector("#r2-explore-source-state");
  const sourceView=node("pre","r2-explore-live-source");
  const sourceCopy=node("button","r2-explore-copy","Copy original Julia example");
  sourceCopy.type="button";
  const copyFeedback=node("span","r2-explore-copy-state");
  copyFeedback.setAttribute("role","status");
  const refreshSource=()=>{
    const id=get("r2-lab-choice").value,
      spec=sourceSpecs[id],
      source=spec?get(spec[0]):null;
    sourceSlot.replaceChildren();
    explorerWorkbench.dataset.hasSource=source?"true":"false";
    sourceState.textContent=source?"Original Julia example · not executed":
      "Browser calculation · not Julia execution";
    if(source){
      sourceView.textContent=source.textContent;
      sourceSlot.append(sourceView,sourceCopy,copyFeedback);
    }else{
      sourceSlot.append(node("p","r2-no-source",
        "This experiment calculates results in the browser. Open Code to run your own Julia program."));
    }
    copyFeedback.textContent="";
  };
  sourceCopy.addEventListener("click",()=>{
    const spec=sourceSpecs[get("r2-lab-choice").value],button=spec?get(spec[1]):null;
    if(!button){copyFeedback.textContent="No original Julia source is available.";return;}
    button.click();
    copyFeedback.textContent="Original Copy action requested; check the experiment's copy feedback.";
  });
  for(const [codeId] of Object.values(sourceSpecs)){
    const source=get(codeId);
    if(source)new MutationObserver(()=>{
      if(sourceSpecs[get("r2-lab-choice").value]?.[0]===codeId)
        sourceView.textContent=source.textContent;
    }).observe(source,{childList:true,characterData:true,subtree:true});
  }
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
  const lessonFor=id=>lessons.find(lesson=>lesson.id===id);
  const suggestedBefore=lesson=>String(lesson.prereq||"").split(",")
    .map(id=>id.trim()).filter(id=>lessonFor(id));
  // Presentation reads existing .nav-score counts supplied by canonical renderSidebar.
  // No new progress, grades, gating, or browser storage.
  const checkpointCount=id=>{
    const link=[...get("nav-items").querySelectorAll(".lesson-link")]
      .find(item=>item.getAttribute("href")==="#lesson/"+id);
    const text=link?.querySelector(".nav-score")?.getAttribute("aria-label")||"";
    const match=text.match(/^(\d+) out of 3 answered correctly$/);
    return match?Number(match[1]):0;
  };
  const checkpointLabel=id=>{
    const count=checkpointCount(id);
    return count>=2?"Concept reviewed ("+count+"/3 correct)":count+"/3 correct · concept not yet reviewed";
  };
  const linkedPrerequisites=(target,lesson)=>{
    const ids=suggestedBefore(lesson);
    target.replaceChildren();
    target.hidden=ids.length===0;
    if(!ids.length)return;
    const label=doc.createElement("span");label.textContent="Suggested before:";
    target.append(label);
    for(const id of ids){
      const source=lessonFor(id),anchor=doc.createElement("a");
      anchor.href="#lesson/"+id;anchor.textContent=id+" · "+source.title;
      anchor.setAttribute("aria-label","Open suggested lesson "+id+": "+source.title);
      target.append(anchor);
    }
  };
  function decorateCourseRows(){
    const nav=get("nav-items"),groups=[...nav.querySelectorAll(".nav-group")];
    if(groups.length===0)return;
     for(const group of groups){
      let stageReviewed=0;
      const links=[...group.querySelectorAll(".lesson-link")];
      for(const link of links){
        const id=link.getAttribute("href")?.match(/^#lesson\/(\d{2})$/)?.[1];
        const lesson=lessonFor(id);if(!lesson)continue;
        const score=checkpointCount(id),done=score>=2;
        if(done)stageReviewed++;
        let details=link.querySelector(".r2-syllabus-details");
        if(!details){details=doc.createElement("span");details.className="r2-syllabus-details";
          link.querySelector(".lesson-link-name")?.append(details);}
        const prereqs=suggestedBefore(lesson);
        details.textContent=lesson.minutes+" min"+(prereqs.length?
          " · Suggested before: "+prereqs.join(", "):"");
        link.dataset.checkpoint=done?"reviewed":score?"started":"unreviewed";
        const badge=link.querySelector(".nav-score");
        if(badge){badge.textContent=done?"Reviewed":score+"/3 correct";}
      }
      let status=group.querySelector(".r2-group-progress");
      if(!status){status=doc.createElement("span");status.className="r2-group-progress";
        group.querySelector("h3")?.append(status);}
      status.textContent=stageReviewed+" / "+links.length+" concept reviewed";
    }
    if(lessonFor(currentLesson))
      get("r2-lesson-checkpoint").textContent=checkpointLabel(currentLesson);
  }
  // renderSidebar replaces the stage children after each canonical answer.
  new MutationObserver(decorateCourseRows).observe(get("nav-items"),{childList:true});
  const resumeButton=get("r2-resume-current");

  function showView(view){
    currentView=view;doc.body.dataset.r2View=view;
    // Reuse the canonical Continue choice whenever the syllabus is reopened.
    if(view==="course"){
      decorateCourseRows();
      get("r2-course-progress").textContent=get("progress-label").textContent;
      get("r2-hero-continue").textContent=get("continue-lesson").textContent+" →";
      updateCoursePreview();
    }
    // Settings are a first-class Tools destination, not a hidden compiler toggle.
    if(view==="utilities")get("settings-panel").hidden=false;
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
    question=Math.max(0,Math.min(question,Math.max(0,qs.length-1)));
    qs.forEach((q,i)=>{
      q.classList.toggle("r2-question-inactive",i!==question);
      const title=q.querySelector("h3");if(title)title.tabIndex=-1;
    });
    get("r2-question-index").textContent="Question "+(question+1)+" of "+qs.length;
    const steps=get("r2-question-steps");
    steps.replaceChildren(...qs.map((item,i)=>{
      const state=item.querySelector(".question-head .correct")?"Correct":
        item.querySelector(".question-head .retry")?"Try again":
        item.querySelector(".choice.selected")?"Answered":"Unanswered";
      const button=doc.createElement("button");
      button.type="button";button.textContent=String(i+1).padStart(2,"0");
      button.dataset.r2Question=String(i);button.dataset.state=state;
      button.setAttribute("aria-label","Question "+(i+1)+" · "+state);
      button.setAttribute("aria-current",i===question?"step":"false");
      button.addEventListener("click",()=>{
        question=i;syncQuestions();
        get("questions").querySelector(".question:not(.r2-question-inactive) h3")?.focus?.({preventScroll:true});
      });
      return button;
    }));
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
  const quickLabs=[
    ["numerical-explorer","Norms & matrices"],["elimination-lab","Elimination"],
    ["factor-lab","QR & Cholesky"],["sensitivity-lab","Conditioning"],
    ["fitting-lab","Least squares"],["precision-lab","Floating point"],
    ["plotting-workshop","Plots.jl"]
  ];
  function syncLabs(){
    const choice=get("r2-lab-choice"),prior=choice.value;
    const available=labIds.map(get).filter(n=>n&&!n.hidden);
    choice.replaceChildren(...available.map(n=>{
      const opt=doc.createElement("option");opt.value=n.id;
      opt.textContent=n.querySelector("h2")?.textContent.trim()||"Julia lab";return opt;
    }));
    choice.value=available.some(x=>x.id===prior)?prior:available[0]?.id||"";
    choice.parentElement.hidden=available.length<2;
    for(const n of labIds.map(get).filter(Boolean))
      n.classList.toggle("r2-lab-inactive",n.id!==choice.value);
    explorerNav.replaceChildren(...quickLabs.filter(([id])=>available.some(x=>x.id===id))
      .map(([id,label])=>{
        const button=doc.createElement("button");
        button.type="button";button.textContent=label;
        button.dataset.lab=id;
        if(id===choice.value)button.setAttribute("aria-current","true");
        button.addEventListener("click",()=>{
          choice.value=id;syncLabs();
          explorerWorkbench.scrollIntoView({block:"start"});
        });
        return button;
      }));
    explorerBar.dataset.lab=choice.value;
    refreshSource();
  }
  get("r2-lab-choice").addEventListener("change",syncLabs);
  get("r2-explore-open-code").addEventListener("click",()=>showStage("code"));
  function updateCoursePreview(){
    // Follow the existing course Continue policy; do not calculate another progress state.
    const index=Number(get("continue-lesson").dataset.index);
    const lesson=lessons[Number.isInteger(index)&&index>=0&&index<lessons.length?index:0];
    get("r2-next-lesson-title").textContent=lesson.id+" · "+lesson.title;
    get("r2-next-lesson-goal").textContent=lesson.goal;
    get("r2-preview-mode").textContent=
      get("continue-lesson").textContent.startsWith("Review lesson ")?
        "REVIEW · LESSON SOURCE":"UP NEXT · LESSON SOURCE";
    get("r2-next-lesson-code").textContent=lesson.example;
    get("r2-next-lesson-source").textContent=lesson.source;
    get("r2-preview-checkpoint").textContent=checkpointLabel(lesson.id);
    linkedPrerequisites(get("r2-preview-prereqs"),lesson);
    nextPreview.dataset.lessonId=lesson.id;
    const selected=get("lesson-jump").value;
    resumeButton.hidden=!lessonFor(selected)||(selected===lesson.id&&currentStage==="learn");
    resumeButton.textContent="Return to "+selected+" · "+currentStage[0].toUpperCase()+currentStage.slice(1);
  }
  function update(id){
    const lesson=lessons.find(l=>l.id===id)||lessons[0];
    get("r2-lesson-unit").textContent=lesson.stage+" / "+lesson.id;
    linkedPrerequisites(get("r2-lesson-prereqs"),lesson);
    get("r2-lesson-checkpoint").textContent=checkpointLabel(lesson.id);
    const index=lessons.indexOf(lesson);
    const previous=get("r2-lesson-previous"),next=get("r2-lesson-next");
    previous.disabled=index===0;next.disabled=index===lessons.length-1;
    if(index>0)previous.setAttribute("aria-label","Previous: "+lessons[index-1].title);
    if(index<lessons.length-1)next.setAttribute("aria-label","Next: "+lessons[index+1].title);
    get("r2-course-progress").textContent=get("progress-label").textContent;
    get("r2-hero-continue").textContent=get("continue-lesson").textContent+" →";
    updateCoursePreview();
    get("r2-reading-source").textContent=lesson.source;
    get("r2-example-source").textContent=lesson.source;
    get("r2-check-source").textContent=lesson.source;
    get("r2-check-code").textContent=lesson.example;
    get("r2-example-feedback").textContent="";
    get("r2-task-summary-text").textContent=get("challenge-text").textContent;
    doc.defaultView.queueMicrotask(()=>{updateCursor();syncTestAccess();});
    const lessonChanged=currentLesson!==id;
    if(lessonChanged){question=0;currentLesson=id;}
    get("lesson-jump").value=id;syncLabs();syncQuestions();
    const target=nextStage||"learn";nextStage=null;showStage(target);
    if(lessonChanged)get("lesson-title").focus({preventScroll:true});
  }
  get("r2-hero-continue").addEventListener("click",()=>get("continue-lesson").click());
  resumeButton.addEventListener("click",()=>{
    const id=get("lesson-jump").value;
    if(!lessonFor(id))return;
    nextStage=currentStage;
    const route="#lesson/"+id;
    if(location.hash===route){showStage(nextStage);nextStage=null;}
    else location.hash=route;
  });
  get("r2-lesson-previous").addEventListener("click",()=>{
    const index=lessons.findIndex(l=>l.id===get("lesson-jump").value);
    if(index>0)navigate(index-1);
  });
  get("r2-lesson-next").addEventListener("click",()=>{
    const index=lessons.findIndex(l=>l.id===get("lesson-jump").value);
    if(index>=0&&index<lessons.length-1)navigate(index+1);
  });
  get("r2-next-code").addEventListener("click",()=>{
    const id=nextPreview.dataset.lessonId;
    if(!lessons.some(l=>l.id===id))return;
    const target="#lesson/"+id;
    if(location.hash===target)showStage("code");
    else{nextStage="code";location.hash=target;}
  });
  function openAux(name){
    const id=get("lesson-jump").value;
    location.hash=(name==="course"?"#course":"#"+name+"/"+id);
    show(name);
  }
  for(const name of ["course","mixed","utilities"]){
    get("r2-"+name+"-open").addEventListener("click",()=>openAux(name));
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
  get("r2-example-code").addEventListener("click",()=>showStage("code"));
  get("r2-review-concept").addEventListener("click",()=>showStage("learn"));
  get("r2-check-code-button").addEventListener("click",()=>showStage("code"));
  get("r2-copy-example").addEventListener("click",async()=>{
    const feedback=get("r2-example-feedback"),source=get("example-code").textContent;
    try{
      await doc.defaultView.navigator.clipboard.writeText(source);
      feedback.textContent="Example copied.";
    }catch{
      feedback.textContent="Clipboard unavailable. Select the example text to copy.";
    }
  });
  const runOriginal=()=>get("local-runner-run").click();
  get("r2-run").addEventListener("click",runOriginal);
  get("r2-terminal-clear").addEventListener("click",()=>get("local-runner-clear").click());
  get("r2-exports").addEventListener("click",()=>{
    openAux("utilities");get("submission-workflow").open=true;
  });
  const testsJump=get("r2-tests-jump"),testCases=get("external-test-cases"),
    actualTestStatus=get("external-test-local-status");
  // Presentation is observational: never parse terminal text as a grade or infer
  // success from presence of generated cases. Verdicts belong to the local runner.
  const syncTestAccess=()=>{
    const available=!externalTests.hidden;
    testDesk.hidden=!available;testsJump.hidden=!available;
    get("r2-test-case-count").textContent=testCases.children.length+" source test cases";
    const verdict=actualTestStatus.textContent.trim();
    get("r2-test-verification").textContent=verdict||"Not run";
  };
  new MutationObserver(syncTestAccess).observe(externalTests,{attributes:true,attributeFilter:["hidden"]});
  new MutationObserver(syncTestAccess).observe(testCases,{childList:true});
  new MutationObserver(syncTestAccess).observe(actualTestStatus,{childList:true,characterData:true,subtree:true});
  testsJump.addEventListener("click",()=>{
    if(externalTests.hidden)return;
    testDesk.open=true;testDesk.scrollIntoView({block:"start"});
    const heading=get("external-test-heading");
    heading.setAttribute("tabindex","-1");heading.focus({preventScroll:true});
  });
  syncTestAccess();
  const updateCursor=()=>{
    const before=draft.value.slice(0,draft.selectionStart),row=before.split("\n");
    get("r2-cursor-location").textContent="Ln "+row.length+", Col "+(row.at(-1).length+1);
    const bytes=new TextEncoder().encode(draft.value).length;
    get("r2-draft-size").textContent=bytes+" / 50000 bytes";
    lineNumbers.textContent=Array.from({length:draft.value.split("\n").length},(_,i)=>i+1).join("\n");
    lineNumbers.scrollTop=draft.scrollTop;
    get("r2-editor-status").textContent=
      get("draft-feedback")?.textContent?.toLowerCase().includes("unsaved")?
        "Unsaved — copy source":"Saved locally";
  };
  draft.addEventListener("input",()=>doc.defaultView.queueMicrotask(updateCursor));
  draft.addEventListener("click",updateCursor);
  draft.addEventListener("keyup",updateCursor);
  draft.addEventListener("scroll",()=>{lineNumbers.scrollTop=draft.scrollTop;});
  draft.addEventListener("keydown",event=>{
    if((event.ctrlKey||event.metaKey)&&event.key==="Enter"&&!event.isComposing){
      event.preventDefault();runOriginal();
    }
  });
  const runButton=get("local-runner-run");
  const syncRunState=()=>{
    const busy=runButton.disabled;
    get("r2-run").disabled=busy;
    get("r2-run").textContent=busy?"Running Julia…":"Run Julia";
    get("r2-mobile-next").disabled=busy&&currentStage==="code";
  };
  new MutationObserver(syncRunState).observe(runButton,{attributes:true,attributeFilter:["disabled"]});
  syncRunState();
  get("semester-rehearsal-open").addEventListener("click",()=>{
    openAux("mixed");
  });
  get("lesson-jump").replaceChildren(...lessons.map(l=>{
    const opt=doc.createElement("option");opt.value=l.id;
    opt.textContent=l.id+" · "+l.title;return opt;
  }));
  get("lesson-jump").addEventListener("change",()=>{
    const i=lessons.findIndex(x=>x.id===get("lesson-jump").value);
    if(i>=0)navigate(i);
  });
  updateCursor();
  return {show,showStage,update,selectLab:id=>{
    const choice=get("r2-lab-choice");
    if([...choice.options].some(opt=>opt.value===id)){
      choice.value=id;syncLabs();
    }
  },setNextStage:s=>{if(validStages.includes(s))nextStage=s;},
    getView:()=>currentView,getStage:()=>currentStage};
}
