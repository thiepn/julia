import test from "node:test";
import assert from "node:assert/strict";
import {stat,readFile} from "node:fs/promises";
import {OFFLINE_ASSETS,OFFLINE_CACHE_NAME,offlineAssetKey} from "../src/offline-assets.js";
test("offline cache is explicit, first-party only and complete",async()=>{
 assert.match(OFFLINE_CACHE_NAME,/^amp-julia-offline-/);
 assert.equal(OFFLINE_ASSETS.length,new Set(OFFLINE_ASSETS).size);
 for(const path of OFFLINE_ASSETS){
   assert.match(path,/^(?:src\/[a-z0-9-]+\.js|assets\/julia-lab(?:\.svg|-(?:192|512)\.png)|index\.html|styles\.css|app\.webmanifest)$/i);
   assert.equal((await stat(path)).isFile(),true,path);
 }
 assert.ok(OFFLINE_ASSETS.length>=45);
 for(const px of [192,512]){
   const data=await readFile("assets/julia-lab-"+px+".png");
   assert.equal(data.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
   assert.equal(data.readUInt32BE(16),px);
   assert.equal(data.readUInt32BE(20),px);
 }

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
