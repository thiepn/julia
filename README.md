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
