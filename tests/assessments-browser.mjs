import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";
import {ASSESSMENTS} from "../src/assessments.js";
const root=resolve(".");
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",
 ".js":"text/javascript; charset=utf-8",".json":"application/json"};
const server=createServer(async(req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
 const file=resolve(root,"."+(pathname==="/"?"/index.html":pathname));
 if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
 try{const bytes=await readFile(file);res.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream"});res.end(bytes);}
 catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const origin="http://127.0.0.1:"+server.address().port;
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:844}});
  const errors=[],external=[];
  page.on("pageerror",err=>errors.push(err.message));
  page.on("request",req=>{if(req.url().includes("jdoodle.com"))external.push(req.url());});
  await page.goto(origin+"/#lesson/01");
  await page.locator("#r2-stage-learn").waitFor({state:"visible"});
  await page.evaluate(()=>{
   localStorage.setItem("amp-julia-lab:v1",'{"01:0":2}');
   localStorage.setItem("amp-julia-lab:draft:v1:01","historical source");
   localStorage.setItem("amp-julia-learn:quiz-v1",'{"01-predict":"1"}');
   localStorage.setItem("amp-julia-learn:fundamentals-v1",'{"types-1":"1"}');
   localStorage.setItem("amp-julia-learn:algorithms-v1",'{"contracts-1":"1"}');
  });
  await page.reload();
  await page.locator("#r2-assessments").waitFor({state:"visible"});
  assert.equal(await page.locator("#r2-assessment-select option").count(),5);
  for(const item of ASSESSMENTS){
   await page.locator("#r2-assessment-select").selectOption(item.id);
   assert.equal(await page.locator("#r2-assessment-heading").innerText(),item.title);
   assert.equal(await page.locator(".r2-assessment-context p").count(),2);
   assert.equal(await page.locator("#r2-assessments .r2-assessment-steps article").count(),3);
   assert.equal(await page.locator("#r2-assessment-remedy article").count(),0);
   for(const [i,q] of item.steps.entries()){
    const card=page.locator("#r2-assessments .r2-assessment-steps article").nth(i);
    assert.equal(await card.locator("pre code").textContent(),q.code);
    assert.equal(await card.locator(".r2-assessment-option").count(),4);
    await card.locator(".r2-assessment-option").nth((q.correct+1)%4).click();
    assert.match(await card.locator(".r2-assessment-answer").innerText(),/Review this step/);
    assert.ok((await card.locator(".r2-assessment-answer").innerText()).includes(q.feedback[(q.correct+1)%4]));
   }
   assert.equal(await page.locator("#r2-assessment-remedy article").count(),2);
   const remedy=page.locator("#r2-assessment-remedy article").first();
   assert.equal(await remedy.locator("pre code").textContent(),item.remediation[0].code);
   await remedy.locator(".r2-assessment-option").nth(item.remediation[0].correct).click();
   assert.match(await remedy.locator(".r2-assessment-answer").innerText(),/Correct/);
   assert.match(await page.locator("#r2-assessment-progress").innerText(),/3 of 3 case steps answered/);
   // Correct all primary steps. Remediation hides after the latest saved evidence is correct.
   for(const [i,q] of item.steps.entries()){
    await page.locator("#r2-assessments .r2-assessment-steps article").nth(i)
     .locator(".r2-assessment-option").nth(q.correct).click();
   }
   assert.equal(await page.locator("#r2-assessment-remedy article").count(),0);
   const saved=JSON.parse(await page.evaluate(()=>localStorage.getItem("amp-julia-learn:assessments-v1")));
   assert.equal(saved[item.steps[0].id],String(item.steps[0].correct));
   assert.equal(saved[item.remediation[0].id],String(item.remediation[0].correct));
  }
  assert.match(await page.locator("#r2-assessment-progress").innerText(),/15 of 15 answered across cases/);
  await page.reload();await page.locator("#r2-assessments").waitFor({state:"visible"});
  await page.locator("#r2-assessment-select").selectOption("elimination");
  assert.match(await page.locator("#r2-assessment-progress").innerText(),/3 of 3 case steps answered/);
  assert.deepEqual(await page.evaluate(()=>[
   localStorage.getItem("amp-julia-lab:v1"),
   localStorage.getItem("amp-julia-lab:draft:v1:01"),
   localStorage.getItem("amp-julia-learn:quiz-v1"),
   localStorage.getItem("amp-julia-learn:fundamentals-v1"),
   localStorage.getItem("amp-julia-learn:algorithms-v1")
  ]),['{"01:0":2}',"historical source",'{"01-predict":"1"}','{"types-1":"1"}','{"contracts-1":"1"}']);
  await page.locator("[data-r2-stage=check]").click();
  assert.equal(await page.locator("#r2-assessments").isVisible(),false);
  await page.locator("[data-r2-stage=learn]").click();
  assert.equal(await page.locator("#r2-assessments").isVisible(),true);
  assert.equal(external.length,0,"No browser Julia/JDoodle execution");
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,"Horizontal viewport overflow");
  assert.deepEqual(errors,[]);
  console.log("L7 CHROMIUM PASS",width,"5 cases, 15 stages, 10 original remediations, persistence and zero interpreter requests");
  await page.close();
 }
}finally{await browser.close();await new Promise(done=>server.close(done));}
