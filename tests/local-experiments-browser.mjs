// Real Julia 1.11 reference experiment execution through the original loopback companion.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";
import {r2Locator,r2Role} from "./r2-legacy-navigation.mjs";
const {createLocalRunner}=await import("../local-runner/server.mjs");
const root=resolve("."),mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8"};
const site=createServer(async(req,res)=>{
 const path=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
 const file=resolve(root,"."+(path==="/" ? "/index.html":path));
 if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
 try{res.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream"});res.end(await readFile(file));}
 catch{res.writeHead(404);res.end();}
});
await new Promise(done=>site.listen(0,"127.0.0.1",done));
const origin="http://127.0.0.1:"+site.address().port;
const token="ci-original-experiment-local-key";
const runner=createLocalRunner({token,origins:[origin]});
await runner.listen({port:8765});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const status="Original experiment executed with local Julia";
try{
 for(const device of [
  {name:"desktop",options:{viewport:{width:1390,height:900}}},
  {name:"mobile",options:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}}
 ]){
  const page=await browser.newPage(device.options),errors=[];
  page.on("pageerror",err=>errors.push(err.message));
  await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js",route=>route.fulfill({status:200,contentType:"text/javascript",body:"window.__stubJDoodle=true;"}));
  await page.goto(origin+"/#lesson/09");
  await r2Role(page,"heading",{name:"Floating-point numbers"}).waitFor();
  await r2Locator(page,"#completion-experiment-choice").selectOption("cancellation");
  const source='println("my untouched learner draft")';
  await r2Locator(page,"#scratch-code").fill(source);
  const initialProgress=await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1"));
  await r2Locator(page,"#completion-experiment-local-run").click();
  assert.match(await r2Locator(page,"#completion-experiment-local-status").innerText(),/Disable JDoodle/);
  await r2Locator(page,"#local-runner-disable-embed").click();
  await r2Role(page,"heading",{name:"Floating-point numbers"}).waitFor();
  await r2Locator(page,"#completion-experiment-choice").selectOption("cancellation");
  await r2Locator(page,"#local-runner-token").fill(token);
  await r2Locator(page,"#completion-experiment-local-run").click();
  await r2Locator(page,"#completion-experiment-local-status").getByText(status,{exact:false}).waitFor({timeout:160000});
  const output=await r2Locator(page,"#completion-experiment-local-output").innerText();
  assert.match(output,/relative_gap\s*=\s*/);
  assert.match(output,/stable\s*=\s*/);
  assert.doesNotMatch(output,/my untouched learner draft/);
  assert.equal(await r2Locator(page,"#scratch-code").inputValue(),source);
  assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1")),initialProgress);
  await r2Locator(page,"#completion-experiment-choice").selectOption("spacing");
  assert.equal(await r2Locator(page,"#completion-experiment-local-output").innerText(),"");
  assert.equal(await r2Locator(page,"#completion-experiment-local-status").innerText(),"");
  await page.goto(origin+"/#lesson/14");
  await r2Role(page,"heading",{name:"QR & Cholesky"}).waitFor();
  await r2Locator(page,"#local-runner-token").fill(token);
  await r2Locator(page,"#completion-experiment-choice").selectOption("qr_orthogonality");
  await r2Locator(page,"#completion-experiment-local-run").click();
  await r2Locator(page,"#completion-experiment-local-status").getByText(status,{exact:false}).waitFor({timeout:160000});
  assert.match(await r2Locator(page,"#completion-experiment-local-output").innerText(),/orthogonality\s*=\s*/);
  assert.match(await r2Locator(page,"#completion-experiment-local-output").innerText(),/coefficients\s*=\s*/);
  assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1")),initialProgress);
  await page.goto(origin+"/#lesson/09");
  await r2Role(page,"heading",{name:"Floating-point numbers"}).waitFor();
  assert.equal(await r2Locator(page,"#scratch-code").inputValue(),source);
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,device.name+" overflow");
  assert.deepEqual(errors,[]);
  await page.close();
  console.log("REAL JULIA EXPERIMENT BROWSER PASS",device.name,"cancellation, QR and draft/progress integrity");
 }
}finally{
 await browser.close();await runner.close();await new Promise(done=>site.close(done));
}
