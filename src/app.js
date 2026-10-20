import {lessons, stages} from "./lessons.js";
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
import {initProgramTrace,showProgramTrace} from "./program-trace-view.js";
import {initFactorLab,showFactorLab} from "./factor-view.js";

const $ = (selector) => document.querySelector(selector);
const progress = readProgress();
let currentIndex = 0;
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
const current = () => lessons[currentIndex];
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
function render() {
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
  showProgramTrace(l.id);
  showFactorLab(l.id);
  $("#repair-section-number").textContent=["03","05","06","07","08","09","10","11","12","13","14","15"].includes(l.id)?"05":"04";
  $("#lesson-theory").textContent = l.theory;
  $("#example-code").textContent = l.example;
  $("#challenge-text").textContent = l.challenge;
  $("#starter-code").textContent = l.starter;
  $("#scratch-code").value = readDraft(l.id, l.starter);
  $("#draft-feedback").textContent = "Saved only in this browser; not executed or automatically graded.";
  $("#challenge-checks").textContent = l.checks;
  renderRepair();
  [1,2,3].forEach(i => {
    const el = $("#hint-"+i); el.open = false;
    el.querySelector("p").textContent = l.hints[i-1];
  });
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
$("#copy-starter").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(current().starter);
    $("#output-feedback").textContent = "Starter code copied. Paste it into Julia or the embedded editor.";
  } catch {
    $("#output-feedback").textContent = "Clipboard unavailable. Select and copy the starter code shown above.";
  }
});
$("#scratch-code").addEventListener("input", () => {
  const saved = writeDraft(current().id, $("#scratch-code").value);
  $("#draft-feedback").textContent = saved
    ? "Draft saved locally. Execution and correctness are not verified."
    : "Could not save draft (storage unavailable or draft too large). Copy your work elsewhere.";
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
  } catch {
    $("#draft-feedback").textContent = "Cannot export this draft. Check its size.";
    return;
  }
  const url = URL.createObjectURL(new Blob([script.content],{type:script.mime}));
  const link = document.createElement("a");
  link.href = url;
  link.download = script.filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  $("#draft-feedback").textContent = "Downloaded " + script.filename +
    ". Open it in Julia or VS Code; downloading does not execute or grade the program.";
});
$("#import-draft").addEventListener("click",()=>$("#import-file").click());
$("#import-file").addEventListener("change", async () => {
  const input = $("#import-file");
  const file = input.files?.[0];
  const selectedLesson = current().id; // capture BEFORE asynchronous file reading
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
  if (current().id !== selectedLesson) {
    $("#draft-feedback").textContent = "Lesson changed while reading the file. Import cancelled to protect both drafts.";
    return;
  }
  const originalLesson = selectedLesson;
  if (!window.confirm("Replace the code draft for lesson " + originalLesson + " with the selected .jl file?")) {
    $("#draft-feedback").textContent = "Import cancelled; your draft is unchanged.";
    return;
  }
  // Protect against a lesson navigation occurring during the asynchronous read/confirmation.
  if (current().id !== originalLesson) {
    $("#draft-feedback").textContent = "Lesson changed. Import cancelled to protect both drafts.";
    return;
  }
  if (!writeDraft(originalLesson, validation.code)) {
    $("#draft-feedback").textContent = "Could not save imported code. Your existing draft is unchanged.";
    return;
  }
  $("#scratch-code").value = validation.code;
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
  if (!window.confirm("Discard your current code for this lesson and restore its starter?")) return;
  if (!clearDraft(current().id)) {
    $("#draft-feedback").textContent = "Could not reset the saved draft; no changes were made.";
    return;
  }
  $("#scratch-code").value = current().starter;
  $("#draft-feedback").textContent = "Starter restored. This does not affect other lessons.";
});
$("#check-output").addEventListener("click", () => {
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
initProgramTrace();
initFactorLab();
render();
setupEmbed();
