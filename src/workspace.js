// The learner's typed work is local to one browser, separate from JDoodle.
// Empty drafts are intentional. Code is never executed or graded here.
const PREFIX = "amp-julia-lab:draft:v1:";
export const MAX_DRAFT_LENGTH = 50_000;
function key(id) { return typeof id === "string" && /^\d{2}$/.test(id) ? PREFIX + id : null; }
export function readDraft(id, starter = "", storage = globalThis.localStorage) {
  try {
    const k = key(id); if (!k) return starter;
    const saved = storage.getItem(k);
    return saved === null ? starter : saved;
  } catch { return starter; }
}
export function writeDraft(id, code, storage = globalThis.localStorage) {
  if (!key(id) || typeof code !== "string" || code.length > MAX_DRAFT_LENGTH) return false;
  try { storage.setItem(key(id), code); return true; } catch { return false; }
}
export function clearDraft(id, storage = globalThis.localStorage) {
  if (!key(id)) return false;
  try { storage.removeItem(key(id)); return true; } catch { return false; }
}
