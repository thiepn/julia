// Immutable release-scoped static-study shell. Add new first-party assets here before shipping.
// No student drafts, runner outputs, external scripts, tokens, uploads, or account data.
export const OFFLINE_CACHE_NAME="amp-julia-offline-codeux-20261027-6";
export const OFFLINE_ASSETS=Object.freeze([
  "index.html",
  "styles.css",
  "app.webmanifest",
  "assets/julia-lab.svg",
  "assets/julia-lab-192.png",
  "assets/julia-lab-512.png",
  "src/algorithm-design.js",
  "src/amp-condition-model.js",
  "src/amp-missions.js",
  "src/amp-root-model.js",
  "src/amp-workshops.js",
  "src/app.js",
  "src/r2-studio.js",
  "src/checks.js",
  "src/completion-experiments.js",
  "src/completion-proofs.js",
  "src/completion-tracks.js",
  "src/completion-view.js",
  "src/course-backup-ui.js",
  "src/course-backup.js",
  "src/elimination-model.js",
  "src/elimination-view.js",
  "src/external-tests.js",
  "src/factor-model.js",
  "src/factor-view.js",
  "src/feedback.js",
  "src/fitting-model.js",
  "src/fitting-view.js",
  "src/integration-task.js",
  "src/jdoodle-bridge.js",
  "src/julia-report.js",
  "src/lessons.js",
  "src/linear-depth.js",
  "src/linear-methods-view.js",
  "src/linear-methods.js",
  "src/local-runner-client.js",
  "src/local-test-result.js",
  "src/numerical-missions.js",
  "src/numerical-model.js",
  "src/numerical-view.js",
  "src/plot-preview.js",
  "src/plotting-practice.js",
  "src/precision-model.js",
  "src/precision-view.js",
  "src/program-trace-model.js",
  "src/program-trace-view.js",
  "src/property-transfer.js",
  "src/repair-cases.js",
  "src/repair-workspace.js",
  "src/sensitivity-model.js",
  "src/sensitivity-view.js",
  "src/submission-package.js",
  "src/submission-workflow.js",
  "src/transfer-cases.js",
  "src/transfer-drafts.js",
  "src/transfer.js",
  "src/ue02-practice.js",
  "src/workspace.js",
  "src/offline-assets.js",
  "src/offline-study.js",
  "src/semester-rehearsal.js",
  "src/semester-rehearsal-view.js"
]);
const ALLOWED=new Set(OFFLINE_ASSETS);
export function offlineAssetKey(requestUrl,scopeUrl,navigation=false){
  const url=new URL(requestUrl),base=new URL(scopeUrl);
  if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname))return null;
  const path=url.pathname.slice(base.pathname.length);
  if(navigation&&(path===""||path==="index.html"))return new URL("index.html",base).href;
  if(url.search||url.hash||!ALLOWED.has(path))return null;
  return new URL(path,base).href;
}
