import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,mkdir} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium,firefox,webkit} from "playwright";
import {openLegacyWorkspace} from "./r2-legacy-navigation.mjs";

const root=resolve(".");
const mimes={".html":"text/html;charset=utf-8",".css":"text/css;charset=utf-8",
  ".js":"text/javascript;charset=utf-8",".json":"application/json",".svg":"image/svg+xml"};
const server=createServer(async(req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
  const file=resolve(root,"."+(pathname==="/"?"/index.html":pathname));
  if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
  try{const bytes=await readFile(file);
    if(res.destroyed||res.writableEnded)return;
    res.writeHead(200,{"Content-Type":mimes[extname(file)]||"application/octet-stream"});res.end(bytes);
  }catch{if(res.headersSent||res.destroyed){if(!res.destroyed)res.destroy();return;}
    res.writeHead(404);res.end();}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const origin="http://127.0.0.1:"+server.address().port;
const engines={chromium,firefox,webkit};
const requested=process.env.PHASE04_ENGINES?.split(",")||["chromium"];
const screenshots=process.env.PHASE04_SCREENSHOTS==="1";
try{
  for(const engine of requested){
    assert.ok(engines[engine],"invalid engine "+engine);
    const browser=await engines[engine].launch({headless:true,args:engine==="chromium"?["--no-sandbox"]:[]});
    try{
      for(const theme of ["light","dark"]){
        for(const width of [320,390,768,1280]){
          const page=await browser.newPage({viewport:{width,height:844},colorScheme:theme}),errors=[];
          page.on("pageerror",e=>errors.push(e.message));
          try{
            await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js",route=>
              route.fulfill({status:200,contentType:"text/javascript",body:"window.__mock=true;"}));
            await page.goto(origin+"/#lesson/09");
            await page.locator("#r2-stage-learn").waitFor({state:"visible"});
            await openLegacyWorkspace(page);
            const mobile=width<768;
            await page.locator("#r2-stage-code").waitFor({state:"visible"});
            assert.equal(await page.locator("#lesson-jump").inputValue(),"09");
            assert.equal(await page.locator("#scratch-code").count(),1);
            assert.equal(await page.locator("#local-runner-run").count(),1);
            assert.equal(await page.locator("#local-runner-output").count(),1);
            assert.equal(await page.locator("#external-test-local-status").count(),1);
            assert.equal(await page.locator("#local-runner-diagnostic-status").count(),1);
            assert.equal(await page.locator("#r2-run").isVisible(),true);
            assert.equal(await page.locator(".r2-mobile-action").isVisible(),false,
              "No duplicate mobile Run dock in Code");
            assert.equal(await page.locator("#r2-test-desk").evaluate(el=>el.open),!mobile,
              "Original source test panel is compact only on narrow screens");
            assert.equal(await page.locator(".r2-runner-setup").evaluate(el=>el.open),!mobile,
              "Connection diagnostics are collapsed, never removed");
            assert.equal(await page.locator(".r2-instructions").evaluate(el=>el.open),!mobile);
            assert.equal(await page.locator("#r2-test-case-count").innerText(),"4 source test cases");
            assert.equal(await page.locator("#r2-test-head-status").innerText(),"Not run");
            assert.match(await page.locator(".r2-execution-explainer").innerText(),/saved draft is not an executed result/i);
            assert.equal(await page.locator("#local-runner-status").isVisible(),true,
              "Canonical actual runner status stays visible");
            assert.equal(await page.locator("#r2-connection-open").isVisible(),true);
            if(mobile){
              const height=await page.evaluate(()=>document.documentElement.scrollHeight);
              if(width===390)assert.ok(height<=4269,
                "Phase 04 default Code height "+height+" must improve >=35% on 6569px baseline");
              const visibleRuns=await page.locator('#r2-stage-code #r2-run:visible').count();
              assert.equal(visibleRuns,1,"Exactly one visible workspace Run CTA");
              assert.equal(await page.locator("#local-runner-run").isVisible(),false);
            }
            const outputBefore=await page.locator("#local-runner-output").innerText();
            await page.locator("#scratch-code").fill('println("phase04 retained source")');
            assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:draft:v1:09")),
              'println("phase04 retained source")');
            if(screenshots&&engine==="chromium"&&[390,768,1280].includes(width)){
              const dir=resolve("phase04-screenshots",theme);await mkdir(dir,{recursive:true});
              // Playwright fills the source textarea below the fold. Return to
              // the actual initial top before capturing the sticky navigation;
              // otherwise a full-page screenshot places it at a scrolled offset.
              await page.evaluate(()=>{
                document.documentElement.style.scrollBehavior="auto";
                window.scrollTo(0,0);
              });
              await page.waitForFunction(()=>Math.abs(window.scrollY)<1);
              await page.screenshot({path:resolve(dir,width+"-code-compact.jpg"),fullPage:true,
                type:"jpeg",quality:76,animations:"disabled"});
            }
            // Phase 06: the blocked Run CTA opens the original privacy setup,
            // without invoking Julia or fabricating a successful execution.
            await page.locator("#r2-run").click();
            assert.equal(await page.locator(".r2-runner-setup").evaluate(el=>el.open),true);
            assert.equal(await page.locator("#local-runner-token").isDisabled(),true);
            assert.equal(await page.locator("#local-runner-output").innerText(),outputBefore);
            assert.equal(await page.locator("#r2-test-head-status").innerText(),"Not run");
            // Shortcut opens the original connection settings and places focus
            // on the accessible summary, without replacing connection state.
            await page.locator("#r2-connection-open").click();
            assert.equal(await page.locator(".r2-runner-setup").evaluate(el=>el.open),true);
            assert.equal(await page.evaluate(()=>document.activeElement?.textContent?.includes("Local Julia connection")),true);
            assert.equal(await page.locator("#local-runner-token").isVisible(),true);
            await page.locator(".r2-runner-setup > summary").click();
            await page.locator("#r2-tests-jump").click();
            assert.equal(await page.locator("#r2-test-desk").evaluate(el=>el.open),true);
            assert.equal(await page.locator("#external-test-cases li").count(),4);
            await page.locator("#external-test-local-run").click();
            await page.waitForFunction(()=>/Disable (the )?JDoodle/i.test(document.querySelector("#r2-test-head-status")?.textContent||""));
            assert.equal(await page.locator("#r2-test-head-status").innerText(),
              await page.locator("#external-test-local-status").innerText(),
              "Compact test status mirrors only canonical local Julia Test evidence");
            assert.equal(await page.locator("#external-test-local-output").innerText(),"");
            assert.equal(await page.locator("#scratch-code").inputValue(),
              'println("phase04 retained source")');
            const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
            assert.ok(overflow<=2,engine+" "+theme+" "+width+" horizontal overflow "+overflow);
            assert.deepEqual(errors,[],engine+" "+theme+" "+width+" browser errors");
            // A fresh document on the canonical lesson route is the actual
            // persistence check; the prior legacy workspace may leave a Code
            // hash and must not be assumed to reset into the Learn stage.
            await page.goto(origin+"/#lesson/09");
            await page.locator("#lesson-main").waitFor({state:"visible"});
            if(!await page.locator("#r2-stage-code").isVisible())
              await openLegacyWorkspace(page);
            assert.equal(await page.locator("#scratch-code").inputValue(),
              'println("phase04 retained source")',"Draft persists across browser reload");
            console.log("PHASE04 WORKBENCH PASS",engine,theme,width,
              "single editor/run, compact panels, actual status, connection, Julia Test source, draft persistence");
          }finally{await page.close();}
        }
      }
    }finally{await browser.close();}
  }
}finally{await new Promise(done=>server.close(done));}
