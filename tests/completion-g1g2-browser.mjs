import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium,firefox,webkit} from "playwright";
import {createLocalRunner} from "../local-runner/server.mjs";
const root=resolve("."),types={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8"};
const site=createServer(async(req,res)=>{
 const path=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
 const file=resolve(root,"."+(path==="/" ? "/index.html" : path));
 if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
 try{res.writeHead(200,{"Content-Type":types[extname(file)]||"application/octet-stream"});res.end(await readFile(file));}
 catch{res.writeHead(404);res.end();}
});
await new Promise(done=>site.listen(0,"127.0.0.1",done));
const origin="http://127.0.0.1:"+site.address().port,code="diagnostic-ci-local-session-123456";
const runner=createLocalRunner({token:code,origins:[origin]});
await runner.listen({port:8765});
let passed=0;
try{
 for(const [engine,kind] of [[chromium,"Chromium"],[firefox,"Firefox"],[webkit,"WebKit"]]){
   const browser=await engine.launch({headless:true});
   try{
     for(const [device,options] of [["desktop",{viewport:{width:1280,height:900}}],
       ["mobile",{viewport:{width:390,height:844},isMobile:true,hasTouch:true}]]){
       const page=await browser.newPage({...options,acceptDownloads:true}),errors=[];
       page.on("pageerror",e=>errors.push(e.message));
       await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js",route=>
          route.fulfill({status:200,contentType:"text/javascript",body:"window.__jdoodleTest=true;"}));
       await page.goto(origin+"/#lesson/02");
       await page.getByRole("heading",{name:"Vectors & indexing"}).waitFor();
       await page.locator("#local-runner-token").fill(code);
       await page.locator("#local-runner-diagnose").click();
       assert.match(await page.locator("#local-runner-diagnostic-status").innerText(),/Disable the JDoodle/);
       await page.locator("#local-runner-disable-embed").click();
       await page.getByRole("heading",{name:"Vectors & indexing"}).waitFor();
       await page.locator("#local-runner-token").fill(code);
       await page.locator("#local-runner-diagnose").click();
       await page.waitForFunction(()=>document.querySelector("#local-runner-diagnostic-output").textContent.includes("JULIA_LAB_DIAGNOSTIC_V1"),
           null,{timeout:45000});
       const diag=await page.locator("#local-runner-diagnostic-output").innerText();
       assert.match(diag,/julia_version=/);
       assert.match(diag,/package_LinearAlgebra=available/);
       assert.match(diag,/package_Plots=(?:missing|available)/);
       await page.locator("#scratch-code").fill("println(42)");
       assert.equal(await page.locator("#local-runner-diagnose").isEnabled(),true);
       assert.equal(await page.locator("#local-runner-diagnostic-output").innerText(),"");
       await page.locator("#local-runner-diagnose").click();
       await page.waitForFunction(()=>document.querySelector("#local-runner-diagnostic-output").textContent.includes("JULIA_LAB_DIAGNOSTIC_V1"),null,{timeout:45000});
       await page.locator("#completion-track-choice").selectOption("repair_dimensions");
       assert.match(await page.locator("#completion-track-starter").innerText(),/zeros\(size\(A,1\)\)/);
       await page.goto(origin+"/#lesson/07");
       await page.getByRole("heading",{name:"Loops"}).waitFor();
       await page.locator("#completion-track-choice").selectOption("repair_scope");
       assert.match(await page.locator("#completion-track-starter").innerText(),/total \+= 1/);
       await page.goto(origin+"/#lesson/08");
       await page.getByRole("heading",{name:"Functions"}).waitFor();
       await page.locator("#completion-track-choice").selectOption("repair_types");
       assert.match(await page.locator("#completion-track-starter").innerText(),/zeros\(Int/);
       await page.goto(origin+"/#lesson/09");
       await page.getByRole("heading",{name:"Floating-point numbers"}).waitFor();
       await page.locator("#completion-experiment-choice").selectOption("bigfloat_oracle");
       assert.match(await page.locator("#completion-experiment-code").innerText(),/parse\(BigFloat/);
       await page.goto(origin+"/#lesson/16");
       await page.getByRole("heading",{name:"Conditioning capstone"}).waitFor();
       await page.locator("#completion-track-choice").selectOption("vector_amplification");
       assert.match(await page.locator("#completion-track-starter").innerText(),/vector_amplification/);
       await page.locator("#completion-proof-choice").selectOption("G2-multivariable");
       assert.match(await page.locator("#completion-proof-target").innerText(),/Derive this formula/);
       assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=2));
       const stored=await page.evaluate(()=>JSON.stringify(Object.entries(localStorage)));
       assert.ok(!stored.includes(code));
       assert.deepEqual(errors,[]);
       passed++;console.log("G1 G2 BROWSER PASS",kind,device,"real local diagnostics, repair labs, BigFloat and vector conditioning");
       await page.close();
     }
   }finally{await browser.close();}
 }
}finally{await runner.close();await new Promise(done=>site.close(done));}
assert.equal(passed,6);
