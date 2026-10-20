# Julia Lab — AMP · Universität zu Köln

Minimal, static, course-aligned Julia practice for **Algorithmische Mathematik und Programmieren (WS 2026/27)**. No authentication, database, server-side code execution or paid services are included.

This is a learning companion, **not** an official course application or submission system.

## Included

- 16 short lessons grouped into Übung 1 essentials, programming fluency, numerical AMP.
- 48 concept questions with immediate feedback, three progressive coding hints per lesson.
- 16 coding challenges, source descriptions, example and starter code.
- Course-specific emphasis on \`Plots.jl\`, norms and transformations, numerical errors, LR/QR/Cholesky and least squares.
- Local browser progress only; keyboard-accessible navigation and responsive layout.
- JDoodle editor slot on every lesson, preconfigured with the account-owned embed URL supplied by the user (`https://www.jdoodle.com/embed/v1/d74ec9cf98a1b5b`), with an optional local override or disable action.
- External JDoodle and OneCompiler fallback links always accessible.
- Output text comparison for student-pasted output. **This is not code execution verification**.

## Run locally

Requires any HTTP static-file server and a modern browser:

\`\`\`bash
python3 -m http.server 5173
# Open http://localhost:5173
\`\`\`

Run independent curriculum/validator tests using Node.js 20+:

\`\`\`bash
npm test
\`\`\`

No \`npm install\` is necessary for runtime or tests (Node built-ins only). Deployment can be static, for example to Cloudflare Pages. **No deployment is included in this change.**

## Connect a Julia JDoodle embed

1. Sign into JDoodle and create a **Julia project** (not a Java or Python project).
2. Create an embed connected to that Julia project, keeping an editable code editor, Execute button and output area.
3. Copy the resulting URL in the exact format \`https://www.jdoodle.com/embed/v1/YOUR_KEY\`.
4. In Julia Lab choose **Compiler settings**, paste the embed URL and save.
5. The site loads the official JDoodle Pym script: \`https://www.jdoodle.com/assets/jdoodle-pym.min.js\`.
6. On each lesson, use **Copy code** to paste starter code into the embed, then execute it. The same configured Julia editor stays available as lessons change.
7. If the embed fails or doesn't support a package, use the **Open JDoodle** or **Open OneCompiler** fallback; VS Code + installed Julia is best for verified university submissions.

**Important:** An embed is not preconfigured, because JDoodle requires an account-owned project/embed key. No live embedded Julia session or output-event contract has been exercised yet. Julia graphics inside the hosted editor also remain unverified.

## Grading stages

1. **Implemented now:** concept questions are automatically marked in the browser, with answers stored in local storage. 2/3 correct makes a lesson concept set "reviewed". This does **not** assert programming competence.
2. **Implemented now:** optional comparison of pasted Julia stdout with a practice target. This is explicitly labeled unverified and never marks the code challenge as passed.
3. **Next, only after the Julia embed actually runs:** implement its documented ready/code/output event messages, verify response shape and origin, add genuine automatic stdout checks on successful execution. Do not trust unverified cross-origin messages or turn text matches into a claim of code correctness.
4. **Later:** run multiple executable function test cases securely using a supported runner, and add plot-specific validation. Do not ship fake hidden tests or store API credentials in the frontend.

Official embed docs: https://www.jdoodle.com/docs/embeds / https://www.jdoodle.com/docs/embeds/drive-it-from-your-page

## Course sources and caveats

- **AMP Vorlesung 1, 14 Oct 2026** — numerical error analysis, linear systems (LR/QR/Cholesky), least-squares.
- **AMP Übungsblatt 1, due 22 Oct 2026 at 08:00** — Julia \`Plots\` exercise with norm boundaries and transformations, plus written proofs, model questions and convergence.
- **Noel Kalicharan, Julia – Bit by Bit (2021)** — basic numerical types, conditions, loops, functions, arrays.
- Official Julia documentation, LinearAlgebra reference and Plots.jl tutorial for advanced parts.

Practice examples intentionally do not contain complete assignment solutions.

**Mathematical note about UE01 1.2(d):** The boundary of \`||x||_M = ||M*x||₂\` is the inverse image \`M⁻¹(S¹)\` of the Euclidean unit circle; mapping points by \`M\` gives the direct image. These differ for a generic invertible matrix. The sheet's wording and suggested procedure should be clarified with the exercise tutor rather than silently equated.

Original exercise and lecturer instructions have authority over this supplementary content. The first sheet requests \`.jl\` source, PDF copies of code, and a ZIP as specified.

## Future scope

Once the embed is verified: preserve per-lesson scratch work and attach genuine execution feedback, then tighten numerical tolerance rules and add plots. Keep hosting static until a real requirement justifies a backend.

## J3 — local coding workspace

Every lesson now has an editable code draft which autosaves in browser local storage and survives lesson switching and reloads. The **Copy my code** button transfers the exact draft to the clipboard for JDoodle, OneCompiler or local Julia; **Reset to starter** requires explicit confirmation and affects only the current lesson. Unsaved or unavailable local storage is clearly reported. No typed draft is treated as executable proof, and any JDoodle iframe initialization remains labelled **unverified** until a real Julia project embed and its event payloads are tested. No speculative execution event listener or automatic coding-mastery claim is included.

## J4 — supplied JDoodle course embed

The user provided official JDoodle embed markup using `https://www.jdoodle.com/embed/v1/d74ec9cf98a1b5b`. That address is now the **default course embed**, following JDoodle's documented `data-pym-src` + `jdoodle-pym.min.js` integration. Saving a custom URL overrides this in the current browser; **Disable embedded editor** records an explicit disabled state; **Restore course editor** clears the override. The page retains separate per-lesson local drafts and fallback external compiler links.

