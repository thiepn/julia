import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";

// Exact parent PR #21 Git blob SHAs. These are deliberate unchanged-source
// guardrails: Phase 06 only changes privacy presentation and its tests.
const baseline={
  "src/lessons.js": "4d5c2d62f5c220773e8377e5dc23fb385e2cfc89",
  "src/local-runner-client.js": "17133861c4f4b4df189d07801d2f4b10d131d847",
  "local-runner/server.mjs": "e8d94b890ac31de2a6d12aeff8696700b447c757",
  "src/course-backup-ui.js": "ad29092f1a6c89ee65bc4e6994a15eb541f9faeb",
  "src/offline-assets.js": "39b48c359720efeb6c1b8e719ffa4f3aebbe39cb",
  "sw.js": "4cf25b2a6aa0217987e2334015665c6995f43938",
  "src/workspace.js": "2b3a5e38eb68a7a189892e400504ac4b6f19c539",
  "src/transfer.js": "956bfcc187a4f15b54ce3dea0a5493ad5a27ec46",
  "src/external-tests.js": "47cc09b577cd97858f6bf318df62a50efb212d7c",
  "src/checks.js": "673a4b93064381980258995bd8168b5df7b0ab7e",
  "src/submission-workflow.js": "0d001020fae5e5372b9704531594ae4374d0a5da",
  "src/plot-preview.js": "d0cb8d6d30c2e76c4aa9b2059e9e65b3f2901cbd"
};
for(const [path,expected] of Object.entries(baseline)){
  const b=await readFile(path);
  const actual=createHash("sha1").update("blob "+b.length+"\0").update(b).digest("hex");
  assert.equal(actual,expected,"Unexpected mutation of original source: "+path);
  console.log("PHASE06 SOURCE PRESERVED",path);
}
