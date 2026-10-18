import {lessons, stages} from "./lessons.js";
import {readProgress, writeProgress, readEmbedUrl, writeEmbedUrl,
  validateEmbedUrl, checkChoice, countCorrect, readyForChallenge, checkPastedOutput} from "./checks.js";

const $ = (selector) => document.querySelector(selector);
const progress = readProgress();
let currentIndex = 0;
const safe = (value) => String(value).replace(/[&<>"']/g, char =>
  ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const current = () => lessons[currentIndex];

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
    return '<div class="question"><div class="question-head"><span>QUESTION ' + (i+1) + ' / 3</span>' +
      (answered ? ('<span class="'+(isRight?"correct":"retry")+'">' + (isRight?"Correct":"Try again") + '</span>') : "") +
      '</div><h3>' + safe(q.q) + '</h3><div class="choices">' +
      q.choices.map((choice, j) => '<button type="button" data-question="' + i +
        '" data-choice="' + j + '" class="choice ' + (chosen===j?"selected":"") +
        '" aria-pressed="'+(chosen===j ? "true" : "false")+'">' +
        '<span>' + String.fromCharCode(65+j) + '</span>' + safe(choice) + '</button>').join("") + '</div>' +
      '<details class="question-hint"><summary>Need a hint?</summary><p>' + safe(q.hint) +
      '</p></details></div>';
  }).join("");
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
function render() {
  currentIndex = lessonIndexFromHash();
  const l = current();
  $("#lesson-meta").innerHTML = '<span class="eyebrow">LESSON '+l.id+' / 16</span><span>' +
    l.minutes + ' MIN</span><span>' + safe(l.source) + '</span>';
  $("#lesson-title").textContent = l.title;
  $("#lesson-goal").textContent = l.goal;
  $("#lesson-theory").textContent = l.theory;
  $("#example-code").textContent = l.example;
  $("#challenge-text").textContent = l.challenge;
  $("#starter-code").textContent = l.starter;
  $("#challenge-checks").textContent = l.checks;
  [1,2,3].forEach(i => {
    const el = $("#hint-"+i); el.open = false;
    el.querySelector("p").textContent = l.hints[i-1];
  });
  $("#previous").disabled = currentIndex===0;
  $("#next").disabled = currentIndex===lessons.length-1;
  $("#output-input").value = "";
  $("#output-feedback").textContent = "";
  renderQuestions(); renderSidebar();
  document.title = l.title + " — Julia Lab";
}
function setupEmbed() {
  const url = readEmbedUrl();
  $("#embed-url").value = url;
  const slot = $("#embed-slot");
  if (!validateEmbedUrl(url)) {
    $("#runtime-state").textContent = "Not configured";
    return;
  }
  $("#runtime-state").textContent = "Configured · unverified";
  slot.replaceChildren();
  const embed = document.createElement("div");
  embed.setAttribute("data-pym-src", url);
  embed.className = "jdoodle-embed";
  slot.append(embed);
  const script = document.createElement("script");
  script.src = "https://www.jdoodle.com/assets/jdoodle-pym.min.js";
  script.async = true;
  script.onerror = () => {
    $("#runtime-state").textContent = "Embed failed to load";
    const notice = document.createElement("p");
    notice.className = "error";
    notice.textContent = "JDoodle could not be loaded. Use the external compiler links below.";
    slot.append(notice);
  };
  document.body.append(script);
}
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
$("#check-output").addEventListener("click", () => {
  const result = checkPastedOutput(current().expected, $("#output-input").value);
  const feedback = $("#output-feedback");
  feedback.textContent = result.message;
  feedback.dataset.status = result.status;
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
window.addEventListener("hashchange", render);
if (!location.hash) location.hash = "#lesson/01";
render();
setupEmbed();
