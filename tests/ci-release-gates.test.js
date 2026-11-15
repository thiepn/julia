import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const WORKFLOW=".github/workflows/julia-lab.yml";
const REQUIRED_JOBS=["authentic-plotting","r2-visual","verify"];

test("main pushes and every main-targeting PR run all required checks",async()=>{
 const yaml=await readFile(WORKFLOW,"utf8");
 const [events,jobs]=yaml.split(/^jobs:\s*$/m);
 assert.ok(events&&jobs,"workflow must define events and jobs");
 assert.match(events,/^  push:\n    branches: \[[^\]\n]*\bmain\b/m,
   "post-merge main pushes must run verification");
 assert.match(events,/^  pull_request:\n    branches: \[[^\]\n]*\bmain\b/m,
   "main pull requests must run verification");
 assert.doesNotMatch(events,/^\s+(?:paths|paths-ignore):/m,
   "required PR checks must not be skipped for unrelated-file changes");
 const jobIds=[...jobs.matchAll(/^  ([a-z][\w-]*):\s*$/gm)].map(match=>match[1]);
 assert.deepEqual(jobIds.sort(),REQUIRED_JOBS,
   "do not remove or rename required GitHub Actions jobs");
 assert.match(yaml,/^permissions:\n  contents: read$/m,
   "the workflow must retain least-privilege read access");
});
