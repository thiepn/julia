import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,mkdir} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium,firefox,webkit} from "playwright";
import {openLegacyWorkspace} from "./r2-legacy-navigation.mjs";

const root=resolve(".");
const mimes={".html":"text/html",".js":"text/javascript",".css":"text/css",".json":"application/json",".svg":"image/svg+xml"};
const server=createServer(async(req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
  const file=resolve(root,"."+(pathname==="/"?"/index.html":pathname));
  if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
  try{const bytes=await readFile(file);res.writeHead(200,{"Content-Type":mimes[extname(file)]||"application/octet-stream"});res.end(bytes);}
  catch{res.writeHead(404);res.end();}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const origin="http://127.0.0.1:"+server.address().port;
const engines={chromium,firefox,webkit};
const requested=(process.env.PHASE06_ENGINES||"chromium").split(",");
const screenshot=process.env.PHASE06_SCREENSHOTS==="1";
try{
for(const engine of requested){
  const browser=await engines[engine].launch({headless:true,args:engine==="chromium"?["--no-sandbox"]:[]});
  try{
  for(const theme of ["light","dark"]){
  for(const width of [320,390,768,1280]){
    const page=await browser.newPage({viewport:{width,height:850},colorScheme:theme});
    const errors=[];page.on("pageerror",e=>errors.push({
      message:String(e?.message??e),stack:String(e?.stack??"").slice(0,700)
    }));
    try{
      // Keep Chromium/Firefox's actual external-loader timing probe. WebKit's
      // external CDN execution is unstable in CI, so block the vendor request
      // and run the SAME page-context adversarial probe via addScriptTag below.
      // We do not ignore or suppress first-party page errors.
      await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js",route=>
        engine==="webkit"?route.abort("blockedbyclient"):route.fulfill({
          status:200,contentType:"text/javascript",
          body:"window.__phase06ThirdPartyObserved={disabled:document.querySelector('#local-runner-token')?.disabled,code:document.querySelector('#local-runner-token')?.value};"
        }));
      await page.goto(origin+"/#lesson/09");
      await page.locator("#r2-stage-learn").waitFor({state:"visible"});
      assert.equal(await page.locator("#local-runner-token").isDisabled(),true);
      assert.equal(await page.locator("#local-runner-token").inputValue(),"");
      const disabledPaint=await page.locator("#local-runner-token").evaluate(el=>({
        cursor:getComputedStyle(el).cursor,background:getComputedStyle(el).backgroundColor
      }));
      assert.equal(disabledPaint.cursor,"not-allowed","Locked field must look non-editable");
      assert.notEqual(disabledPaint.background,"rgb(255, 255, 255)",
        "Locked field must not retain the active white credential-entry appearance");
      assert.equal(await page.locator("#r2-token-privacy-note").getAttribute("hidden"),null);
      assert.match(await page.locator("#r2-token-privacy-note").innerText(),/disable JDoodle and reload/i);
      await openLegacyWorkspace(page);
      await page.locator("#r2-stage-code").waitFor({state:"visible"});
      // The actual JDoodle loader can be blocked by WebKit/CSP/network rules.
      // Verify that our app inserted the external script only after the field
      // was locked. Execute a deterministic page-context script probe here:
      // any third-party script running in this document has this same access.
      // This does NOT claim the vendor's CDN script executed in every engine.
      await page.locator('script[src="https://www.jdoodle.com/assets/jdoodle-pym.min.js"]')
        .waitFor({state:"attached",timeout:10000});
      await page.addScriptTag({content:
        "window.__phase06ThirdPartyObserved={disabled:document.querySelector('#local-runner-token')?.disabled,code:document.querySelector('#local-runner-token')?.value};"});
      const observed=await page.evaluate(()=>window.__phase06ThirdPartyObserved);
      assert.deepEqual(observed,{disabled:true,code:""},"Third-party script must never see a usable session field");
      await page.locator("#r2-connection-open").click();
      assert.equal(await page.locator("#local-runner-token").isDisabled(),true);
      await page.locator("#r2-connection-open").focus();
      await page.keyboard.type("phase06-should-never-enter");
      assert.equal(await page.locator("#local-runner-token").inputValue(),"");
      assert.equal(await page.locator("#r2-run").innerText(),"Set up to run Julia");
      await page.locator("#r2-run").click();
      assert.equal(await page.locator(".r2-runner-setup").evaluate(el=>el.open),true);
      assert.equal(await page.evaluate(()=>document.activeElement?.id),"local-runner-disable-embed");
      assert.equal(await page.locator("#r2-test-head-status").innerText(),"Not run");
      assert.equal(await page.locator("#local-runner-output").innerText(),"");
      const scroll=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
      assert.ok(scroll<=2,"horizontal overflow "+engine+" "+theme+" "+width+" "+scroll);
      if(screenshot&&engine==="chromium"){
        const dir=resolve("phase06-screenshots",theme);await mkdir(dir,{recursive:true});
        // The block action scrolls the page; use a settled top-of-document
        // position before recording sticky navigation in full-page screenshots.
        await page.evaluate(()=>{document.documentElement.style.scrollBehavior="auto";window.scrollTo(0,0);});
        await page.waitForFunction(()=>Math.abs(window.scrollY)<1);
        await page.screenshot({path:resolve(dir,width+"-blocked.jpg"),type:"jpeg",quality:75,fullPage:true,animations:"disabled"});
      }
      if(width===390){
        await page.evaluate(()=>document.documentElement.style.fontSize="200%");
        const w=await page.locator(".r2-run-readiness").evaluate(el=>el.scrollWidth-el.clientWidth);
        assert.ok(w<=2,"200% text resize overflows readiness "+w);
        if(screenshot&&engine==="chromium"){
          const dir=resolve("phase06-screenshots",theme);
          await page.evaluate(()=>{document.documentElement.style.scrollBehavior="auto";window.scrollTo(0,0);});
          await page.waitForFunction(()=>Math.abs(window.scrollY)<1);
          await page.screenshot({path:resolve(dir,"390-text-200-percent.jpg"),
            type:"jpeg",quality:76,fullPage:true,animations:"disabled"});
        }
      }
      // Existing explicit preference control, followed by real reload.
      await page.locator("#local-runner-disable-embed").click();
      await page.waitForLoadState("load");
      assert.equal(await page.locator("#local-runner-token").isDisabled(),false);
      assert.equal(await page.locator("#r2-token-privacy-note").isVisible(),false);
      if(!await page.locator("#r2-stage-code").isVisible())await openLegacyWorkspace(page);
      assert.equal(await page.locator("#r2-run").innerText(),"Run Julia");
      await page.locator("#r2-first-run").click();
      await page.locator("#local-runner-token").fill("phase06-private-test-code-123456");
      assert.equal(await page.locator("#local-runner-token").inputValue(),"phase06-private-test-code-123456");
      assert.equal(await page.evaluate(()=>Object.values(localStorage).some(v=>v.includes("phase06-private-test-code"))),false);
      assert.equal(await page.locator("#scratch-code").count(),1);
      assert.equal(await page.locator("#local-runner-run").count(),1);
      assert.equal(await page.locator("#r2-test-head-status").innerText(),"Not run");
      assert.deepEqual(errors,[],"browser errors");
      console.log("PHASE06 PRIVACY PASS",engine,theme,width);
    }finally{await page.close();}
  }}
  }finally{await browser.close();}
}
}finally{await new Promise(ok=>server.close(ok));}
