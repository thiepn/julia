import test from "node:test";
import assert from "node:assert/strict";
import {stat} from "node:fs/promises";
import {OFFLINE_ASSETS,OFFLINE_CACHE_NAME,offlineAssetKey} from "../src/offline-assets.js";
test("offline cache is explicit, first-party only and complete",async()=>{
 assert.match(OFFLINE_CACHE_NAME,/^amp-julia-offline-/);
 assert.equal(OFFLINE_ASSETS.length,new Set(OFFLINE_ASSETS).size);
 for(const path of OFFLINE_ASSETS){
   assert.match(path,/^(?:src\/[a-z0-9-]+\.js|assets\/julia-lab\.svg|index\.html|styles\.css|app\.webmanifest)$/i);
   assert.equal((await stat(path)).isFile(),true,path);
 }
 assert.ok(OFFLINE_ASSETS.length>=45);
 assert.ok(OFFLINE_ASSETS.includes("src/app.js"));
 assert.ok(OFFLINE_ASSETS.includes("src/offline-study.js"));
 assert.ok(!OFFLINE_ASSETS.some(x=>x.startsWith("local-runner/")||x.includes("submission-print")));
});
test("offline routing never allows external, unknown, query or local Julia execution requests",()=>{
 const scope="https://example.org/julia/";
 assert.equal(offlineAssetKey(scope+"#lesson/02",scope,true),scope+"index.html");
 assert.equal(offlineAssetKey(scope+"index.html#lesson/12",scope,true),scope+"index.html");
 assert.equal(offlineAssetKey(scope+"src/lessons.js",scope),scope+"src/lessons.js");
 for(const url of [scope+"other.html",scope+"sw.js",scope+"private/upload.json",scope+"run",
   scope+"src/lessons.js?draft=hello","https://jdoodle.com/embed/v1/example",
   "https://example.org/other/index.html"]){
   assert.equal(offlineAssetKey(url,scope),null,url);
 }
});
