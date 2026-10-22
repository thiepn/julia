# Julia Lab — AMP (v1.0)

A static, browser-based Julia learning companion for **Algorithmische Mathematik und Programmieren**, Universität zu Köln, WS 2026/27. It is independent study material, **not** an official course tool or homework submission system.

## Start

The entire application is in this repository; no account, database, build step, paid API or server-side service is required.

1. Start a local static server in the repository directory:
   - **Windows:** `py -m http.server 5173`
   - **macOS/Linux:** `python3 -m http.server 5173`
2. Open **http://localhost:5173** in a browser.
3. Select **Continue lesson**. The first six lessons cover the essentials for Übung 1.
4. Write Julia in the lesson editor. Your drafts and multiple-choice answers are saved **in this browser only**.
5. Run Julia code in an external compiler or install Julia and run exported `.jl` files locally. The website itself **does not execute or grade Julia code**.

## What is included

- **16 lessons**, 48 concept questions with explanations and 16 original coding challenges.
- **32 independent transfer exercises**, 16 debugging tasks and numerical practice missions.
- Interactive experiments for norms/matrices, Gaussian elimination, floating-point precision, least-squares fitting, algorithm traces, QR/Cholesky and numerical sensitivity.
- One lesson code workspace, saved per task. Import/export local `.jl` files and explicitly confirm resets or scaffold replacements.
- Julia `Test` script downloads for supported callable functions: complete suites, selected cases, algorithm properties and a cross-lesson integration exercise.
- External JDoodle/OneCompiler access, with an account-owned embedded JDoodle editor configured by default. The embedded service's live Julia execution is **not reliable or verified**.

The browser computes interactive mathematical illustrations in JavaScript, independently of the learner's Julia code. Correct multiple-choice answers are concept review, **not evidence of programming mastery**.

## Run the Julia tests

For supported function tasks, select the exercise and download its **Julia test file**. Run it using a local Julia installation:

```sh
julia amp-julia-lab-lesson-XX-tests.jl
```

Use the **actual filename** downloaded by the app; the name above is illustrative. These generated scripts include your current code draft and run Julia's standard `Test` assertions. A successful local run is evidence for those specific test cases, not a mathematical proof or official course grade. For ordinary script/plot tasks without generated tests, execute the exported `.jl` file yourself and inspect the result.

Some plotting lessons require `Plots.jl`; install it in a local Julia environment with `import Pkg; Pkg.add("Plots")`. Whether it works in JDoodle depends on the external provider and is not guaranteed.

## Verification

