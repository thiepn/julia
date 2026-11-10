import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,mkdir} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium,firefox,webkit} from "playwright";
import {openLegacyWorkspace} from "./r2-legacy-navigation.mjs";

const root=resolve(".");
const types={".html":"text/html;charset=utf-8",".css":"text/css;charset=utf-8",
  ".js":"text/javascript;charset=utf-8",".json":"application/json",
  ".svg":"image/svg+xml",".png":"image/png"};
const server=createServer(async(req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
  const file=resolve(root,"."+(pathname==="/"?"/index.html":pathname));
  if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
  try{
    const bytes=await readFile(file);
    if(res.destroyed||res.writableEnded)return;
    res.writeHead(200,{"Content-Type":types[extname(file)]||"application/octet-stream"});
    res.end(bytes);
  }catch{
    if(res.headersSent||res.destroyed){if(!res.destroyed)res.destroy();return;}
    res.writeHead(404);res.end();
  }
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const origin="http://127.0.0.1:"+server.address().port;
const engines={chromium,firefox,webkit};
const requested=process.env.PHASE05_ENGINES?.split(",")||["chromium"];
const screenshots=process.env.PHASE05_SCREENSHOTS==="1";
const widths=[320,390,768,1280];
const snap=async(page,engine,theme,width,state)=>{
  if(!screenshots||engine!=="chromium"||![390,768,1280].includes(width))return;
  const dir=resolve("phase05-screenshots",theme);await mkdir(dir,{recursive:true});
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior="auto";window.scrollTo(0,0);});
  await page.waitForFunction(()=>Math.abs(window.scrollY)<1);
  await page.screenshot({path:resolve(dir,width+"-"+state+".jpg"),type:"jpeg",
    quality:75,animations:"disabled",fullPage:true});
};
try{
for(const engine of requested){
  assert.ok(engines[engine],"Unknown browser "+engine);
  const browser=await engines[engine].launch({headless:true,
    args:engine==="chromium"?["--no-sandbox"]:[]});
  try{
  for(const theme of ["light","dark"]){
    for(const width of widths){
      const page=await browser.newPage({viewport:{width,height:850},colorScheme:theme});
      const errors=[];page.on("pageerror",e=>errors.push(e.message));
      try{
        await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js",
          route=>route.fulfill({status:200,contentType:"text/javascript",body:"window.__testStub=true;"}));
        await page.goto(origin+"/#lesson/09");
        await page.locator("#r2-stage-learn").waitFor({state:"visible"});
        await openLegacyWorkspace(page);
        await page.locator("#r2-stage-code").waitFor({state:"visible"});

        assert.equal(await page.locator("#scratch-code").count(),1);
        assert.equal(await page.locator("#r2-run").count(),1);
        assert.equal(await page.locator("#local-runner-run").count(),1);
        assert.equal(await page.locator("#r2-run-readiness").count(),0,
          "Readiness is a UI class, not a second execution component");
        assert.equal(await page.locator(".r2-run-readiness").count(),1);
        assert.equal(await page.locator("#local-runner-token").count(),1);
        assert.equal(await page.locator("#local-runner-diagnostic-status").count(),1);
        assert.equal(await page.locator("#external-test-local-status").count(),1);
        assert.equal(await page.locator("#download-draft").count(),1);
        assert.equal(await page.locator("#r2-run").isVisible(),true);
        assert.equal(await page.locator(".r2-mobile-action").isVisible(),false,
          "No fixed duplicate Code Run control");
        await page.waitForFunction(()=>
          document.querySelector("#r2-readiness-text")?.textContent?.includes("blocked for privacy"));
        const readiness=page.locator("#r2-readiness-text");
        assert.match(await readiness.innerText(),/disable JDoodle and reload/i);
        assert.equal(await page.locator(".r2-run-readiness [aria-live]").count(),0,
          "Only canonical runner status reports execution to assistive technology");
        assert.match(await page.locator(".r2-readiness-evidence").innerText(),
          /saved draft is not a Julia run/i);
        await snap(page,engine,theme,width,"initial");

        // Buttons must operate real, native disclosures with deterministic focus.
        await page.locator("#r2-first-run").click();
        assert.equal(await page.locator(".r2-runner-setup").evaluate(el=>el.open),true);
        assert.equal(await page.locator(".r2-first-run-steps").evaluate(el=>el.open),true);
        assert.equal(await page.evaluate(()=>
          document.activeElement===document.querySelector(".r2-first-run-steps > summary")),true);
        const instructions=await page.locator(".r2-first-run-content").innerText();
        for(const term of ["Julia 1.11+","Node.js 22+","node local-runner/server.mjs",
          "Disable JDoodle","127.0.0.1","not inside a sandbox"])
          assert.ok(instructions.includes(term),"Missing setup instruction: "+term);
        assert.match(instructions,/localhost refers to the device running the browser/i);
        await snap(page,engine,theme,width,"setup");

        await page.locator("#r2-run-elsewhere").click();
        assert.equal(await page.locator(".r2-external-guide").evaluate(el=>el.open),true);
        assert.equal(await page.evaluate(()=>
          document.activeElement===document.querySelector(".r2-external-guide > summary")),true);
        assert.match(await page.locator(".r2-external-content").innerText(),/Download .jl/i);
        assert.match(await page.locator(".r2-external-content").innerText(),/not verified/i);
        assert.equal(await page.locator("#download-draft").isVisible(),true);
        await page.locator("#r2-review-task").click();
        assert.equal(await page.locator(".r2-instructions").evaluate(el=>el.open),true);
        assert.equal(await page.evaluate(()=>
          document.activeElement===document.querySelector(".r2-instructions > summary")),true);
        assert.equal(await page.locator("#lesson-jump").inputValue(),"09");

        // Actual existing privacy refusal. No execution/grade is invented.
        assert.equal(await page.locator("#r2-run").isDisabled(),true,
          "Phase 06 advertises privacy setup instead of a runnable action");
        // Probe the original underlying refusal independently of the disabled UI.
        await page.locator("#local-runner-run").evaluate(button=>button.click());
        await page.waitForFunction(()=>
          /Disable (the )?JDoodle/i.test(document.querySelector("#local-runner-status")?.textContent||""),
          null,{timeout:10000});
        assert.match(await readiness.innerText(),/blocked for privacy/);
        assert.equal(await page.locator("#r2-test-head-status").innerText(),"Not run");

        if(engine==="chromium"&&theme==="light"&&width===390){
          // Original app's actual preference change and reload, not a test-only
          // override. A session code is never stored, inferred or transmitted.
          await page.locator("#local-runner-disable-embed").click();
          await page.waitForLoadState("load");
          if(!await page.locator("#r2-stage-code").isVisible())
            await openLegacyWorkspace(page);
          const text=page.locator("#r2-readiness-text");
          await page.waitForFunction(()=>
            document.querySelector("#r2-readiness-text")?.textContent?.includes("not configured"));
          const secret="test-private-session-code-A123456789";
          await page.locator("#r2-first-run").click();
          await page.locator("#local-runner-token").fill(secret);
          await page.waitForFunction(()=>
            document.querySelector("#r2-readiness-text")?.textContent?.includes("not been verified"));
          // Exercise canonical diagnostic status transitions without claiming
          // to have executed Julia. The UI binds the response to the code at
          // the start of the original check, not at result arrival.
          await page.locator("#local-runner-diagnostic-status").evaluate(el=>{
            el.textContent="Checking local Julia without installing packages…";
          });
          await page.waitForFunction(()=>
            document.querySelector("#r2-readiness-text")?.textContent?.includes("Checking the local Julia environment"));
          await page.locator("#local-runner-diagnostic-status").evaluate(el=>{
            el.textContent="Local Julia responded. Missing packages must be installed explicitly in your chosen Julia project.";
          });
          await page.waitForFunction(()=>
            document.querySelector("#r2-readiness-text")?.textContent?.includes("responded to diagnostics"));
          assert.match(await text.innerText(),/has not been verified/i);
          await page.locator("#local-runner-token").fill("test-private-session-code-B123456789");
          await page.waitForFunction(()=>
            document.querySelector("#r2-readiness-text")?.textContent?.includes("has not been verified"));
          assert.doesNotMatch(await text.innerText(),/responded to diagnostics/);
          // A token changed DURING a running diagnostic must also remain
          // unverified even if the old request later reports success.
          await page.locator("#local-runner-diagnostic-status").evaluate(el=>{
            el.textContent="Checking local Julia without installing packages…";
          });
          await page.waitForFunction(()=>
            document.querySelector("#r2-readiness-text")?.textContent?.includes("Checking the local Julia environment"));
          await page.locator("#local-runner-token").fill("test-private-session-code-C123456789");
          await page.locator("#local-runner-diagnostic-status").evaluate(el=>{
            el.textContent="Local Julia responded. Missing packages must be installed explicitly in your chosen Julia project.";
          });
          await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
          assert.doesNotMatch(await text.innerText(),/responded to diagnostics/,
            "Late result for a prior code must not verify a replacement code");
          await page.locator("#local-runner-status").evaluate(el=>{
            el.textContent="Executed with local Julia. Results are not graded.";
          });
          await page.waitForFunction(()=>
            document.querySelector("#r2-readiness-text")?.textContent?.includes("previous submitted draft"));
          assert.match(await text.innerText(),/not graded/i);
          const secretLeaked=await page.evaluate(secret=>
            Object.keys(localStorage).some(k=>k.includes(secret)||localStorage.getItem(k)?.includes(secret)),secret);
          assert.equal(secretLeaked,false,"Never persist the temporary runner session code");
        }

        const panel=await page.locator(".r2-run-readiness").evaluate(el=>({
          content:el.scrollWidth,visible:el.clientWidth
        }));
        assert.ok(panel.content<=panel.visible+2,"Execution readiness panel horizontally overflows at "+width);
        if(engine==="chromium"&&width===390){
          // Text-size-only zoom check does not substitute for manual browser
          // zoom or screen-reader verification, but catches panel overflow.
          await page.evaluate(()=>{document.documentElement.style.fontSize="200%";});
          const resized=await page.locator(".r2-run-readiness").evaluate(el=>({
            content:el.scrollWidth,visible:el.clientWidth
          }));
          assert.ok(resized.content<=resized.visible+2,"200% text zoom overflows readiness panel");
        }
        assert.deepEqual(errors,[],engine+" "+theme+" "+width+" page errors");
        console.log("PHASE05 READINESS PASS",engine,theme,width,
          "privacy, first-run, local-device limitation, disclosures, original tests, focus, no duplicate Run");
      }finally{await page.close();}
    }
  }
  }finally{await browser.close();}
}
}finally{await new Promise(ok=>server.close(ok));}
