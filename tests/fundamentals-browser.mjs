import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {chromium} from "playwright";
import {FUNDAMENTALS} from "../src/fundamentals.js";
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
  const errors=[],thirdParty=[];
  page.on("pageerror",err=>errors.push(err.message));
  page.on("request",req=>{if(req.url().includes("jdoodle.com"))thirdParty.push(req.url());});
  await page.goto(origin+"/#lesson/01");
  await page.locator("#r2-stage-learn").waitFor({state:"visible"});
  await page.evaluate(()=>{
   localStorage.setItem("amp-julia-lab:v1",'{"01:0":2}');
   localStorage.setItem("amp-julia-lab:draft:v1:01","saved learner source");
   localStorage.setItem("amp-julia-learn:quiz-v1",'{"01-predict":"1"}');
  });
  await page.reload();
  await page.locator("#r2-stage-learn").waitFor({state:"visible"});
  assert.equal(await page.locator("#r2-fundamentals-topic option").count(),8);
  for(const chapter of FUNDAMENTALS){
   await page.locator("#r2-fundamentals-topic").selectOption(chapter.id);
   assert.equal(await page.locator("#r2-fundamentals-unit").innerText(),chapter.title);
   assert.equal(await page.locator("#r2-fundamentals .r2-fundamentals-intro p").count(),2);
   assert.equal(await page.locator("#r2-fundamentals .r2-fundamentals-concepts li").count(),3);
   assert.equal(await page.locator("#r2-fundamentals .r2-fundamentals-example-nav button").count(),2);
   assert.equal(await page.locator("#r2-fundamentals .r2-fundamentals-steps li").count(),3);
   assert.equal(await page.locator("#r2-fundamentals-code").innerText(),chapter.examples[0].code);
   await page.locator("#r2-fundamentals .r2-fundamentals-output > summary").click();
   assert.equal(await page.locator("#r2-fundamentals-stdout").textContent(),chapter.examples[0].output);
   await page.locator("#r2-fundamentals .r2-fundamentals-example-nav button").nth(1).click();
   assert.equal(await page.locator("#r2-fundamentals-code").innerText(),chapter.examples[1].code);
   assert.equal(await page.locator("#r2-fundamentals .r2-fundamentals-output").evaluate(el=>el.open),false);
   assert.equal(await page.locator("#r2-fundamentals .r2-fundamentals-question").count(),2);
   // Incorrect answer, then correct answer: source-authored feedback and local persistence.
   const correct=chapter.checks[0].answer;
   const incorrect=(correct+1)%4;
   await page.locator("#r2-fundamentals .r2-fundamentals-question").first().locator(".r2-fundamentals-option").nth(incorrect).click();
   assert.match(await page.locator("#r2-fundamentals .r2-fundamentals-question").first().locator(".r2-fundamentals-feedback").innerText(),/Try again/);
   await page.locator("#r2-fundamentals .r2-fundamentals-question").first().locator(".r2-fundamentals-option").nth(correct).click();
   assert.match(await page.locator("#r2-fundamentals-progress").innerText(),/1 of 2 correct/);
   const data=JSON.parse(await page.evaluate(()=>localStorage.getItem("amp-julia-learn:fundamentals-v1")));
   assert.equal(data[chapter.checks[0].id],String(correct));
  }
  await page.reload();
  await page.locator("#r2-stage-learn").waitFor({state:"visible"});
  await page.locator("#r2-fundamentals-topic").selectOption("strings");
  assert.match(await page.locator("#r2-fundamentals-progress").innerText(),/1 of 2 correct/);
  assert.deepEqual(await page.evaluate(()=>[
   localStorage.getItem("amp-julia-lab:v1"),
   localStorage.getItem("amp-julia-lab:draft:v1:01"),
   localStorage.getItem("amp-julia-learn:quiz-v1")
  ]),['{"01:0":2}',"saved learner source",'{"01-predict":"1"}']);
  await page.locator("#r2-lesson-next").click();
  await page.waitForFunction(()=>document.querySelector("#lesson-jump")?.value==="02");
  assert.equal(await page.locator("#r2-fundamentals-topic").inputValue(),"arrays");
  await page.locator("[data-r2-stage=check]").click();
  assert.equal(await page.locator("#r2-fundamentals").isVisible(),false);
  await page.locator("[data-r2-stage=learn]").click();
  assert.equal(await page.locator("#r2-fundamentals").isVisible(),true);
  assert.equal(thirdParty.length,0,"No embedded browser interpreter");
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,"Horizontal overflow");
  assert.deepEqual(errors,[]);
  console.log("L4 FUNDAMENTALS CHROMIUM PASS",width,"8 units, explanation, source/output, feedback, legacy storage");
  await page.close();
 }
}finally{await browser.close();await new Promise(done=>server.close(done));}