The exact J24 branch commit `1b86d20a2f8dc16200bcf2fa5a61d10a7d548ea2` passed [GitHub Actions #39511383531](https://github.com/thiepn/julia/actions/runs/39511383531):

- 107/107 Node tests.
- 13/13 Julia full-function suites; 13/13 focused suites.
- 9/9 Julia full-property suites; 9/9 individual-property tests.
- 9/9 parsable incomplete scaffolds, correctly failing their designated tests.
- Four expected negative function checks, plus two expected integration failures.
- One real five-case cross-lesson integration suite.
- 32/32 Chromium desktop/mobile acceptance checks.

Those Julia tests ran **fixed, reviewed reference implementations**, not private learner code. Real successful JDoodle execution/output events, browser-based automatic coding grades, and live hosted `Plots.jl` runs remain **unverified/unavailable**. No code is silently uploaded for grading.

Run the repository tests with **Node 20+** using `npm test`. GitHub Actions uses Node 22, Julia 1.11 and Chromium. The application itself requires no npm installation.

## Data and course boundaries

Progress and drafts remain in local browser storage. Clearing site data, switching browsers or opening another domain can lose access to them. Export important `.jl` work. No sign-in, server sync or account-based backup is provided.

The curriculum draws on AMP lecture and Übung 1 topics, Noel Kalicharan's *Julia — Bit by Bit* (2021), Julia's documentation, and numerical mathematics references. Examples are original practice, not completed Übung 1 submissions. The assignment instructions take priority over this companion app.

For Übung 1's transformed norm geometry, distinguish the direct image `M(S¹)` from the inverse image `M⁻¹(S¹)`, which is the boundary of `||Mx||₂ = 1` for invertible `M`; do not treat them as equal in general.

## Release boundary

**v1.0 deliberately uses a static learning app plus local/external Julia execution.** A real browser-side execution/grading service requires separately validated provider events or a secure runtime and is not a v1 release blocker. No backend, credentials or paid provider service is part of this version. This branch is intended for review before any merge or deployment.


## Post-v1 draft: local plot preview and Übung 2

Lessons 04–06 now offer original Plots.jl examples for multiple curves, equal aspect
ratios, matrix actions and figure export. After executing Julia outside the browser,
save your plot with savefig(p, "figure.png") or savefig(p, "figure.svg") and
choose the local file in the Julia Lab plot panel. Import is capped at 5 MB; PNG
signatures and SVG structure are checked, active/external SVG content rejected.
The figure is temporary, not uploaded, stored, executed or graded.

Lessons 09 and 16 offer independent cancellation and relative conditioning experiments.
The tables on the webpage are calculated in JavaScript; the shown Julia source must
be run in Julia. The cancellation script includes current PrettyTables.jl
column_labels usage. Install the dependency locally via
import Pkg; Pkg.add("PrettyTables"). PR #3 now executes the original
Plots.jl source against Plots v1.41.7 and PrettyTables.jl against v3.5.0 under
Julia 1.11. The generated figures (two PNGs and one SVG) and formatted text
were verified with real package execution; all three files were imported in
genuine Chromium desktop and mobile tests. See CI #39568500774. This does not
mean the browser executes Julia or grades code.

This is a new draft PR and is not merged/deployed. Existing local drafts, lesson
identities, review history, rights and the original app remain intact.

## Optional local Julia execution — new development branch

Julia Lab now provides an optional **loopback-only local Julia companion**. It is not
a hosted execution service, not a security sandbox and not automatic grading.

1. Install Julia 1.11+ and Node.js 22+ on the same computer as your browser.
2. Check out this repository and run `node local-runner/server.mjs` from its root.
   It binds to `127.0.0.1:8765` and prints a random access code for that session.
3. In Julia Lab, choose **Disable JDoodle and reload for local execution**.
   This avoids exposing your session code to JDoodle's third-party loader.
4. Enter the session code, write Julia in any lesson draft and press
   **Run current Julia draft**. Inspect the real stdout, stderr and saved
   `.png`/`.svg` figures produced by your own code (for example via `savefig`).
5. Stop the companion with Ctrl+C when finished.

Requests are limited to approved browser origins, an unguessable temporary token,
50 KB of source, 25 KB per output stream, up to three images totalling 5 MB,
one execution at a time and 120 seconds per run. Each run uses a temporary
directory which is removed afterwards. Neither the access token nor run outputs
are stored in localStorage or sent to the hosted site.

**Security:** Julia runs with your local OS account's filesystem/process rights.
Only run code you trust. Loopback restrictions in some browsers may prevent a
remote HTTPS page from connecting; use the included localhost site in that
case. Explicitly allow other trusted origins via `JULIA_LAB_ORIGINS`.
Running code and rendering graphics never award coding mastery or change drafts.

## Substantial AMP Übung 2 learning upgrade (new draft branch)

Lessons 09 and 16 now contain three new source-grounded capabilities:

1. **Quadratic root conditioning:** Direct versus rationalized smaller roots
   of x² - 2ax + b. Independent presets and a=3 parameter sweeps contrast
   inherent sensitivity near a double root with cancellation of a tiny root.
   Inspect a plot and numerical table, export browser-calculated CSV, or
   download independent Julia/PrettyTables source for execution.
2. **Relative condition by finite perturbations:** Explore cosine, shifted
   square and a nontrivial composition. Compare analytic |x f'(x)/f(x)|
   with finite perturbations of x; Julia source can reproduce the samples.
3. **Independent Julia programming missions:** Practice a cancellation-resistant
   difference, relative response, or stable quadratic root. Copy source into
   the original lesson editor, then generate a Julia `Test` script from its
   *current existing draft*. The app does not execute or grade the exported test.

These exercises are original learning transfers informed by AMP Übung 2 and
are NOT the university homework answer key. They deliberately use independent
coefficient values and input grids rather than supplying the assigned result
table for Aufgabe 2.2(b). Source lives in AMP root/condition/mission modules.
All browser numerical values are computed with JavaScript Number (binary64).
No new progress engine, saved draft store, grader, backend or compiler was added.
Local user Julia execution continues through the existing optional companion;
the real Julia/PrettyTables source and Julia Test suites are exercised in CI.

**Release boundary:** New development branch / draft PR only. Do not merge
or deploy until the full multi-upgrade batch is accepted.

## AMP programming submission workflow (same PR #5)

Source: AMP Übung 1 (22 October 2026, 08:00) and Übung 2 (29 October
2026, 08:00). Both require: one `.jl` file per Julia programming task,
a corresponding PDF **of the code**, filename containing the student's name
and matriculation number, and a ZIP uploaded by the student to ILIAS.
Programs should include meaningful comments. This app does not submit files.

Expand **Prepare AMP submission (.jl, code PDF and ZIP)** inside any lesson.
Disable JDoodle and reload before entering personal filename details so its
third-party embed script cannot read them. Enter a filename name in safe
Latin letters, your matriculation number, and an exercise identifier such
as `1.2` or `2.2b`. The original code editor remains the source of truth.

1. Write your own Julia code; optionally execute the current editor source
   with the existing local Julia runner to obtain actual output and plots.
2. Choose **Print code -> Save as PDF**, then use the browser's system
   print dialog to save a **text-selectable PDF of that exact source**.
   For accurate Unicode and pagination, printing uses native browser fonts.
3. Select the saved PDF, check that it contains the exact code, and
   optionally include the current **successful local Julia execution**
   output plus up to three exported image files in the ZIP.
4. Stage the `.jl`/PDF pair and repeat for up to eight programming tasks.
   The staged files are kept only in this tab's memory, not in browser storage.
5. Download the standards-compliant, uncompressed ZIP. Open it and check
   the source/PDF pairs before uploading to ILIAS yourself.

The browser cannot read the system print dialog, automatically capture the
PDF it saves or independently prove that an imported PDF reproduces your
source. The user confirms the PDF/source match before staging. The PDF
must have a valid header/end marker, and entries have strict size/path limits
and ZIP CRC checks. Local Julia execution **does not grade** correctness.
The UI never requests or uses ILIAS credentials, does not store identity
or PDFs in localStorage and does not send submission files to any provider.
All ZIP assembly is inside the browser; without a successful verified
local run, the optional result attachment remains disabled.

### Windows and Julia environment troubleshooting (G1)

From PowerShell or Windows Terminal (not from the Julia REPL) inspect
`julia --version`, `juliaup status`, `where.exe julia`, `node --version`
and `where.exe node`. Juliaup is the Julia project's preferred Windows
installer/version manager; official instructions: https://julialang.org/downloads/.
Opening VS Code from a different shell may result in a different PATH.
Use the Julia VS Code extension and select the Julia executable deliberately.

If Node cannot find Julia although it is installed, the user may set the
JULIA_LAB_JULIA environment variable to a trusted **full path** to julia.exe
before launching `node local-runner/server.mjs`. PowerShell example for
the current terminal session only:

    $env:JULIA_LAB_JULIA = 'C:\path\to\julia.exe'
    node local-runner/server.mjs

This does not modify system PATH or install anything. Restarting the
companion starts a fresh session code; the website never stores it.
With JDoodle disabled, **Check local Julia environment** authenticates
against the SAME localhost server. It executes a fixed, read-only Julia
script showing version, OS, architecture, whether a project is active,
and whether LinearAlgebra, Test, Plots and PrettyTables are discoverable.
It does **not** print project paths or run Pkg.add/Pkg.instantiate/update.
Package discoverability does not prove that `using` a package will work;
the actual existing learner program remains the execution authority.

For a selected project, review Project.toml / Manifest.toml and decide
separately if and when to activate/instantiate/install dependencies.
Successful CI on Linux does not establish a real Windows/VS Code setup;
native Windows execution is still a human acceptance requirement.


## AMP Completion B — LR/QR and least-squares depth

After the existing G1/G2 depth work, lessons 12, 14 and 15 add independent
pivoted LR reconstruction, QR least-squares programming and rank-aware
regression exercises using the **original course editor** and generated
Julia Test files. Three original proof plans cover pivoting, QR projection
and the squared spectral condition number of normal equations; three
executable Julia experiments verify actual factorization/fit diagnostics.

Lesson 15 includes a browser-computed **Householder QR versus normal equations**
comparison on separated, noisy, nearly dependent and rank-deficient data.
The browser uses JavaScript binary64 and displays both the coefficient vector,
the original residual and the normal-equation orthogonality residual.
Numerical rank tolerance is not a theorem about exact matrix rank. The
downloadable Julia source recomputes these cases independently with actual
LinearAlgebra, including singular normal-equation handling.

No canonical lesson ID, saved draft, prior review/progress record, backup
format, existing external editor/local Julia runner or submission workflow
is replaced. Nothing here claims automated Julia grading or official worksheet
solutions. Genuine Julia executions and desktop/mobile browser regressions
must be verified in CI before this branch can be considered qualified.


## Local Julia Test execution — original-source acceptance

Where an existing exercise exposes Julia `Test` assertions, select **Run tests with local Julia** to execute the test script generated from the **current original lesson editor**. The same previously established loopback-only Julia companion, explicit temporary session code, approved origin, 50 KB source limit and 120-second timeout are used; no new compiler, account, backend, grader or stored evidence is introduced.

First disable JDoodle and reload, start `node local-runner/server.mjs`, enter its session code in the Compiler section, and only run code you trust. The test output and execution status are displayed beside the relevant exercise; PASS requires a genuine successful local process and a `Test Summary`. No score or official mastery is recorded. Editing the source, switching the exercise or navigating discards pending results. Pasted terminal text is not treated as verified execution. For supported function tasks, the same test file can still be downloaded and run manually in Julia.

Local Julia **is not a sandbox** and runs with your OS permissions. The app does not install packages, send source to a hosted provider or change saved drafts/progress. Tests only exercise their listed cases, not all possible inputs.


## Offline study mode — first-party PWA shell

After one successful online load on HTTPS or localhost, Julia Lab registers a versioned, scope-limited service worker and downloads the **complete static curriculum and its browser-computed labs** for offline reuse. Open **Offline study** in the compiler panel to check readiness, install the application (when your browser offers an install prompt) or explicitly apply an available shell update. Returning students can navigate all sixteen lessons and use concept questions, JavaScript numerical experiments, saved draft editors, backups and local file export offline. The app's `#lesson/...` routes are served by the cached shell when disconnected. Updates replace the old cache only after the new static bundle is successfully downloaded; the Update button reloads into the replacement release.

**Privacy and limits:** The service worker caches only the enumerated first-party static files. It does not intercept or store draft code, progress records, credentials, Julia source exports, submitted documents, the loopback `/run` companion, or JDoodle/other third-party content. Saved drafts and answers remain in browser localStorage and may disappear if site data is cleared; an offline cache is **not** a backup. Browsers may evict offline files under storage pressure. Julia compilation and online services remain separate. JDoodle is not loaded when the browser reports offline; when online, existing provider behavior and opt-in local execution rules are preserved. Secure contexts and browser service worker support are required.

For each static-app release, update `OFFLINE_CACHE_NAME` and `OFFLINE_ASSETS` in `src/offline-assets.js` if source files change or new first-party assets are added. This branch adds no remote account, sync, progress/grade engine or second compiler.

Chromium-compatible install icons include first-party 192×192 and 512×512 PNG fallbacks alongside the SVG mark; all three are precached so installation artwork can resolve while disconnected. Browser install controls appear only when the browser supplies its own install prompt.


## Live numerical experiments in existing local Julia companion

The **Deeper Julia and numerical reasoning → Numerical experiment** panel can now execute each original, fixed-source experiment with the existing authenticated localhost Julia runner. Choose an experiment, disable JDoodle, start `node local-runner/server.mjs`, enter the session code, then select **Run original experiment with local Julia**. The selected experiment's Julia 1.11 source executes without importing or overwriting your lesson draft. The panel shows real stdout/stderr and an execution result; a failing assertion is displayed as an error, **not a learning grade**. Switching the selected experiment, lesson or editing the draft invalidates pending results. The download action remains available for independent/manual Julia execution.

The existing companion's token, origin restrictions, one-run-at-a-time gate, source limit and timeout apply. It is not sandboxed; original experiments execute with your OS account's permissions. No second compiler, grader, score, saved execution history, data upload, progress change or assignment-output reuse was added. The static offline PWA can display experiment descriptions but cannot execute local Julia unless its companion is available separately.
