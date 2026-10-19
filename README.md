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
