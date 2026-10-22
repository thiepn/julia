import {lessons, stages} from "./lessons.js";
import {initLocalRunner} from "./local-runner-client.js";
import {initSubmissionWorkflow} from "./submission-workflow.js";
import {initPlotPreview} from "./plot-preview.js";
import {initPlottingPractice} from "./plotting-practice.js";
import {initUe02Practice} from "./ue02-practice.js";
import {initAmpWorkshops} from "./amp-workshops.js";
import {initCompletionDepth} from "./completion-view.js";
import {initCourseBackup} from "./course-backup-ui.js";
import {readProgress, writeProgress, readEmbedUrl, writeEmbedUrl,
  validateEmbedUrl, checkChoice, countCorrect, readyForChallenge, checkPastedOutput} from "./checks.js";
import {readDraft, writeDraft, clearDraft} from "./workspace.js";
import {inspectEmbedMessage} from "./jdoodle-bridge.js";
import {exportJuliaScript, validateJuliaImport, MAX_IMPORT_BYTES} from "./transfer.js";
import {questionFeedback} from "./feedback.js";
import {repairForLesson} from "./repair-cases.js";
import {readRepair, writeRepair, clearRepair, compareRepairText} from "./repair-workspace.js";
import {initNumericalExplorer,showNumericalExplorer} from "./numerical-view.js";
import {initEliminationLab,showEliminationLab} from "./elimination-view.js";
import {initPrecisionLab,showPrecisionLab} from "./precision-view.js";
import {initFittingLab,showFittingLab} from "./fitting-view.js";
import {initLinearMethods,showLinearMethods} from "./linear-methods-view.js";
import {initProgramTrace,showProgramTrace} from "./program-trace-view.js";
import {initFactorLab,showFactorLab} from "./factor-view.js";
import {initSensitivityLab,showSensitivityLab} from "./sensitivity-view.js";
import {transferForLesson} from "./transfer-cases.js";
import {readTransferDraft,writeTransferDraft,clearTransferDraft} from "./transfer-drafts.js";
import {externalTestSuite,buildExternalTestFile} from "./external-tests.js";
import {inspectJuliaReport} from "./julia-report.js";
import {propertiesForTask,buildPropertyFile} from "./property-transfer.js";
import {contractForTask,designScaffold} from "./algorithm-design.js";
import {missionForLesson} from "./numerical-missions.js";
import {integrationForLesson,buildIntegrationTestFile} from "./integration-task.js";

const $ = (selector) => document.querySelector(selector);
let currentIndex = 0;
let practiceVariant = "original";
let unsavedPractice = false;
const current = () => lessons[currentIndex];
const localRunner=initLocalRunner({getDraft:()=>$("#scratch-code").value,
  getIdentity:()=>current().id+":"+practiceVariant,embedActive:()=>Boolean(readEmbedUrl()),
  onResult:data=>submission.onRun(data),onClear:()=>submission.invalidateRun()});
const submission=initSubmissionWorkflow({download:downloadLocalJulia,
  getDraft:()=>$("#scratch-code").value,
  getIdentity:()=>current().id+":"+practiceVariant,
  embedActive:()=>Boolean(readEmbedUrl()),
  disableEmbed:()=>$("#local-runner-disable-embed").click()});
const plotPreview = initPlotPreview();
const plottingPractice = initPlottingPractice();
const ue02Practice = initUe02Practice();
const ampWorkshops = initAmpWorkshops({download:downloadLocalJulia,getDraft:()=>$("#scratch-code").value});
const depthPractice=initCompletionDepth({download:downloadLocalJulia,getDraft:()=>$("#scratch-code").value});
const courseBackup=initCourseBackup({download:downloadLocalJulia,isEmbedActive:()=>Boolean(readEmbedUrl()),
  disableEmbed:()=>$("#local-runner-disable-embed").click()});
