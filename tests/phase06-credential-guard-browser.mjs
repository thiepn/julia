import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,mkdir} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium,firefox,webkit} from "playwright";
import {openLegacyWorkspace} from "./r2-legacy-navigation.mjs";

const root=resolve(".");
const mime={".html":"text/html;charset=utf-8",".js":"text/javascript;charset=utf-8",
  ".css":"text/css;charset=utf-8",".svg":"image/svg+xml",".json":"application/json"};
const server=createServer(async(req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
  const path=resolve(root,"."+(pathname==="/"?"/index.html":pathname));
  if(!(path===root||path.startsWith(root+sep))){res.writeHead(403);res.end();return;}
  try{const bytes=await readFile(path);
    if(res.destroyed||res.writableEnded)return;
    res.writeHead(200,{"Content-Type":mime[extname(path)]||"application/octet-stream"});res.end(bytes);
  }catch{if(res.headersSent||res.destroyed){if(!res.destroyed)res.destroy();return;}
    res.writeHead(404);res.end();}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const origin="http://127.0.0.1:"+server.address().port;
const engines={chromium,firefox,webkit};
const requested=(process.env.PHASE06_ENGINES||"chromium").split(",");
const screenshots=process.env.PHASE06_SCREENSHOTS==="1";
const snap=async(page,engine,theme,width,name)=>{
  if(!screenshots||engine!=="chromium"||![390,768,1280].includes(width))return;
  const dir=resolve("phase06-screenshots",theme);await mkdir(dir,{recursive:true});
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior="auto";window.scrollTo(0,0);});
  await page.waitForFunction(()=>Math.abs(window.scrollY)<1);
  await page.screenshot({path:resolve(dir,width+"-"+name+".jpg"),
    fullPage:true,type:"jpeg",quality:76,animations:"disabled"});
};
try{
  for(const engine of requested){
    assert.ok(engines[engine],"Invalid browser engine "+engine);
    const browser=await engines[engine].launch({headless:true,args:engine==="chromium"?["--no-sandbox"]:[]});
    try{
      for(const theme of ["light","dark"]){
        for(const width of [320,390,768,1280]){
          const page=await browser.newPage({viewport:{width,height:850},colorScheme:theme});
          const errors=[];
          page.on("pageerror",e=>errors.push(e.message));
          await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js",route=>
            route.fulfill({status:200,contentType:"text/javascript",body:
              'window.__phase06ProviderAtLoad={disabled:document.getElementById("local-runner-token")?.disabled, value:document.getElementById("local-runner-token")?.value};'}));
          try{
            await page.goto(origin+"/#lesson/09");
            await page.locator("#r2-stage-learn").waitFor({state:"visible"});
            const token=page.locator("#local-runner-token");
            assert.equal(await token.isDisabled(),true,
              "P0 RED: input must be locked in initial HTML before the provider loads");
            assert.equal(await token.inputValue(),"","No session code may appear on first render");
            await openLegacyWorkspace(page);
            await page.locator("#r2-stage-code").waitFor({state:"visible"});
            await page.waitForFunction(()=>window.__phase06ProviderAtLoad!==undefined);
            const exposed=await page.evaluate(()=>window.__phase06ProviderAtLoad);
            assert.deepEqual(exposed,{disabled:true,value:""},
              "Third-party script must not observe an editable credential at load");
            assert.equal(await token.isDisabled(),true,"Entry remains blocked after provider loads");
            assert.equal(await token.inputValue(),"");
            await snap(page,engine,theme,width,"privacy-locked");
            // On mobile the connection disclosure is correctly collapsed until
            // requested. Verify the private-input explanation when it is opened.
            await page.locator("#r2-first-run").click();
            const explanation=page.locator("#local-runner-token-safety");
            assert.equal(await explanation.isVisible(),true);
            assert.match(await explanation.innerText(),/disable JDoodle.*reload/i);
            assert.ok((await token.getAttribute("aria-describedby")||"").includes("local-runner-token-safety"));
            assert.equal(await page.locator("#r2-run").isVisible(),true);
            assert.equal(await page.locator("#r2-run").isDisabled(),true,"Blocked Run must not appear executable");
            assert.equal(await page.locator("#r2-disable-jdoodle").isVisible(),true);
            assert.equal(await page.locator(".r2-mobile-action").isVisible(),false);
            await page.locator("#scratch-code").press("Control+Enter");
            await page.waitForFunction(()=>
              /Disable (the )?JDoodle/i.test(document.querySelector("#local-runner-status")?.textContent||""),
              null,{timeout:10000});
            assert.equal(await page.locator("#r2-test-head-status").innerText(),"Not run");
            await snap(page,engine,theme,width,"blocked-setup");

            await page.locator("#r2-disable-jdoodle").click();
            await page.waitForFunction(()=>
              localStorage.getItem("amp-julia-lab:jdoodle-embed-v1")==="");
            await page.waitForFunction(()=>
              document.querySelector("#local-runner-token")?.disabled===false);
            if(!await page.locator("#r2-stage-code").isVisible())await openLegacyWorkspace(page);
            assert.equal(await token.isEnabled(),true);
            assert.equal(await token.inputValue(),"");
            assert.equal(await page.locator("#r2-run").isEnabled(),true);
            assert.equal(await page.locator("#r2-disable-jdoodle").isVisible(),false);
            assert.equal(await explanation.isVisible(),false);
            const privateCode="PHASE06-PRIVATE-CODE-DO-NOT-LOG-123456789";
            await page.locator("#r2-first-run").click();
            await token.fill(privateCode);
            assert.equal(await token.inputValue(),privateCode);
            assert.doesNotMatch(await page.locator("#r2-readiness-text").innerText(),/connected|verified.*session/i);
            await page.locator("#r2-run").click();
            await page.waitForFunction(()=>
              /Could not connect|Running on your computer/i.test(document.querySelector("#local-runner-status")?.textContent||""),
              null,{timeout:12000});
            assert.equal(await page.locator("#r2-test-head-status").innerText(),"Not run");
            const actualStorage=await page.evaluate(()=>
              Object.entries(localStorage).map(([key,value])=>key+" "+value).join("\n"));
            assert.ok(!actualStorage.includes(privateCode),"Session code cannot be persisted");
            assert.equal(await page.locator("#scratch-code").count(),1);
            assert.equal(await page.locator("#local-runner-run").count(),1);
            assert.equal(await page.locator("#download-draft").count(),1);
            assert.equal(await page.locator("#lesson-jump").inputValue(),"09");
            await snap(page,engine,theme,width,"local-enabled");

            await page.locator("#r2-utilities-open").click();
            await page.locator(".r2-legacy-tools > summary").click();
            await page.locator("#default-embed").click();
            await page.waitForFunction(()=>
              document.querySelector("#local-runner-token")?.disabled===true);
            assert.equal(await page.locator("#local-runner-token").inputValue(),"");
            assert.ok(!await page.evaluate(()=>Object.values(localStorage).join("").includes(privateCode)));
            assert.deepEqual(errors,[],engine+" "+theme+" "+width+" page exceptions");
            const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
            assert.ok(overflow<=2,"No page-level overflow at "+width+"px: "+overflow+"px");
            console.log("PHASE06 PRIVACY PASS",engine,theme,width,
              "pre-script lock; original refusal; explicit disable/reload; re-lock");
          }finally{await page.close();}
        }
      }
    }finally{await browser.close();}
  }
}finally{await new Promise(ok=>server.close(ok));}
