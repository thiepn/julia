# Julia Lab — AMP Interactive Mathematics Studio (R2)

An independent study companion for **Algorithmische Mathematik und Programmieren (AMP)**, Universität zu Köln, WS 2026/27. This is **not** an official university tool, grader or ILIAS submission service.

**Live application:** https://julia.thiepn.dev

R2 is a static, responsive course interface. It requires no application account, backend database, or server-side Julia execution. Browser drafts and concept progress are local. Real Julia execution is optional and uses a separately started local companion on the learner's computer.

## Start studying

1. Open the live URL, or start the local static server described below.
2. Choose a lesson in **Course** or use **Continue learning**. The original 16 lesson IDs are reachable at `#lesson/01` through `#lesson/16`.
3. Use the four lesson activities:
   - **Learn** — source-linked concepts and Julia examples.
   - **Check** — one conceptual question at a time, with saved local selections.
   - **Code** — the canonical Julia draft editor, original and transfer tasks, source import/export, and optional genuine Julia execution and tests.
   - **Explore** — available numerical models, exercises, proofs, debugging tasks and experiments from the existing curriculum.
4. Use **Mixed practice** for six independent source-linked problems per set. Working text is temporary for the current tab; it is not graded.
5. Use **Tools** for course backup, offline support, compiler options, and private PDF/ZIP preparation.

The browser's numerical visualizations are JavaScript illustrations, not executions of the code typed into the Julia editor. Concept review is not evidence of correct Julia programming or an official grade. The current lecturer's exercise sheets take priority.

## Course content

The existing curriculum contains **16 lessons**, 48 conceptual questions, original coding tasks, two transfer variants per lesson, debugging tasks, numerical function missions, deeper test/proof activities and mixed-semester practice. Topics include Julia syntax, indexing, functions, floating-point arithmetic and error, vector/matrix norms, numerical conditioning, Gaussian elimination and pivoting, LR/QR/Cholesky, least-squares fitting, Julia experiments and authentic plotting output.

R2's presentation controller (`src/r2-studio.js`) moves and displays the original learning elements without creating a competing editor, progress store, Julia runner, grading system or source authority. Lesson source IDs, saved drafts and course backup format remain unchanged.

## Run the application locally

No build step is required. From the repository root, start a static server:

- **Windows PowerShell:** `py -m http.server 5173`
- **macOS/Linux:** `python3 -m http.server 5173`

Open http://localhost:5173. The learning interface itself does not require Julia or Node.js. For repository tests and the optional local runner, use **Node.js 22+**.

Run `npm test` for the repository's original Node unit suite. GitHub Actions also runs actual Julia 1.11 numerical and package checks, Chromium browser acceptance, the G1/G2 Firefox/WebKit scenarios, offline, backup, genuine plot generation and PDF/ZIP regressions. The workflow is triggered for pull requests to `main`, not every push to `main`.

## Run genuine Julia on your own computer

Install **Julia 1.11+** and **Node.js 22+** on the trusted computer where you intend to run source. Verify `julia --version` and `node --version` in a terminal.

1. In a repository checkout run `node local-runner/server.mjs`. The companion listens on `127.0.0.1:8765` and prints a fresh session access code.
2. In Julia Lab, open **Tools** and choose **Disable JDoodle and reload for local execution**. Then enter that code in the local-runner controls. The third-party embed must be disabled before entering the private code.
3. Select a lesson, open **Code**, edit the current canonical draft and choose **Run Julia**. The optional companion returns actual stdout/stderr, exit state and any accepted PNG/SVG figures created by the executed program.
4. Where supported, download a Julia `Test` script or select **Run tests with local Julia**. Passing the executed assertions does not establish universal correctness, mathematical proof, mastery or course credit.
5. Stop the companion with Ctrl+C.

**Security:** This is **not a sandbox**. Julia executes arbitrary submitted source with the user's own operating-system privileges. Run only trusted source. Requests use the loopback endpoint, an explicit session access code and an origin allowlist for localhost and supported Julia Lab domains. Tokens are not stored as lesson progress. Browser private-network restrictions may prevent a public HTTPS page from connecting to loopback; run the included localhost site in that case. External JDoodle notifications are never used as reliable Julia execution evidence.