**Verification limitation:** The hosted editor has not yet been observed running Julia; web access to the embed session is unavailable from the connected verification environment. A successfully loaded third-party script or iframe is *not* proof that the embedded project uses Julia or that execution/output events work. No unverified code is granted completed coding-task status, and no speculative `postMessage` event listener was added. A live Julia execution + output-event payload must be documented and tested before execution-based grading can be implemented.


## J5 — read-only JDoodle event boundary

Official JDoodle docs confirm that embeds can send ready, code-change and execution-output notifications to a containing page; however the public `drive-it-from-your-page` page does **not** define exact event names or field types. A checked **Get embedding code** snippet or observed live transcript is required to map these events safely.

The app now offers an **opt-in, ephemeral Connection diagnostics** panel. Incoming messages must originate at `https://www.jdoodle.com`, come from the `contentWindow` of the currently configured JDoodle embed's iframe, and have the exact configured embed path. Messages from the host page, another JDoodle iframe, or unrelated origins are ignored. This is a conservative diagnostic, not verified execution; some valid provider messages may be discarded until their actual frame topology is established.

Only the count, top-level data format, and a bounded, syntax-validated non-sensitive marker are exposed. No program text, outputs, credentials or message payloads are stored or logged. No `postMessage` commands, automatic code injection, or output-based completion is enabled. Connection reports explicitly state `liveJuliaExecutionVerified: false`.

Synthetic browser fixtures validate the source/origin boundary, including forged same-page messages and a fake execution-result payload. **Those checks are not real JDoodle Julia execution.**

### Next live verification
1. From the actual JDoodle project, open **Get embedding code**. Select **Receive Code**, **Receive Output**, and **Receive Status**; copy the full expanded script including handlers (the boxes only generate JavaScript).
2. In a real browser, run `println(2 + 3)` in the embedded Julia editor, inspect the emitted event names and payloads.
3. Only after confirming the event shapes, frame origins, success/error and execution association should this app implement an output adapter; any successful output check must remain separate from multi-input code mastery.


## J6 — observed live JDoodle behavior (2026-10-19)

On a GitHub-hosted Chromium runner the user's supplied embed and JDoodle Pym script both returned HTTP 200. The frame loaded an editor with Julia selected (versions 1.12.4 and 1.9.3 visible), an ACE editor, and an enabled Execute button. A structured `{onLoad: ...}` message was observed from JDoodle.

A fixed arithmetic smoke program was entered in the editor and Execute clicked. After a longer 20-second wait, the distinct calculated output was **absent**. The output pane instead displayed a JDoodle service error: *"Unable to process your request. Please try again, or contact JDoodle Support at hello@jdoodle.com."* No structured completed-output event appeared. **Live Julia execution and the execution event contract remain NOT VERIFIED; output-based grading is NOT IMPLEMENTED.**

