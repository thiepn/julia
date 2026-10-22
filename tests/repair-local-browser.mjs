// Execute original lesson repairs with genuine Julia; never treat output as a grade.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";
const {createLocalRunner}=await import("../local-runner/server.mjs");
const {repairs}=await import("../src/repair-cases.js");
const root=resolve("."),mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8"};
const site=createServer(async(req,res)=>{
 const path=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
 const file=resolve(root,"."+(path==="/" ? "/index.html":path));
 if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
 try{res.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream"});res.end(await readFile(file));}
 catch{res.writeHead(404);res.end();}
});
await new Promise(done=>site.listen(0,"127.0.0.1",done));
const origin="http://127.0.0.1:"+site.address().port,token="real-julia-amp-repair-local-key";
const runner=createLocalRunner({token,origins:[origin]});
await runner.listen({port:8765});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const by=id=>repairs.find(x=>x.id===id);
try{
 for(const device of [
  {name:"desktop",options:{viewport:{width:1390,height:900}}},
  {name:"mobile",options:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}}
 ]){
   const page=await browser.newPage(device.options),errors=[];
   page.on("pageerror",error=>errors.push(error.message));
   await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js",route=>
     route.fulfill({status:200,contentType:"text/javascript",body:"window.__stubJDoodle=true;"}));
   await page.goto(origin+"/#lesson/02");
   await page.getByRole("heading",{name:"Vectors & indexing"}).waitFor();
   const mainSource='println("keep main draft separate")';
   await page.locator("#scratch-code").fill(mainSource);
   const initialProgress=await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1"));
   await page.locator("#repair-run-local").click();
   assert.match(await page.locator("#repair-run-status").innerText(),/Disable JDoodle/);
   await page.locator("#local-runner-disable-embed").click();
   await page.getByRole("heading",{name:"Vectors & indexing"}).waitFor();
   await page.locator("#local-runner-token").fill(token);
   await page.locator("#repair-editor").fill(by("02").broken);
   await page.locator("#repair-run-local").click();
   await page.locator("#repair-run-status").getByText("Julia repair draft failed",{exact:false}).waitFor({timeout:160000});
   assert.match(await page.locator("#repair-run-output").innerText(),/BoundsError/);
   assert.equal(await page.locator("#scratch-code").inputValue(),mainSource);
   // An entirely valid repair executes, but does not create a grade.
   await page.locator("#repair-editor").fill(by("02").reference);
   assert.equal(await page.locator("#repair-run-output").innerText(),"");
   await page.locator("#repair-run-local").click();
   await page.locator("#repair-run-status").getByText("Repair draft executed with local Julia",{exact:false}).waitFor({timeout:160000});
   assert.equal((await page.locator("#repair-run-output").innerText()).trim(),"3");
   assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1")),initialProgress);
   // Reset leaves the source editor and output untouched outside the repair.
   page.once("dialog",dialog=>dialog.accept());
   await page.locator("#repair-reset").click();
   assert.equal(await page.locator("#repair-editor").inputValue(),by("02").broken);
   assert.equal(await page.locator("#repair-run-output").innerText(),"");
   assert.equal(await page.locator("#scratch-code").inputValue(),mainSource);
   // Distinct numerical exercise with real Julia evidence.
   await page.goto(origin+"/#lesson/13");
   await page.getByRole("heading",{name:"Elimination & triangular systems"}).waitFor();
   await page.locator("#local-runner-token").fill(token);
   await page.locator("#repair-editor").fill(by("13").reference);
   await page.locator("#repair-run-local").click();
   await page.locator("#repair-run-status").getByText("Repair draft executed with local Julia",{exact:false}).waitFor({timeout:160000});
   assert.match(await page.locator("#repair-run-output").innerText(),/2\.0/);
   assert.match(await page.locator("#repair-run-output").innerText(),/1\.666/);
   assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1")),initialProgress);
   // Running a slow repair, then editing must never publish stale results.
   await page.locator("#repair-editor").fill('sleep(1.5)\nprintln("stale output must be suppressed")');
   await page.locator("#repair-run-local").click();
   await page.locator("#repair-editor").fill('println("latest")');
   await page.waitForTimeout(1900);
   assert.equal(await page.locator("#repair-run-output").innerText(),"");
   assert.equal(await page.locator("#repair-run-status").innerText(),"");
   assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,device.name+" horizontal overflow");
   assert.deepEqual(errors,[]);
   await page.close();
   console.log("AMP REPAIR JULIA BROWSER PASS",device.name,"actual BoundsError/corrected values, saved source, stale fencing");
 }
}finally{
 await browser.close();await runner.close();await new Promise(done=>site.close(done));
}
