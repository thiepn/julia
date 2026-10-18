const STORAGE_KEY = "amp-julia-lab:v1";
const EMBED_KEY = "amp-julia-lab:jdoodle-embed-v1";
export function readProgress(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage.getItem(STORAGE_KEY) || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value;
  } catch { return {}; }
}
export function writeProgress(progress, storage = globalThis.localStorage) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(progress)); return true; }
  catch { return false; }
}
export function readEmbedUrl(storage = globalThis.localStorage) {
  try { return storage.getItem(EMBED_KEY) || ""; } catch { return ""; }
}
export function writeEmbedUrl(value, storage = globalThis.localStorage) {
  if (value && !validateEmbedUrl(value)) return false;
  try { storage.setItem(EMBED_KEY, value); return true; } catch { return false; }
}
export function validateEmbedUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && u.hostname === "www.jdoodle.com" &&
      /^\/embed\/v1\/[a-zA-Z0-9_-]+\/?$/.test(u.pathname) && !u.search && !u.hash && !u.username && !u.password;
  } catch { return false; }
}
export function checkChoice(lesson, index, selection) {
  const q = lesson.questions[index];
  return !!q && Number.isInteger(selection) && selection >= 0 &&
    selection < q.choices.length && selection === q.correct;
}
export function countCorrect(lesson, progress) {
  return lesson.questions.reduce((n, q, i) => n + Number(progress[lesson.id + ":" + i] === q.correct), 0);
}
export function readyForChallenge(lesson, progress) { return countCorrect(lesson, progress) >= 2; }
export function normalizeOutput(output) {
  return String(output || "").trim().toLowerCase().replace(/\r\n/g, "\n").replace(/\s+/g, " ").replace(/\s*([,;\[\]])\s*/g, "$1");
}
export function checkPastedOutput(expected, received) {
  if (expected == null) return { status: "visual", message: "Review the plot or numerical properties in Julia. No automatic image grader is available." };
  if (!String(received).trim()) return { status:"missing", message:"Run the code first, then paste the result here." };
  const exact = normalizeOutput(expected) === normalizeOutput(received);
  if (exact) return {status:"matches",message:"Output matches the practice target. This is not proof that the Julia code passed hidden tests."};
  const a = Number(String(received).trim());
  const b = Number(String(expected).trim());
  if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a-b) <= 1e-9 * Math.max(1,Math.abs(b)))
    return {status:"matches",message:"Numeric output matches within tolerance. The code itself was not independently verified."};
  return {status:"differs",message:"Output differs from the expected value. Check the Julia code and try again."};
}
