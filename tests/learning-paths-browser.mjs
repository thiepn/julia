import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {chromium} from "playwright";
import {FUNDAMENTALS} from "../src/fundamentals.js";
import {ALGORITHM_UNITS} from "../src/algorithmic-learning.js";

const root=resolve(".");
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",
 ".js":"text/javascript; charset=utf-8",".json":"application/json"};
const server=createServer(async(req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
 const file=resolve(root,"."+(pathname==="/"?"/index.html":pathname));
 if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
 try{const bytes=await readFile(file);
  res.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream"});res.end(bytes);}
 catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const origin="http://127.0.0.1:"+server.address().port;
const variables=FUNDAMENTALS.find(x=>x.id==="variables");
const invariants=ALGORITHM_UNITS.find(x=>x.id==="invariants");
const wrongVar=String((variables.checks[0].answer+1)%4);
const wrongInv=String((invariants.checks[1].correct+1)%4);
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:844}});
  const errors=[],thirdParty=[];
  page.on("pageerror",err=>errors.push(err.message));
  page.on("request",req=>{if(req.url().includes("jdoodle.com"))thirdParty.push(req.url());});
  await page.goto(origin+"/#lesson/01");
  await page.locator("#r2-stage-learn").waitFor({state:"visible"});
  await page.evaluate(({wrongVar,wrongInv})=>{
   localStorage.setItem("amp-julia-lab:v1",'{"01:0":2}');
   localStorage.setItem("amp-julia-lab:draft:v1:01","personal draft");
   localStorage.setItem("amp-julia-learn:quiz-v1",'{"01-predict":"1"}');
   localStorage.setItem("amp-julia-learn:fundamentals-v1",JSON.stringify({"variables-1":wrongVar}));
   localStorage.setItem("amp-julia-learn:algorithms-v1",JSON.stringify({"invariants-2":wrongInv}));
  },{wrongVar,wrongInv});
  await page.reload();
  await page.locator("#r2-learning-paths").waitFor({state:"visible"});
  assert.equal(await page.locator("#r2-paths-paths .r2-paths-sequence").count(),2);
  assert.equal(await page.locator("#r2-paths-paths .r2-paths-unit").count(),14);
  assert.match(await page.locator("#r2-paths-summary").innerText(),/2 of 28 saved answers/);
  assert.match(await page.locator("#r2-paths-summary").innerText(),/2 topics with incorrect answers/);
  assert.equal(await page.locator(".r2-paths-unit[data-evidence=review]").count(),2);
  assert.equal(await page.locator("#r2-paths-suggested button").first().getAttribute("data-skill"),"variables");
  const prerequisites=await page.locator(".r2-paths-unit[data-skill='vector-scans'] .r2-paths-prereqs").innerText();
  assert.match(prerequisites,/Loop invariants/);
  await page.locator("#r2-paths-suggested button[data-skill=variables]").click();
  assert.equal(await page.locator("#r2-fundamentals-topic").inputValue(),"variables");
  await page.locator("#r2-fundamentals .r2-fundamentals-question").first()
   .locator(".r2-fundamentals-option").nth(variables.checks[0].answer).click();
  assert.match(await page.locator("#r2-paths-summary").innerText(),/1 topics with incorrect answers/);
  await page.locator("#r2-paths-suggested button[data-skill=invariants]").click();
  assert.equal(await page.locator("#r2-algorithms-topic").inputValue(),"invariants");
  await page.locator("#r2-algorithms .r2-fundamentals-question").nth(1)
   .locator(".r2-fundamentals-option").nth(invariants.checks[1].correct).click();
  assert.match(await page.locator("#r2-paths-summary").innerText(),/0 topics with incorrect answers/);
  assert.match(await page.locator(".r2-paths-unit[data-skill=variables] .r2-paths-state").innerText(),/1\/2 correct recorded/);
  const stored=await page.evaluate(()=>[
   localStorage.getItem("amp-julia-lab:v1"),
   localStorage.getItem("amp-julia-lab:draft:v1:01"),
   localStorage.getItem("amp-julia-learn:quiz-v1"),
   Object.keys(localStorage).filter(k=>k.includes("paths"))
  ]);
  assert.deepEqual(stored,['{"01:0":2}',"personal draft",'{"01-predict":"1"}',[]]);
  await page.reload();await page.locator("#r2-learning-paths").waitFor({state:"visible"});
  assert.match(await page.locator("#r2-paths-summary").innerText(),/0 topics with incorrect answers/);
  await page.locator("#r2-lesson-next").click();
  await page.waitForFunction(()=>document.querySelector("#lesson-jump")?.value==="02");
  assert.equal(await page.locator("#r2-learning-paths").isVisible(),true);
  await page.locator("[data-r2-stage=check]").click();
  assert.equal(await page.locator("#r2-learning-paths").isVisible(),false);
  await page.locator("[data-r2-stage=learn]").click();
  assert.equal(await page.locator("#r2-learning-paths").isVisible(),true);
  assert.equal(thirdParty.length,0,"No remote browser interpreter calls");
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,"Horizontal overflow");
  assert.deepEqual(errors,[],"No browser exceptions");
  console.log("L6 PATH CHROMIUM PASS",width,"14 skills, evidence-based priorities, live correction, legacy storage and no interpreter");
  await page.close();
 }
}finally{await browser.close();await new Promise(done=>server.close(done));}
