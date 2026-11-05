import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";
const root=resolve(".");
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",
 ".js":"text/javascript; charset=utf-8",".json":"application/json"};
const server=createServer(async(req,res)=>{
 const uri=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
 const file=resolve(root,"."+(uri==="/"?"/index.html":uri));
 if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
 try{const bytes=await readFile(file);res.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream"});res.end(bytes);}
 catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const browserInstance=await chromium.launch({headless:true,args:["--no-sandbox"]});
const origin="http://127.0.0.1:"+server.address().port;
try{
 for(const width of [390,1280]){
  const page=await browserInstance.newPage({viewport:{width,height:850}});
  const errors=[],thirdParty=[];
  page.on("pageerror",err=>errors.push(err.message));
  page.on("request",req=>{if(req.url().includes("jdoodle.com"))thirdParty.push(req.url());});
  await page.goto(origin+"/#lesson/01");
  await page.locator("#lesson-main").waitFor({state:"visible"});
  await page.evaluate(()=>{
    localStorage.setItem("amp-julia-lab:v1",'{"01:0":2}');
    localStorage.setItem("amp-julia-lab:draft:v1:01","original learner draft");
  });
  await page.reload();
  await page.locator("[data-r2-stage=check]").click();
  await page.locator("#r2-extra-quiz").waitFor({state:"visible"});
  assert.equal(await page.locator("#r2-extra-nav button").count(),5);
  assert.match(await page.locator("#r2-extra-type").innerText(),/Predict output/);
  assert.match(await page.locator("#r2-extra-code").innerText(),/x = 3/);
  assert.equal(await page.locator(".r2-extra-choice").count(),4);
  // Wrong, then corrected: answer-specific feedback, never code mastery.
  await page.locator(".r2-extra-choice").nth(0).click();
  assert.match(await page.locator("#r2-extra-feedback").innerText(),/Try again/);
  assert.equal(JSON.parse(await page.evaluate(()=>localStorage.getItem("amp-julia-learn:quiz-v1")))["01-predict"],"0");
  await page.locator(".r2-extra-choice").nth(1).click();
  assert.match(await page.locator("#r2-extra-feedback").innerText(),/Correct/);
  assert.match(await page.locator("#r2-extra-progress").innerText(),/1 of 5 correct/);
  await page.locator("#r2-extra-nav button").nth(1).click();
  assert.match(await page.locator("#r2-extra-type").innerText(),/Order statements/);
  await page.locator("#r2-extra-nav button").nth(2).click();
  assert.match(await page.locator("#r2-extra-type").innerText(),/Find the error/);
  await page.locator("#r2-extra-nav button").nth(3).click();
  assert.match(await page.locator("#r2-extra-type").innerText(),/Complete expression/);
  await page.locator("#r2-extra-nav button").nth(4).click();
  assert.match(await page.locator("#r2-extra-type").innerText(),/Numeric answer/);
  await page.locator("#r2-extra-input").fill("NaN");
  await page.locator(".r2-extra-numeric button").click();
  assert.match(await page.locator("#r2-extra-feedback").innerText(),/finite decimal/);
  assert.equal(JSON.parse(await page.evaluate(()=>localStorage.getItem("amp-julia-learn:quiz-v1")))["01-numeric"],undefined);
  await page.locator("#r2-extra-input").fill("16");
  await page.locator(".r2-extra-numeric button").click();
  assert.equal(JSON.parse(await page.evaluate(()=>localStorage.getItem("amp-julia-learn:quiz-v1")))["01-numeric"],"16");
  assert.match(await page.locator("#r2-extra-progress").innerText(),/2 of 5 correct/);
  await page.reload();
  await page.locator("[data-r2-stage=check]").click();
  await page.locator("#r2-extra-nav button").nth(4).click();
  assert.equal(await page.locator("#r2-extra-input").inputValue(),"16");
  assert.match(await page.locator("#r2-extra-feedback").innerText(),/Correct/);
  assert.deepEqual(await page.evaluate(()=>[localStorage.getItem("amp-julia-lab:v1"),
      localStorage.getItem("amp-julia-lab:draft:v1:01")]),
    ['{"01:0":2}',"original learner draft"]);
  await page.locator("#r2-lesson-next").click();
  await page.waitForFunction(()=>document.querySelector("#lesson-jump")?.value==="02");
  await page.locator("[data-r2-stage=check]").click();
  await page.locator("#r2-extra-nav button").nth(4).click();
  assert.match(await page.locator("#r2-extra-code").innerText(),/push!/);
  await page.locator("#r2-extra-input").fill("11");
  await page.locator(".r2-extra-numeric button").click();
  assert.match(await page.locator("#r2-extra-progress").innerText(),/1 of 5 correct/);
  await page.locator("#r2-lesson-next").click();
  await page.waitForFunction(()=>document.querySelector("#lesson-jump")?.value==="03");
  await page.locator("[data-r2-stage=check]").click();
  await page.locator("#r2-extra-nav button").nth(4).click();
  await page.locator("#r2-extra-input").fill("120");
  await page.locator(".r2-extra-numeric button").click();
  assert.match(await page.locator("#r2-extra-progress").innerText(),/1 of 5 correct/);
  assert.equal(Object.keys(JSON.parse(await page.evaluate(()=>localStorage.getItem("amp-julia-learn:quiz-v1")))).length,4);
  await page.locator("#r2-lesson-next").click();
  await page.waitForFunction(()=>document.querySelector("#lesson-jump")?.value==="04");
  await page.locator("[data-r2-stage=check]").click();
  assert.equal(await page.locator("#r2-extra-quiz").isVisible(),false);
  assert.equal(thirdParty.length,0,"No third-party interpreter requests");
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,"No horizontal overflow");
  assert.deepEqual(errors,[],"No browser errors");
  console.log("L3 QUIZ BROWSER PASS",width,"5 formats, all pilot lessons, retries, reload, existing storage, offline-only");
  await page.close();
 }
}finally{
 await browserInstance.close();
 await new Promise(done=>server.close(done));
}
