// Native desktop/mobile acceptance: genuine learner Julia Test results through the original runner.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";
import {r2Locator,r2Role} from "./r2-legacy-navigation.mjs";
import {createLocalRunner} from "../local-runner/server.mjs";
const root=resolve("."),mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8"};
const site=createServer(async(req,res)=>{
 const path=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
 const file=resolve(root,"."+(path==="/"?"/index.html":path));
 if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
 try{res.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream"});res.end(await readFile(file));}
 catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>site.listen(0,"127.0.0.1",resolve));
const origin="http://127.0.0.1:"+site.address().port;
const token="local-test-ci-auth-code-nonsecret";
const runner=createLocalRunner({token,origins:[origin]});
await runner.listen({port:8765});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
async function waitStatus(page,id,phrase){
 await page.waitForFunction(([id,phrase])=>document.getElementById(id)?.textContent?.includes(phrase),[id,phrase],{timeout:160000});
}
try{
 for(const spec of [
  {name:"desktop",options:{viewport:{width:1390,height:900}}},
  {name:"mobile",options:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}}
 ]){
   const page=await browser.newPage(spec.options),errors=[];
   page.on("pageerror",error=>errors.push(error.message));
   await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js",route=>route.fulfill({status:200,contentType:"text/javascript",body:"window.__stubJDoodle=true;"}));
   await page.goto(origin+"/#lesson/08");
   await r2Role(page,"heading",{name:"Functions & algorithms"}).waitFor();
   await r2Locator(page,"#local-runner-disable-embed").click();
   await r2Role(page,"heading",{name:"Functions & algorithms"}).waitFor();
   await r2Locator(page,"#local-runner-token").fill(token);
   await r2Locator(page,"#practice-mode").selectOption("a");
   await r2Locator(page,"#scratch-code").fill("count_above(v,t)=count(x->x>t,v)");
   const before=await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1"));
   await r2Locator(page,"#external-test-local-run").click();
   await waitStatus(page,"external-test-local-status","Julia Test assertions passed");
   assert.match(await r2Locator(page,"#external-test-local-output").innerText(),/Test Summary:/);
   assert.equal(await r2Locator(page,"#scratch-code").inputValue(),"count_above(v,t)=count(x->x>t,v)");
   assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1")),before);
   // Selected source-authored edge case uses exactly the existing protected Julia runner.
   await r2Locator(page,"#external-focus-case").selectOption("Negative threshold");
   assert.equal(await r2Locator(page,"#external-focus-local-run").isEnabled(),true);
   await r2Locator(page,"#external-focus-local-run").click();
   await waitStatus(page,"external-focus-local-status","Julia Test assertions passed");
   assert.match(await r2Locator(page,"#external-focus-local-output").innerText(),/Test Summary:/);
   assert.match(await r2Locator(page,"#external-focus-preview").textContent(),/Negative threshold/);
   assert.doesNotMatch(await r2Locator(page,"#external-focus-preview").textContent(),/Threshold inside data/);
   assert.equal(await r2Locator(page,"#scratch-code").inputValue(),"count_above(v,t)=count(x->x>t,v)");
   assert.match(await r2Locator(page,"#external-test-local-status").innerText(),/Julia Test assertions passed/);
   assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1")),before);
   // A change invalidates the previous result; the same canonical test contract now fails.
   await r2Locator(page,"#scratch-code").fill("count_above(v,t)=0");
   assert.equal(await r2Locator(page,"#external-test-local-output").innerText(),"");
   assert.equal(await r2Locator(page,"#external-focus-local-output").innerText(),"");
   await r2Locator(page,"#external-focus-local-run").click();
   await waitStatus(page,"external-focus-local-status","did not complete successfully");
   assert.match(await r2Locator(page,"#external-focus-local-output").innerText(),/Test Failed|Some tests did not pass/);
   await r2Locator(page,"#external-test-local-run").click();
   await waitStatus(page,"external-test-local-status","did not complete successfully");
   assert.match(await r2Locator(page,"#external-test-local-output").innerText(),/Test Failed|Some tests did not pass/);
   assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1")),before);
   // Depth tracks reuse the SAME original lesson editor and authenticated local runner.
   await page.goto(origin+"/#lesson/12");
   await r2Role(page,"heading",{name:"Solve linear systems"}).waitFor();
   await r2Locator(page,"#local-runner-token").fill(token);
   await r2Locator(page,"#completion-track-choice").selectOption("pivoted_lr");
   const reference="using LinearAlgebra\nfunction pivoted_lr(A)\n F=lu(A)\n return (p=F.p,L=Matrix(F.L),U=Matrix(F.U))\nend";
   await r2Locator(page,"#scratch-code").fill(reference);
   await r2Locator(page,"#completion-test-local-run").click();
   await waitStatus(page,"completion-test-local-status","Julia Test assertions passed");
   assert.match(await r2Locator(page,"#completion-test-local-output").innerText(),/Test Summary:/);
   assert.equal(await r2Locator(page,"#scratch-code").inputValue(),reference);
   assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,spec.name+" horizontal overflow");
   assert.deepEqual(errors,[]);
   await page.close();
   console.log("LOCAL TEST CHROMIUM PASS",spec.name,"real original/dynamic tests, failure, preserved draft and progress");
 }
}finally{
 await browser.close();
 await runner.close();
 await new Promise(resolve=>site.close(resolve));
}
