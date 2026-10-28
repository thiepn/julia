// Genuine service-worker offline acceptance; no simulated service worker or mock offline routing.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";
import {r2Locator,r2Role} from "./r2-legacy-navigation.mjs";
const root=resolve("."),types={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".webmanifest":"application/manifest+json"};
const server=createServer(async(req,res)=>{
 const path=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
 const file=resolve(root,"."+(path==="/" ? "/index.html":path));
 if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
 try{res.writeHead(200,{"Content-Type":types[extname(file)]||"application/octet-stream"});res.end(await readFile(file));}
 catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
 for(const device of [{name:"desktop",options:{viewport:{width:1380,height:900}}},{name:"mobile",options:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}}]){
   const context=await browser.newContext({...device.options,acceptDownloads:true,serviceWorkers:"allow"});
   const page=await context.newPage(),errors=[];
   page.on("pageerror",error=>errors.push(error.message));
   await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js",route=>
     route.fulfill({status:200,contentType:"text/javascript",body:"window.__stubJDoodle=true;"}));
   await page.goto(origin+"/#lesson/02");
   await r2Role(page,"heading",{name:"Vectors & indexing"}).waitFor();
   await r2Locator(page,"#local-runner-disable-embed").click();
   await r2Role(page,"heading",{name:"Vectors & indexing"}).waitFor();
   await r2Locator(page,"#offline-access").evaluate(el=>el.open=true);
   await r2Locator(page,"#offline-status").getByText("Lessons and browser-based practice available offline on this device.").waitFor({timeout:30000});
   // On a first mobile install an activated worker may not yet control the
   // existing document. An online reload is the real first-use activation
   // path; offline acceptance only starts after confirmed controller custody.
   if(!await page.evaluate(()=>navigator.serviceWorker.controller!==null)){
     await page.reload();
     await r2Role(page,"heading",{name:"Vectors & indexing"}).waitFor();
   }
   await page.waitForFunction(()=>navigator.serviceWorker.controller!==null,null,{timeout:10000});
   const cached=await page.evaluate(async()=>{
     const worker=await navigator.serviceWorker.ready;
     const keys=await caches.keys();
     const cache=await caches.open(keys.find(k=>k.startsWith("amp-julia-offline-")));
     const requests=await cache.keys();
     return {scope:worker.scope,keys,urls:requests.map(r=>r.url)};
   });
   assert.equal(cached.scope,origin+"/");
   assert.equal(cached.keys.filter(x=>x.startsWith("amp-julia-offline-")).length,1);
   assert.ok(cached.urls.some(x=>x.endsWith("/src/lessons.js")));
   assert.ok(cached.urls.some(x=>x.endsWith("/src/offline-study.js")));
   assert.ok(cached.urls.some(x=>x.endsWith("/src/touch-code.js")));
   assert.ok(cached.urls.some(x=>x.endsWith("/app.webmanifest")));
   assert.ok(cached.urls.some(x=>x.endsWith("/assets/julia-lab-192.png")));
   assert.ok(cached.urls.some(x=>x.endsWith("/assets/julia-lab-512.png")));
   assert.ok(cached.urls.every(x=>x.startsWith(origin+"/")));
   assert.ok(!cached.urls.some(x=>x.includes("jdoodle.com")||x.endsWith("/run")||x.includes("token=")));
   const source='println("offline-δ")';
   await r2Locator(page,"#scratch-code").fill(source);
   const saved=await page.evaluate(()=>localStorage.getItem("amp-julia-lab:draft:v1:02"));
   assert.equal(saved,source);
   await context.setOffline(true);
   // Phase 09: touch insertion works with the genuine service worker offline.
   // A canonical input event must preserve the exact lesson-owned draft.
   let expectedSource=source;
   if(device.name==="mobile"){
     const keys=page.locator(".r2-touch-keys");
     assert.equal(await keys.isVisible(),true);
     assert.equal(await keys.locator("button").count(),8);
     await page.locator("#scratch-code").evaluate(el=>{
       el.setSelectionRange(el.value.length,el.value.length);
     });
     await keys.locator('[data-touch-key="parens"]').click();
     expectedSource=source+"()";
     assert.equal(await page.locator("#scratch-code").inputValue(),expectedSource);
     assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:draft:v1:02")),expectedSource);
     assert.equal(await page.locator("#scratch-code").evaluate(el=>el.selectionStart),source.length+1);
   }else{
     assert.equal(await page.locator(".r2-touch-keys").isVisible(),false);
   }
   await page.goto(origin+"/#lesson/09");
   await r2Role(page,"heading",{name:"Floating-point numbers"}).waitFor();
   await r2Locator(page,"#offline-access").evaluate(el=>el.open=true);
   await r2Locator(page,"#offline-status").getByText("Offline: cached lessons and practice available. External Julia services may be unavailable.").waitFor();
   assert.equal(await r2Locator(page,"#offline-indicator").isVisible(),true);
   assert.equal(await r2Locator(page,"#runtime-state").innerText(),"Embed disabled");
   // Re-enable the default course embed setting while disconnected. The app
   // must suppress external JDoodle loading without disturbing the local source.
   await page.evaluate(()=>localStorage.removeItem("amp-julia-lab:jdoodle-embed-v1"));
   // After inspecting offline status in Tools, return to the lesson before refresh.
   await page.locator("#r2-course-open").click();
   await page.locator('.lesson-link[href="#lesson/09"]').click();
   await page.reload();
   await r2Role(page,"heading",{name:"Floating-point numbers"}).waitFor();
   assert.match(await r2Locator(page,"#runtime-state").innerText(),/Offline/);
   assert.equal(await r2Locator(page,"#embed-slot .jdoodle-embed").count(),0);
   assert.equal(await r2Locator(page,'script[src^="https://www.jdoodle.com/"]').count(),0);
   await page.goto(origin+"/#lesson/02");
   await r2Role(page,"heading",{name:"Vectors & indexing"}).waitFor();
   assert.equal(await r2Locator(page,"#scratch-code").inputValue(),expectedSource);
   assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:draft:v1:02")),expectedSource);
   const [download]=await Promise.all([page.waitForEvent("download"),r2Locator(page,"#download-draft").click()]);
   assert.match(download.suggestedFilename(),/\.jl$/);
   const output=await readFile(await download.path(),"utf8");
   assert.match(output,/offline-δ/);
   if(device.name==="mobile")assert.match(output,/println\("offline-δ"\)\(\)/);
   const icon=await page.evaluate(async()=>{
     const res=await fetch("./assets/julia-lab-192.png");
     const blob=await res.blob();
     const image=await createImageBitmap(blob);
     return {ok:res.ok,width:image.width,height:image.height,type:blob.type};
   });
   assert.deepEqual(icon,{ok:true,width:192,height:192,type:"image/png"});
   await page.goto(origin+"/#lesson/15");
   await r2Role(page,"heading",{name:"Least-squares fitting"}).waitFor();
   assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,device.name+" overflow");
   assert.deepEqual(errors,[]);
   await context.setOffline(false);
   await context.close();
   console.log("AMP OFFLINE BROWSER PASS",device.name,"real service worker, no internet, all lessons, saved source and export");
 }
}finally{
 await browser.close();await new Promise(resolve=>server.close(resolve));
}
