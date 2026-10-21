// Genuine package qualification: execute the EXACT Julia code offered to learners.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, join, dirname } from "node:path";
import { PLOT_RECIPES } from "../src/plotting-practice.js";
import { CANCELLATION_EXAMPLE } from "../src/ue02-practice.js";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const figures = join(root, "tests", "generated-julia-figures");
await mkdir(figures, { recursive: true });
const PNG = [137, 80, 78, 71, 13, 10, 26, 10];
const julia = (sourceName) => {
  const result = spawnSync("julia", ["--startup-file=no", "--color=no", sourceName], {
    cwd: figures, encoding: "utf8", timeout: 240_000,
    env: { ...process.env, GKSwstype: "100", JULIA_NUM_THREADS: "2" },
    maxBuffer: 5 * 1024 * 1024
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, sourceName + ": " + result.stdout + "\n" + result.stderr);
  return result.stdout;
};
for (const [id, recipe] of Object.entries(PLOT_RECIPES)) {
  const file = "lesson-" + id + ".jl";
  await writeFile(join(figures, file), recipe.code + "\n", "utf8");
  julia(file);
  const basename = { "04":"julia-curves.png", "05":"julia-ellipse.svg", "06":"julia-shear.png" }[id];
  const path = join(figures, basename);
  const size = (await stat(path)).size;
  assert.ok(size > 1_000 && size <= 5*1024*1024, id + " produced empty or excessive plot " + size);
  const bytes = await readFile(path);
  if (basename.endsWith(".png")) {
    assert.deepEqual([...bytes.subarray(0,8)], PNG, id + " is a real PNG");
    const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
    assert.ok(width >= 100 && height >= 100, id + " PNG dimensions " + width + "x" + height);
    console.log("JULIA PLOTS PASS", id, basename, width + "x" + height, size + " bytes");
  } else {
    const text = bytes.toString("utf8");
    assert.match(text, /<svg(?:\s|>)/i, "real SVG root");
    assert.match(text, /<\/svg\s*>/i, "complete SVG");
    console.log("JULIA PLOTS PASS", id, basename, size + " bytes");
  }
}
await writeFile(join(figures, "ue02-prettytables.jl"), CANCELLATION_EXAMPLE + "\n", "utf8");
const output = julia("ue02-prettytables.jl");
for (const heading of ["epsilon", "direct", "rationalized"]) {
  assert.ok(output.includes(heading), "PrettyTables output missing " + heading + ": " + output);
}
assert.ok(output.split("\n").length >= 4, "PrettyTables must render multiple rows");
assert.ok(/[0-9]/.test(output), "PrettyTables must render numeric data");
console.log("JULIA PRETTYTABLES PASS", output.split("\n").length, "lines of actual formatted stdout");