Julia Lab now recognizes an origin/source/path-checked `onLoad` property as an ephemeral connection diagnostic, even if it arrives before the diagnostic panel opens. It is explicitly *not* readiness-for-commands, run success, or code mastery. Untrusted messages cannot trigger a grade, nor are code/output payloads retained.

The manually gated probe is kept in `tests/live-jdoodle-probe.mjs` for reproducibility but removed from the standard CI workflow, preventing automatic repeated JDoodle runs. The normal Node + synthetic Chromium acceptance remains independent of JDoodle's external uptime. The next actual dependency is a functioning JDoodle execution and the vendor-generated expanded embedding snippet documenting ready/code/output events; neither can be inferred from `onLoad` alone.

## J7 — Julia source file handoff and runtime fallback

JDoodle's documented embed supports execution events, but the authentic J6 browser run returned the provider's "Unable to process your request" message, and no successful Julia output event was proven. Current official JDoodle docs do not identify why this particular request failed; no paid REST API/backend was introduced.

J7 adds **Download .jl**, **Import .jl**, and a mobile-accessible **Go to compiler and alternatives** control. Download exports the exact current lesson draft as `amp-julia-lab-lesson-XX.jl` with no backend, making it usable in VS Code and standard Julia. Import accepts a local `.jl` file up to the existing 50,000-character editor limit and requires explicit confirmation before replacing only the current lesson's saved draft. Failed/cancelled imports preserve existing progress and code. All imported text stays local, and none is executed by the web app. A fallback explanation now distinguishes JDoodle service failures from the learner's code mistakes. OneCompiler and JDoodle external links are preserved.

Once JDoodle's execution backend succeeds and the vendor-generated Receive Output event shape can be verified, automatic output checking can be added without relying on pasted output or an invented callback schema.

## J8 — Question-specific reasoning and continue learning

Learners now receive one **source-authored reasoning explanation for each of the 48 questions** after selecting the correct answer, or a question-specific retry prompt after an incorrect answer. These explanations reflect existing textbook/programming and AMP syllabus concepts; they are not generated by the browser, and no correct answer is disclosed before an attempt. An explicit concept checkpoint says when at least 2/3 answers are correct while always marking coding verification as unavailable.

The **Continue lesson** control selects the first concept set not yet reviewed in numerical curriculum order, preserving lesson navigation, selected question history, and all code drafts. Once all 16 concept sets are reviewed, it switches to a review action rather than claiming Julia programming mastery. This is a content/navigation feature, not code execution or numerical-proof evaluation. Import/export and external compiler fallback are unchanged.

## J9 — Separate Julia debugging lab

Added 16 original, course-aligned **Debug a Julia program** exercises, one for every canonical lesson 01–16. Learners repair deliberately faulty code, read two progressively more specific hints, inspect the expected behavior, and explicitly reveal a worked reference and explanation when ready. Cases cover indexing, broadcasting, plots, norms, matrix products, loop predicates, sum-of-squares, tolerances, asymptotic sampling, dot products, residuals, substitution, QR, least squares and sensitivity.

Repairs have a **separate local-storage namespace** from challenge drafts and MCQ progress. Reset requires confirmation. **Compare with example** performs a plainly labelled text comparison (allowing line-ending/trailing-space differences); it does not run Julia, award mastery, or imply that other valid implementations are wrong. **Copy repair code** allows the existing JDoodle/OneCompiler/local Julia path.

This feature does not reproduce full solutions to Übung 1. JDoodle's J6 service error remains a blocker for trusted executed-output grading, and no speculative messages, paid API or backend are introduced.

## J10 — native AMP Norm & Matrix Explorer

Lessons 05 and 06 include an interactive, browser-computed 2D vector and matrix visualizer. Choose ℓ₁, ℓ₂ or ℓ∞, change the input vector, and try identity/stretch/shear/rotation/singular matrices. SVG plots the selected norm boundary, its direct image under A, and—only if invertible—the inverse image under A⁻¹. Numeric readouts show v, A·v, both selected norm values and det(A). Singular matrices explicitly disable the inverse curve and explain why ||A·v|| is not a norm then.

This supports conceptual exploration rather than reproducing the submitted Übung 1 plots or emitting Julia code. All calculations use the browser's JavaScript IEEE 754 doubles. Settings persist under a new independent local-storage key; no Julia execution, grading, progress mutation, or external API call occurs. Reset changes only the experiment settings.