const progress = readProgress();
// Diagnostics are opt-in and ephemeral. No provider code/output is retained.
let diagnosticCount = 0;
let diagnosticLast = null;
let lifecycleOnLoadObserved = false;
function renderDiagnostics() {
  const lifecycle = lifecycleOnLoadObserved
    ? "JDoodle sent an onLoad notification. Julia execution remains unverified. "
    : "";
  const description = diagnosticCount
    ? diagnosticCount + " JDoodle-frame message(s) received; latest marker: " + diagnosticLast.marker +
      " (" + diagnosticLast.format + "). Event meanings are unverified; no code was graded."
    : "No matching diagnostic messages observed. This does not establish whether the editor can run Julia.";
  $("#bridge-status").textContent = lifecycle + description;
}
window.addEventListener("message", (event) => {
  const details = $("#bridge-diagnostics");
  const frame = document.querySelector(".jdoodle-embed iframe");
  const inspected = inspectEmbedMessage(event, frame, readEmbedUrl());
  if (!inspected) return;
  // The observed onLoad event arrives during initial iframe startup, usually
  // before the diagnostics panel is opened. Track only this narrow signal
  // without retaining any code/output/payload or claiming an executed program.
  if (inspected.marker === "onLoad") {
    lifecycleOnLoadObserved = true;
    if (details?.open) renderDiagnostics();
    return;
  }
  if (!details?.open) return;
  diagnosticCount++;
  diagnosticLast = inspected;
  renderDiagnostics();
});
const safe = (value) => String(value).replace(/[&<>"']/g, char =>
  ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

function nextConceptIndex() {
  const index = lessons.findIndex(lesson => !readyForChallenge(lesson, progress));
  return index === -1 ? lessons.length - 1 : index;
}
function renderContinue() {
  const index=nextConceptIndex();
  const item=lessons[index];
  const done=lessons.every(lesson => readyForChallenge(lesson, progress));
  $("#continue-lesson").textContent = (done ? "Review lesson " : "Continue lesson ") + item.id + " · " + item.title;
  $("#continue-lesson").dataset.index=String(index);
  $("#continue-detail").textContent=done
    ? "All concept sets reviewed. Coding tasks remain unverified."
    : item.stage;
}

function lessonIndexFromHash() {
  const match = location.hash.match(/^#lesson\/(\d{2})$/);
  return Math.max(0, lessons.findIndex(l => l.id === (match?.[1] || "01")));
}
function navigate(index) {
  const chosen = Math.max(0, Math.min(lessons.length-1, index));
  location.hash = "#lesson/" + lessons[chosen].id;
  if (currentIndex === chosen) render();
}
function renderSidebar() {
  const mastered = lessons.filter(l => readyForChallenge(l, progress)).length;
  $("#progress-fill").style.width = ((mastered / lessons.length) * 100) + "%";
  $("#progress-label").textContent = mastered + " of " + lessons.length + " concept sets reviewed";
  renderContinue();
  $("#nav-items").innerHTML = stages.map(stage => {
    const items = lessons.filter(l => l.stage === stage);
    return '<div class="nav-group"><h3>' + safe(stage) + '</h3>' +
      items.map(l => {
        const idx = lessons.indexOf(l), count = countCorrect(l, progress);
        return '<a class="lesson-link ' + (idx===currentIndex ? "active" : "") +
          '" href="#lesson/' + l.id + '" aria-current="' + (idx===currentIndex?"page":"false") + '">' +
          '<span class="lesson-number">' + l.id + '</span><span class="lesson-link-name">' + safe(l.title) +
          '</span><span class="nav-score" aria-label="'+count+' out of 3 answered correctly">' +
          (count>=2 ? "✓" : (count? count+"/3" : "·")) + "</span></a>";
      }).join("") + "</div>";
  }).join("");
}
function renderQuestions() {
  const l = current();
  $("#questions").innerHTML = l.questions.map((q, i) => {
    const key = l.id + ":" + i, chosen = progress[key];
    const answered = Number.isInteger(chosen);
    const isRight = answered && checkChoice(l,i,chosen);
    const detail = answered ? questionFeedback(l,i,chosen) : null;
    return '<div class="question"><div class="question-head"><span>QUESTION ' + (i+1) + ' / 3</span>' +
      (answered ? ('<span class="'+(isRight?"correct":"retry")+'">' + (isRight?"Correct":"Try again") + '</span>') : "") +
      '</div><h3>' + safe(q.q) + '</h3><div class="choices">' +
      q.choices.map((choice, j) => '<button type="button" data-question="' + i +
        '" data-choice="' + j + '" class="choice ' + (chosen===j?"selected":"") +
        '" aria-pressed="'+(chosen===j ? "true" : "false")+'">' +
        '<span>' + String.fromCharCode(65+j) + '</span>' + safe(choice) + '</button>').join("") + '</div>' +
      (detail ? '<p class="answer-reason ' + (detail.correct ? "right":"wrong") +
        '" role="status">' + safe(detail.explanation) + '</p>' : "") +
      '<details class="question-hint"><summary>Need a hint?</summary><p>' + safe(q.hint) +
      '</p></details></div>';
  }).join("");
  const correct=countCorrect(l,progress);
  $("#concept-brief").textContent=correct>=2
    ? correct + "/3 correct · Concept checkpoint reviewed. Coding task not verified."
    : correct + "/3 correct · Answer at least two to review this concept checkpoint.";
  document.querySelectorAll(".choice").forEach(button => {
    button.addEventListener("click", () => {
      const i = Number(button.dataset.question), choice = Number(button.dataset.choice);
      progress[l.id + ":" + i] = choice;
      writeProgress(progress);
      renderQuestions();
      renderSidebar();
    });
  });
}
function renderRepair() {
  const r=repairForLesson(current().id);
  $("#repair-title").textContent=r.title;
  $("#repair-objective").textContent=r.objective;
  $("#repair-expected").textContent=r.expected;
  $("#repair-editor").value=readRepair(r.id,r.broken);
  $("#repair-feedback").textContent="Draft not executed or graded.";
  $("#repair-feedback").dataset.status="";
  $("#repair-hint-1").open=false;
  $("#repair-hint-1").querySelector("p").textContent=r.hints[0];
  $("#repair-hint-2").open=false;
  $("#repair-hint-2").querySelector("p").textContent=r.hints[1];
  $("#repair-reference").open=false;
  $("#repair-reference-code").textContent=r.reference;
  $("#repair-cause").textContent=r.cause;
}
function activePractice(){
  const original=current();
  return practiceVariant==="original"?{
    title:"Original lesson",task:original.challenge,starter:original.starter,checks:original.checks
  }:practiceVariant==="mission"?missionForLesson(original.id):practiceVariant==="integration"?integrationForLesson(original.id):transferForLesson(original.id,practiceVariant);
}
function writePracticeCode(lesson,variant,code){
  return variant==="original"?writeDraft(lesson,code):writeTransferDraft(lesson,variant,code);
}
function clearPracticeCode(lesson,variant){
  return variant==="original"?clearDraft(lesson):clearTransferDraft(lesson,variant);
}
function renderPropertyTransfer(){
  const props=propertiesForTask(current().id,practiceVariant);
  $("#property-lab").hidden=props.length===0;
  if(!props.length)return;
  const select=$("#property-choice");
  const prior=select.value;
  select.replaceChildren();
  const none=document.createElement("option");none.value="";none.textContent="Choose a property";select.append(none);
  for(const p of props){
    const option=document.createElement("option");option.value=p.id;option.textContent=p.name;select.append(option);
  }
  select.value=props.some(p=>p.id===prior)?prior:"";
  const selected=props.find(p=>p.id===select.value);
  $("#property-question").textContent=selected?.question??"";
  $("#property-reason-text").textContent=selected?.reason??"";
  $("#property-reason").hidden=!selected;
  $("#property-code-details").hidden=!selected;
  $("#property-source").textContent="";
  $("#property-one-download").disabled=true;
  $("#property-all-download").disabled=true;
  try{
    buildPropertyFile(current().id,practiceVariant,$("#scratch-code").value);
    $("#property-all-download").disabled=false;
    if(selected){
      $("#property-source").textContent=buildPropertyFile(current().id,practiceVariant,$("#scratch-code").value,selected.id).content;
      $("#property-one-download").disabled=false;
    }
  }catch{
    $("#property-feedback").textContent="Could not prepare the property file. Check the current source length.";
  }
}
function renderFocusedCase(){
  const name=$("#external-focus-case").value;
  const suite=externalTestSuite(current().id,practiceVariant);
  const valid=!!name&&!!suite?.cases.some(c=>c.name===name);
  $("#external-focus-download").disabled=!valid;
  $("#external-focus-copy").disabled=!valid;
  $("#external-focus-preview").textContent=valid?
    buildExternalTestFile(current().id,practiceVariant,$("#scratch-code").value,name).content:"";
}
function renderExternalTestHandoff(){
  const suite=externalTestSuite(current().id,practiceVariant);
  $("#external-tests").hidden=!suite;
  if(!suite){renderPropertyTransfer();return;}
  const previous=$("#external-focus-case").value;
  const select=$("#external-focus-case");
  select.replaceChildren();
  const placeholder=document.createElement("option");
  placeholder.value="";placeholder.textContent="Choose a case";select.append(placeholder);
  for(const item of suite.cases){
    const option=document.createElement("option");
    option.value=item.name;option.textContent=item.name;select.append(option);
  }
  select.value=suite.cases.some(c=>c.name===previous)?previous:"";
  $("#external-test-heading").textContent="Run Julia tests for "+suite.title;
  const list=$("#external-test-cases");
  list.replaceChildren();
  for(const item of suite.cases){
    const li=document.createElement("li");
    li.textContent=item.name+": "+item.assertion;
    list.append(li);
  }
  try{
    const file=buildExternalTestFile(current().id,practiceVariant,$("#scratch-code").value);
    $("#external-test-preview").textContent=file.content;
    $("#external-test-download").disabled=false;
    $("#external-test-copy").disabled=false;
  }catch{
    $("#external-test-preview").textContent="";
    $("#external-test-download").disabled=true;
    $("#external-test-copy").disabled=true;
  }
  renderFocusedCase();
  renderPropertyTransfer();
}
function downloadLocalJulia(script){
  const url=URL.createObjectURL(new Blob([script.content],{type:script.mime}));
  const link=document.createElement("a");
  link.href=url;
  link.download=script.filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function renderAlgorithmDesign(){
  const contract=contractForTask(current().id,practiceVariant);
  $("#algorithm-design").hidden=!contract;
  if(!contract)return;
  $("#algorithm-contract-input").textContent=contract.inputs;
  $("#algorithm-contract-output").textContent=contract.output;
  const stages=$("#algorithm-design-stages");
  stages.replaceChildren();
  for(const [i,step] of contract.steps.entries()){
    const item=document.createElement("li");
    const heading=document.createElement("strong");
    heading.textContent=(i+1)+". "+step.label;
    const question=document.createElement("p");question.textContent=step.question;
    const detail=document.createElement("details");
    const summary=document.createElement("summary");summary.textContent="Design guidance";
    const explanation=document.createElement("p");explanation.textContent=step.guide;
    detail.append(summary,explanation);
    item.append(heading,question,detail);
    stages.append(item);
  }
  $("#algorithm-scaffold").textContent=designScaffold(current().id,practiceVariant);
  $("#algorithm-scaffold-details").open=false;
  $("#algorithm-design-feedback").textContent="";
}
function integrationSourceBundle(){
  const solverSaved=readTransferDraft("12","mission",null);
  const sensitivitySaved=readTransferDraft("16","mission",null);
  return {
    solver:solverSaved===null?missionForLesson("12").starter:solverSaved,
    sensitivity:sensitivitySaved===null?missionForLesson("16").starter:sensitivitySaved,
    solverSaved:solverSaved!==null,sensitivitySaved:sensitivitySaved!==null
  };
}
function renderIntegrationTask(){
  const active=current().id==="16"&&practiceVariant==="integration";
  $("#integration-handoff").hidden=!active;
  if(!active)return;
  const dep=integrationSourceBundle();
  $("#integration-solver-state").textContent=dep.solverSaved?"Saved local draft":"Starter only — no saved draft";
  $("#integration-sensitivity-state").textContent=dep.sensitivitySaved?"Saved local draft":"Starter only — no saved draft";
  $("#integration-feedback").textContent="";
  try{
    const script=buildIntegrationTestFile($("#scratch-code").value,dep.solver,dep.sensitivity);
    $("#integration-preview").textContent=script.content;
    $("#integration-download").disabled=false;
    $("#integration-copy").disabled=false;
  }catch{
    $("#integration-preview").textContent="";
    $("#integration-download").disabled=true;
    $("#integration-copy").disabled=true;
    $("#integration-feedback").textContent="Cannot combine drafts; check source lengths.";
  }
}
function renderPractice(){
  localRunner.clear();
  submission.onSourceChange();
  const lesson=current(),item=activePractice(),transfer=practiceVariant!=="original";
  const mission=missionForLesson(lesson.id);
  $("#practice-mode").querySelector('[value="mission"]').hidden=!mission;
  $("#practice-mode").querySelector('[value="mission"]').disabled=!mission;
  const integration=integrationForLesson(lesson.id);
  $("#practice-mode").querySelector('[value="integration"]').hidden=!integration;
  $("#practice-mode").querySelector('[value="integration"]').disabled=!integration;
  $("#practice-mode").value=practiceVariant;
  for(const variant of ["a","b"]){
    $("#practice-mode").querySelector('[value="'+variant+'"]').textContent=
      "Transfer "+variant.toUpperCase()+" · "+transferForLesson(lesson.id,variant).title;
  }
  $("#challenge-text").textContent=item.task;
  $("#starter-code").textContent=item.starter;
  $("#challenge-checks").textContent=item.checks;
  $("#scratch-code").value=transfer?
    readTransferDraft(lesson.id,practiceVariant,item.starter):readDraft(lesson.id,item.starter);
  $("#transfer-plan").hidden=!transfer;
  $("#transfer-tests").hidden=!transfer;
  $("#transfer-plan").open=false;
  $("#transfer-tests").open=false;
  if(transfer){
    $("#transfer-plan").querySelector("p").textContent=item.plan;
    $("#transfer-tests").querySelector("p").textContent=item.verify;
  }
  [1,2,3].forEach(i=>$("#hint-"+i).hidden=transfer);
  unsavedPractice=false;
  $("#draft-feedback").textContent=transfer
    ?"Independent "+practiceVariant.toUpperCase()+" draft saved separately in this browser; not executed or graded."
    :"Saved only in this browser; not executed or automatically graded.";
  $("#external-test-feedback").textContent="";
  $("#external-test-details").open=false;
  $("#external-focus-case").value="";
  $("#property-choice").value="";
  $("#property-reason").open=false;
  $("#property-code-details").open=false;
  $("#property-feedback").textContent="";
  $("#external-focus-details").open=false;
  $("#external-focus-feedback").textContent="";
  $("#external-report-input").value="";
  $("#external-report-results").replaceChildren();
  $("#external-report-details").open=false;
  renderExternalTestHandoff();
  renderAlgorithmDesign();
  renderIntegrationTask();
}
function render() {
  localRunner.clear();
  submission.onSourceChange();
  practiceVariant="original";
  currentIndex = lessonIndexFromHash();
  const l = current();
  $("#lesson-meta").innerHTML = '<span class="eyebrow">LESSON '+l.id+' / 16</span><span>' +
    l.minutes + ' MIN</span><span>' + safe(l.source) + '</span>';
  $("#lesson-title").textContent = l.title;
  $("#lesson-goal").textContent = l.goal;
  showNumericalExplorer(l.id);
  showEliminationLab(l.id);
  showPrecisionLab(l.id);
  showFittingLab(l.id);
  showLinearMethods(l.id);
  showProgramTrace(l.id);
  showFactorLab(l.id);
  showSensitivityLab(l.id);
  plotPreview.showForLesson(l.id);
  plottingPractice.showForLesson(l.id);
  ue02Practice.showForLesson(l.id);
  ampWorkshops.showForLesson(l.id);
  depthPractice.showForLesson(l.id);
  $("#repair-section-number").textContent=["03","05","06","07","08","09","10","11","12","13","14","15","16"].includes(l.id)?"05":"04";
  $("#lesson-theory").textContent = l.theory;
  $("#example-code").textContent = l.example;
  renderRepair();
  [1,2,3].forEach(i => {
    const el = $("#hint-"+i); el.open = false;
    el.querySelector("p").textContent = l.hints[i-1];
  });
  renderPractice();
  $("#previous").disabled = currentIndex===0;
  $("#next").disabled = currentIndex===lessons.length-1;
  $("#output-input").value = "";
  $("#output-feedback").textContent = "";
  renderQuestions(); renderSidebar();
  window.scrollTo(0, 0);
  document.title = l.title + " — Julia Lab";
}
function setupEmbed() {
  const url = readEmbedUrl();
  $("#embed-url").value = url;
  const slot = $("#embed-slot");
  if (!validateEmbedUrl(url)) {
    $("#runtime-state").textContent = "Embed disabled";
    slot.replaceChildren();
    const notice = document.createElement("div");
    notice.className = "placeholder";
    notice.id = "embed-placeholder";
    notice.innerHTML = "<strong>Compiler not connected</strong><p>The JDoodle editor is disabled in this browser. Use an external link, or restore the course editor in settings.</p>";
    slot.append(notice);
    return;
  }
  $("#runtime-state").textContent = "JDoodle configured · unverified";
  slot.replaceChildren();
  const embed = document.createElement("div");
  embed.setAttribute("data-pym-src", url);
  embed.className = "jdoodle-embed";
  slot.append(embed);
  const script = document.createElement("script");
  script.src = "https://www.jdoodle.com/assets/jdoodle-pym.min.js";
  script.async = true;
  script.onload = () => {
    // Pym loader arriving is not proof of a functioning Julia runtime or executed program.
    if ($("#runtime-state").textContent !== "Embed failed to load")
      $("#runtime-state").textContent = "Editor script loaded · unverified";
  };
  script.onerror = () => {
    $("#runtime-state").textContent = "Embed failed to load";
    const notice = document.createElement("p");
    notice.className = "error";
    notice.textContent = "JDoodle could not be loaded. Use the external compiler links below.";
    slot.append(notice);
  };
  document.body.append(script);
}
$("#repair-editor").addEventListener("input",()=>{
  const r=repairForLesson(current().id);
  const saved=writeRepair(r.id,$("#repair-editor").value);
  $("#repair-feedback").textContent=saved
    ? "Repair draft saved in this browser. Julia execution not verified."
    : "Could not save repair (storage unavailable or text too long). Copy the text elsewhere.";
  $("#repair-feedback").dataset.status=saved?"saved":"error";
});
$("#repair-compare").addEventListener("click",()=>{
  const r=repairForLesson(current().id);
  const matches=compareRepairText($("#repair-editor").value,r.reference).matches;
  $("#repair-feedback").textContent=matches
    ? "Text matches the reference example. This does not verify Julia execution or alternative inputs."
    : "Text differs from the reference example. Your repair may still be valid; compare the algorithm, then run it in Julia.";
  $("#repair-feedback").dataset.status=matches?"match":"different";
});
$("#repair-copy").addEventListener("click",async()=>{
  try{
    await navigator.clipboard.writeText($("#repair-editor").value);
    $("#repair-feedback").textContent="Repair code copied. Run it in Julia, JDoodle or OneCompiler to check behavior.";
  }catch{
    $("#repair-feedback").textContent="Clipboard unavailable. Select the repair code and copy it manually.";
  }
});
$("#repair-reset").addEventListener("click",()=>{
  const r=repairForLesson(current().id);
  if(!window.confirm("Discard the repair draft for lesson "+r.id+" and restore the buggy example?"))return;
  if(!clearRepair(r.id)){
    $("#repair-feedback").textContent="Could not reset the saved repair. Code has not changed.";
    return;
  }
  $("#repair-editor").value=r.broken;
  $("#repair-reference").open=false;
  $("#repair-feedback").textContent="Buggy example restored for this lesson.";
  $("#repair-feedback").dataset.status="";
});
$("#continue-lesson").addEventListener("click",()=>{
  navigate(nextConceptIndex());
  $("#lesson-title").focus({preventScroll:true});
});
$("#previous").addEventListener("click", () => navigate(currentIndex-1));
$("#next").addEventListener("click", () => navigate(currentIndex+1));
$("#practice-mode").addEventListener("change",()=>{
  if(unsavedPractice){
    $("#practice-mode").value=practiceVariant;
    $("#draft-feedback").textContent="Cannot switch tasks because this draft was not saved. Copy your work first.";
    return;
  }
  practiceVariant=$("#practice-mode").value;
  renderPractice();
});
$("#copy-starter").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(activePractice().starter);
    $("#output-feedback").textContent = "Starter code copied. Paste it into Julia or the embedded editor.";
  } catch {
    $("#output-feedback").textContent = "Clipboard unavailable. Select and copy the starter code shown above.";
  }
});
$("#scratch-code").addEventListener("input", () => {
  localRunner.clear();
  submission.onSourceChange();
  const saved = writePracticeCode(current().id, practiceVariant, $("#scratch-code").value);
  unsavedPractice=!saved;
  $("#external-report-results").replaceChildren();
  $("#external-report-input").value="";
  $("#external-focus-feedback").textContent="";
  $("#property-feedback").textContent="";
  renderExternalTestHandoff();
  renderIntegrationTask();
  $("#draft-feedback").textContent = saved
    ? "Draft saved locally. Execution and correctness are not verified."
    : "Could not save draft (storage unavailable or draft too large). Copy your work elsewhere.";
});
$("#external-report-inspect").addEventListener("click",()=>{
  const result=inspectJuliaReport($("#external-report-input").value,current().id,practiceVariant);
  const container=$("#external-report-results");
  container.replaceChildren();
  const heading=document.createElement("strong");heading.textContent=result.title;container.append(heading);
  const message=document.createElement("p");message.textContent=result.advice;container.append(message);
  if(result.cases.length){
    const detail=document.createElement("p");
    detail.textContent="Named test cases found in pasted text: "+result.cases.join(", ")+".";
    container.append(detail);
  }
  if(result.cases.length===1&&["failed","syntax","undefined","method"].includes(result.kind)){
    $("#external-focus-case").value=result.cases[0];
    $("#external-focus-feedback").textContent="Selected the named case from pasted text; execution remains unverified.";
    renderFocusedCase();
  }
  const provenance=document.createElement("p");
  provenance.textContent="This is user-pasted text, not authenticated Julia output or a coding grade.";
  container.append(provenance);
});
$("#algorithm-scaffold-copy").addEventListener("click",async()=>{
  try{
    await navigator.clipboard.writeText(designScaffold(current().id,practiceVariant));
    $("#algorithm-design-feedback").textContent="Julia function scaffold copied. It contains TODO steps, not a solution.";
  }catch{
    $("#algorithm-design-feedback").textContent="Clipboard unavailable. Select the displayed scaffold to copy.";
  }
});
$("#algorithm-scaffold-use").addEventListener("click",()=>{
  const source=designScaffold(current().id,practiceVariant);
  if(!window.confirm("Replace only this task's saved Julia draft with its incomplete function scaffold?"))return;
  if(!writePracticeCode(current().id,practiceVariant,source)){
    $("#algorithm-design-feedback").textContent="Draft storage unavailable. Your existing source was not replaced.";
    return;
  }
  $("#scratch-code").value=source;
  unsavedPractice=false;
  $("#external-report-input").value="";
  $("#external-report-results").replaceChildren();
  $("#external-focus-feedback").textContent="";
  $("#property-feedback").textContent="";
  renderExternalTestHandoff();
  $("#algorithm-design-feedback").textContent="Current task draft replaced by the incomplete scaffold. Implement TODO steps, then run the Julia tests.";
  $("#draft-feedback").textContent="Scaffold saved in this task's local draft. Code has not run.";
});
$("#integration-download").addEventListener("click",()=>{
  if(practiceVariant!=="integration"||current().id!=="16")return;
  try{
    const dep=integrationSourceBundle();
    const script=buildIntegrationTestFile($("#scratch-code").value,dep.solver,dep.sensitivity);
    downloadLocalJulia(script);
    $("#integration-feedback").textContent="Combined Julia Test file downloaded; execution remains unverified.";
  }catch{$("#integration-feedback").textContent="Cannot combine drafts; check source lengths.";}
});
$("#integration-copy").addEventListener("click",async()=>{
  if(practiceVariant!=="integration"||current().id!=="16")return;
  try{
    const dep=integrationSourceBundle();
    const script=buildIntegrationTestFile($("#scratch-code").value,dep.solver,dep.sensitivity);
    await navigator.clipboard.writeText(script.content);
    $("#integration-feedback").textContent="Combined Julia Test file copied; not executed or graded.";
  }catch{$("#integration-feedback").textContent="Clipboard or source unavailable. View the generated file instead.";}
});
$("#property-choice").addEventListener("change",()=>{
  $("#property-feedback").textContent="";
  $("#property-reason").open=false;
  $("#property-code-details").open=false;
  renderPropertyTransfer();
});
$("#property-one-download").addEventListener("click",()=>{
  try{
    const file=buildPropertyFile(current().id,practiceVariant,$("#scratch-code").value,$("#property-choice").value);
    downloadLocalJulia(file);
    $("#property-feedback").textContent="Downloaded "+file.filename+". Run in Julia to test your program against this relation.";
  }catch{
    $("#property-feedback").textContent="Select a valid property and check your current source length.";
  }
});
$("#property-all-download").addEventListener("click",()=>{
  try{
    const file=buildPropertyFile(current().id,practiceVariant,$("#scratch-code").value);
    downloadLocalJulia(file);
    $("#property-feedback").textContent="Downloaded "+file.filename+". Run in Julia to check all two relations.";
  }catch{
    $("#property-feedback").textContent="Could not prepare the property suite. Check the current source length.";
  }
});
$("#external-focus-case").addEventListener("change",()=>{
  $("#external-focus-feedback").textContent="";
  renderFocusedCase();
});
$("#external-focus-download").addEventListener("click",()=>{
  const name=$("#external-focus-case").value;
  if(!name)return;
  try{
    const file=buildExternalTestFile(current().id,practiceVariant,$("#scratch-code").value,name);
    downloadLocalJulia(file);
    $("#external-focus-feedback").textContent="Downloaded "+file.filename+". After repair, rerun the full suite using Download Julia test file.";
  }catch{
    $("#external-focus-feedback").textContent="Could not prepare this case. Check the selected task and source size.";
  }
});
$("#external-focus-copy").addEventListener("click",async()=>{
  const name=$("#external-focus-case").value;
  if(!name)return;
  try{
    const file=buildExternalTestFile(current().id,practiceVariant,$("#scratch-code").value,name);
    await navigator.clipboard.writeText(file.content);
    $("#external-focus-feedback").textContent="Focused Julia test copied. Run it externally, then rerun the full suite after repair.";
  }catch{
    $("#external-focus-feedback").textContent="Clipboard or selected case unavailable. Use the file preview.";
  }
});
$("#external-test-download").addEventListener("click",()=>{
  try{
    const file=buildExternalTestFile(current().id,practiceVariant,$("#scratch-code").value);
    downloadLocalJulia(file);
    $("#external-test-feedback").textContent="Downloaded "+file.filename+". Run with Julia; tests have not run in this browser.";
  }catch{
    $("#external-test-feedback").textContent="Cannot prepare the external test file; check your source length and selected task.";
  }
});
$("#external-test-copy").addEventListener("click",async()=>{
  try{
    const file=buildExternalTestFile(current().id,practiceVariant,$("#scratch-code").value);
    await navigator.clipboard.writeText(file.content);
    $("#external-test-feedback").textContent="Julia test script copied. It has not been executed or graded.";
  }catch{
    $("#external-test-feedback").textContent="Clipboard or test script unavailable. Use the displayed script if possible.";
  }
});
$("#copy-draft").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("#scratch-code").value);
    $("#draft-feedback").textContent = "Your current draft was copied. Paste it into JDoodle, OneCompiler or VS Code to run.";
  } catch {
    $("#draft-feedback").textContent = "Clipboard unavailable. Select the draft text and copy it manually.";
  }
});
$("#download-draft").addEventListener("click", () => {
  let script;
  try {
    script = exportJuliaScript(current().id, $("#scratch-code").value);
    if(practiceVariant!=="original") script.filename=script.filename.replace(/\.jl$/,"-transfer-"+practiceVariant+".jl");
  } catch {
    $("#draft-feedback").textContent = "Cannot export this draft. Check its size.";
    return;
  }
  downloadLocalJulia(script);
  $("#draft-feedback").textContent = "Downloaded " + script.filename +
    ". Open it in Julia or VS Code; downloading does not execute or grade the program.";
});
$("#import-draft").addEventListener("click",()=>$("#import-file").click());
$("#import-file").addEventListener("change", async () => {
  const input = $("#import-file");
  const file = input.files?.[0];
  const selectedLesson = current().id; // capture BEFORE asynchronous file reading
  const selectedVariant = practiceVariant;
  input.value = ""; // selecting the same file again should still trigger change
  if (!file) return;
  if (file.size > MAX_IMPORT_BYTES) {
    $("#draft-feedback").textContent = "File too large for this lesson editor (50,000 characters maximum).";
    return;
  }
  let source;
  try { source = await file.text(); }
  catch {
    $("#draft-feedback").textContent = "File could not be read. Your current work is unchanged.";
    return;
  }
  const validation = validateJuliaImport(file.name, source);
  if (!validation.ok) {
    $("#draft-feedback").textContent = validation.message + " Your current work is unchanged.";
    return;
  }
  if (current().id !== selectedLesson || practiceVariant !== selectedVariant) {
    $("#draft-feedback").textContent = "Lesson or practice task changed while reading. Import cancelled to protect drafts.";
    return;
  }
  const originalLesson = selectedLesson;
  if (!window.confirm("Replace the "+(selectedVariant==="original"?"original":"transfer "+selectedVariant.toUpperCase())+
    " code draft for lesson " + originalLesson + " with the selected .jl file?")) {
    $("#draft-feedback").textContent = "Import cancelled; your draft is unchanged.";
    return;
  }
  // Protect against a lesson navigation occurring during the asynchronous read/confirmation.
  if (current().id !== originalLesson || practiceVariant!==selectedVariant) {
    $("#draft-feedback").textContent = "Lesson or practice task changed. Import cancelled to protect drafts.";
    return;
  }
  if (!writePracticeCode(originalLesson,selectedVariant, validation.code)) {
    $("#draft-feedback").textContent = "Could not save imported code. Your existing draft is unchanged.";
    return;
  }
  $("#scratch-code").value = validation.code;
  unsavedPractice=false;
  $("#external-report-results").replaceChildren();
  $("#external-report-input").value="";
  renderExternalTestHandoff();
  $("#draft-feedback").textContent = "Imported " + file.name +
    " for this lesson. Source was saved locally but not executed or graded.";
});
$("#go-to-compiler").addEventListener("click",()=>{
  $("#compiler-panel").scrollIntoView({behavior:"auto",block:"start"});
  $("#compiler-title").focus({preventScroll:true});
});
$("#back-to-draft").addEventListener("click",()=>{
  $("#scratch-code").focus();
});
$("#reset-draft").addEventListener("click", () => {
  if (!window.confirm("Discard the "+(practiceVariant==="original"?"original":"transfer "+practiceVariant.toUpperCase())+
    " code draft for this lesson and restore its starter?")) return;
  if (!clearPracticeCode(current().id,practiceVariant)) {
    $("#draft-feedback").textContent = "Could not reset the saved draft; no changes were made.";
    return;
  }
  $("#scratch-code").value = activePractice().starter;
  unsavedPractice=false;
  renderExternalTestHandoff();
  $("#draft-feedback").textContent = "Starter restored for this task. Other drafts are unchanged.";
});
$("#check-output").addEventListener("click", () => {
  if(practiceVariant!=="original"){
    $("#output-feedback").textContent="Pasted-output comparison applies only to the original task. Run this transfer code in Julia and check its test cases.";
    $("#output-feedback").dataset.status="unverified";
    return;
  }
  const result = checkPastedOutput(current().expected, $("#output-input").value);
  const feedback = $("#output-feedback");
  feedback.textContent = result.message;
  feedback.dataset.status = result.status;
});
$("#bridge-diagnostics").addEventListener("toggle", () => {
  diagnosticCount = 0;
  diagnosticLast = null;
  renderDiagnostics();
});
$("#copy-diag").addEventListener("click", async () => {
  // Only structural metadata; no source code or program output is copied.
  const report = "Julia Lab JDoodle diagnostic: " + JSON.stringify({
    embedConfigured: validateEmbedUrl(readEmbedUrl()),
    matchingFrameMessages: diagnosticCount,
    latestMarker: diagnosticLast?.marker ?? null,
    latestFormat: diagnosticLast?.format ?? null,
    providerOnLoadObserved: lifecycleOnLoadObserved,
    liveJuliaExecutionVerified: false
  });
  try {
    await navigator.clipboard.writeText(report);
    $("#bridge-feedback").textContent = "Diagnostic summary copied (no Julia code or output).";
  } catch {
    $("#bridge-feedback").textContent = "Clipboard unavailable. Select the summary text instead.";
  }
});
$("#local-runner-disable-embed").addEventListener("click",()=>{
  if(!readEmbedUrl())return;
  if(writeEmbedUrl(""))location.reload();
  else $("#local-runner-status").textContent="Could not disable JDoodle; use Compiler settings.";
});
$("#settings-toggle").addEventListener("click", () => {
  $("#settings-panel").hidden = !$("#settings-panel").hidden;
  if (!$("#settings-panel").hidden) $("#embed-url").focus();
});
$("#save-embed").addEventListener("click", () => {
  const value = $("#embed-url").value.trim();
  if (!validateEmbedUrl(value)) {
    $("#settings-feedback").textContent = "Enter a JDoodle HTTPS URL in the form https://www.jdoodle.com/embed/v1/YOUR_KEY.";
    return;
  }
  if (!writeEmbedUrl(value)) {
    $("#settings-feedback").textContent = "Browser storage unavailable. Your setting was not saved.";
    return;
  }
  location.reload();
});
$("#clear-embed").addEventListener("click", () => {
  if (writeEmbedUrl("")) location.reload();
  else $("#settings-feedback").textContent = "Could not update local browser storage.";
});
$("#default-embed").addEventListener("click", () => {
  if (writeEmbedUrl(null)) location.reload();
  else $("#settings-feedback").textContent = "Could not restore the course embed.";
});
window.addEventListener("hashchange", render);
if (!location.hash) location.hash = "#lesson/01";
initNumericalExplorer();
initEliminationLab();
initPrecisionLab();
initFittingLab();
initLinearMethods();
initProgramTrace();
initFactorLab();
initSensitivityLab();
render();
setupEmbed();