The companion enforces a **50 KB** source limit, **120-second** execution timeout, **25 KB per output stream**, up to **three figures** totaling **5 MiB**, and one active execution at a time. It removes temporary execution files after each run. Install optional Julia packages used by particular exercises (such as `Plots.jl` and `PrettyTables.jl`) in your own environment; the app does not install them silently. It also does not claim to grade your code.

## Drafts, course backup and privacy

The original local browser storage keeps concept selections, lesson drafts, applicable transfer/debugging work and supported activity state. This is **origin-specific**: a different browser, device, or site domain does not automatically share records. Clearing site data can erase them. Export important `.jl` files and a course backup **before** clearing browser data or changing domains.

- **Code → Download .jl** exports the current task source. Importing, replacing or resetting an edited draft follows the original validation and confirmation flow.
- **Tools → Course backup** exports `AMP-Julia-course-backup-v1.json`. Format `v1` is still the canonical portable format in R2; do not rename it to imply an incompatible R2 format.
- Disable JDoodle and reload before backup or restore. The exported JSON is restricted to allowlisted canonical AMP course data and capped at **2 MB**; it contains no runner access codes, JDoodle embed settings, submission identities, PDFs or ZIP contents.
- On import, review the counts of new, unchanged and conflicting records. **Keep existing** does not overwrite conflicting data; **replace conflicts** requires approval. Restore reloads the app to reconcile its in-memory state.

The app does not provide account-based synchronization or automatic server backup. A service worker caches only the first-party static app shell, not student code, credentials, third-party scripts, runner results, downloads or ILIAS submission files.

## Offline lessons and PWA

Under HTTPS or localhost, **Tools → Offline** registers the first-party service worker. Wait until the app says its initial complete static-asset cache is ready. After that, previously cached learning pages and browser-based practice can work without network access. The offline asset inventory includes the R2 controller, stylesheet, canonical lesson code, and icons.

Offline availability depends on browser support, retained device storage and successful initial caching. Offline mode **does not run Julia**, reach JDoodle, submit to ILIAS, or guarantee access to the optional local companion. A pending shell update needs the user-initiated **Update** action. Do not clear site storage just to update: the course data is locally stored separately from the offline cache. Native install prompts depend on browser and device.

## Prepare a private AMP PDF/ZIP for ILIAS

**Tools → ILIAS submission preparation** assists with local file assembly, not actual submission. Always check the official exercise sheet's current formatting, naming, deadlines and required code comments.

1. Disable JDoodle and reload before entering your name, matriculation number or task identifier. These fields remain in the current page session, not in progress storage.
2. Finalize the Julia program in the existing **Code** editor. Use the workflow's print preview and your browser's **Save as PDF** to save a PDF of that exact source.
3. Import the PDF and explicitly confirm it matches the previewed code. The browser can validate a PDF's structure, but **cannot verify the print dialog's contents independently**.
4. Stage up to **eight unique `.jl`/PDF pairs**. A changed source or filename invalidates an unfinished pairing. You may optionally include actual successful local Julia stdout/stderr and PNG/SVG figures for the same draft.
5. Download and inspect the ZIP, then upload it manually to **ILIAS**. There is no university authentication or automatic upload in Julia Lab.

The staged submission bundle is temporary in-memory data, so download it before leaving or reloading the page. Genuine Julia execution does not confirm the assignment meets the instructor's requirements.

## Verification and release status

- **Merged R2:** [PR #14](https://github.com/thiepn/julia/pull/14), `main` merge SHA `7e89bf13377a3145734cb5257c03d4f2d18b8844`.
- **Exact-head pre-merge CI:** [Actions #39852631777](https://github.com/thiepn/julia/actions/runs/39852631777) succeeded at `fdacde025f2a9ed301027c8a96bfcc42e5ae2f47`: `verify`, `authentic-plotting`, `r2-visual` all PASS, including backup, original browser tests, real Julia and Plots.jl, Firefox/WebKit acceptance, and PDF/ZIP paths.
- **Production:** Vercel reported its deployment from merge commit `7e89bf1...` as **READY**, assigned to the verified `julia.thiepn.dev` domain. This is deployment evidence rather than proof of an independently executed live-browser session.
- **Not tested by the post-merge inspection:** the actual served page via direct HTTP/browser, physical Windows learner setup, native mobile install prompts, all hosted-to-loopback browser permissions, actual end-user print dialogs, JDoodle's external execution service, and real ILIAS uploads.

Older project history, design iterations and former draft phases remain in Git commits and prior PRs. This README documents the **merged, deployed R2 product**.