J10 also repairs a demonstrated J9 exact-head Node test failure: the 02 indexing repair was shorter than the intended 30-character source minimum, so that case now explicitly assigns the first entry before printing. The original bug and teaching objective are preserved, and the test is not weakened.

## J11 — Gaussian Elimination Lab (Lessons 12–13)

Four independent 3×3 example systems provide a **step-by-step interactive Gaussian elimination trace**, including row selection, partial-pivot swaps, row eliminations, an upper-triangular system, back-substitution, a final computed solution and original-system residual. Changing the pivoting strategy demonstrates zero-pivot failure, tiny-pivot sensitivity, and singular systems without asserting a unique solution. Previous/Next/First/Last navigate snapshots of the augmented matrix. A Julia `A \\ b` example for the chosen dataset is displayed and can be copied for external execution.

Implementation uses native DOM controls and browser-side JavaScript binary64 formulas; it is **not** running Julia, proving correctness, or grading submitted code. No automatic mastery or cross-app writes. Settings use an independent localStorage key, and no existing question/lesson IDs, drafts, repairs, JDoodle embed or fallbacks change. Substantive AMP practice focused on linear-system algorithms rather than J10's norm geometry. Original `AGENTS.md` main copy restrictions respected.

## J12 — Floating-point Error & Convergence Lab (Lessons 09–10)

An interactive browser-calculated experiment compares finite-difference estimates of f′(x) for f(x)=sin(x), with the cos(x) Float64 result as a *floating-point reference*. Learners choose x ∈ {0.5, 1, 2} and h=10⁻ᵏ, k=1,…,16. The lab computes (i) forward difference, (ii) central difference, (iii) the algebraically equivalent stabilized forward difference using the trigonometric identity, and displays numerical estimates, absolute errors, observed consecutive error-ratio orders, and an SVG log-error plot.

The design explicitly distinguishes truncation order from cancellation at small h; h that rounds x+h back to x is identified. Errors rounded to zero are **not placed on the logarithmic chart**, and the observed finite-sample rate is not represented as an asymptotic proof. One copyable Julia script corresponds to the chosen x and step, but the experiment itself uses browser JavaScript binary64, not Julia or JDoodle. Persistent settings occupy their own local-storage namespace and never change grades or lesson progress. J11 elimination, J10 norms, J9 repair, J8 explanations, all 16 source-aligned lessons, progress, drafts, import/export, fallback and privacy remain unchanged.

## J13 — Interactive least-squares fitting (Lesson 15)

A new **native least-squares explorer** lets learners move the intercept and slope of a fitted line across four original datasets: exact linear observations, noisy observations, an outlier, and rank-deficient repeated x values. It plots measured points, the learner’s current line, per-point residual segments and a least-squares comparison line. A table provides observed and predicted values and individual residuals. SSE, residual 2-norm, both analytical SSE-gradient components, minimum SSE and the gap are shown with numeric values.

The best-fit coefficients are computed from centered sums for full-rank data and can be applied to the sliders (rounded to 0.01, openly labelled). When x is constant the design matrix has deficient rank; the tool states the family of optimal pairs and disables the unique-fit action. A generated Julia `A \\ y` example may be copied to an external compiler; no browser data is passed to JDoodle and no actual Julia execution, coding mastery or numerical proof is claimed. Settings persist separately in localStorage. All existing lessons, draft and assessment state, J8–J12 tools, rights, fallback and privacy remain intact.

## J14 — Active program-state tracing (Lessons 03, 07, 08, 11)

Learners predict the **next accumulator value before it is shown** in four original, fixed Julia-style algorithm examples: summing a Julia range, counting strictly positive values through if/else, summing squares in a function loop, and calculating a dot product with one-based indexing. Lesson 07 also requires a true/false branch prediction. Learners must submit both predictions before revealing an explanation and advancing. The history table shows real modeled before/after values only for completed iterations. Neither a right/wrong prediction nor a finished trace is coding mastery or proof that any Julia source executed.

The step model is deterministic browser JavaScript arithmetic paired with explicitly authored Julia snippets; it is not an interpreter or a JavaScript-to-Julia semantic equivalence guarantee for arbitrary programs. Positions resume per example using independent local-storage keys; Reset trace confirms and affects only the active trace. All 16 lessons, official source identity, existing MCQs, J8–J13 numerical labs, J9 repairs, challenge drafts, .jl import/export, external compiler links and origin/privacy protections remain unchanged. No provider execution/API or paid services.
