import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {chromium} from "playwright";
import {VARIANT_CASES} from "../src/variant-assessments.js";
const root=resolve(".");
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
 ".css":"text/css; charset=utf-8",".json":"application/json"};
const server=createServer(async(req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
 const file=resolve(root,"."+(pathname==="/"?"/index.html":pathname));
 if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
 try{const bytes=await readFile(file);res.writeHead(200,{"Content-Type":types[extname(file)]||"application/octet-stream"});res.end(bytes);}
 catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const origin="http://127.0.0.1:"+server.address().port;
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:844},acceptDownloads:true});
  const errors=[],external=[];
  page.on("pageerror",err=>errors.push(err.message));
  page.on("request",req=>{if(req.url().includes("jdoodle.com"))external.push(req.url());});
  await page.goto(origin+"/#lesson/01");
  await page.locator("#r2-stage-learn").waitFor({state:"visible"});
  await page.evaluate(()=>{
   localStorage.setItem("amp-julia-lab:v1",'{"01:0":2}');
   localStorage.setItem("amp-julia-lab:draft:v1:01","PRIVATE DRAFT CANARY");
   localStorage.setItem("amp-julia-learn:quiz-v1",'{"01-predict":"1"}');
   localStorage.setItem("amp-julia-learn:fundamentals-v1",'{"types-1":"1"}');
   localStorage.setItem("amp-julia-learn:algorithms-v1",'{"contracts-1":"1"}');
   localStorage.setItem("amp-julia-learn:assessments-v1",'{"quadrature-step-1":"2"}');
   localStorage.setItem("amp-julia-learn:transfer-v1",'{"nonuniform-step-1":"2"}');
  });
  await page.reload();
  await page.locator("#r2-variants").waitFor({state:"visible"});
  assert.equal(await page.locator("#r2-variants-select option").count(),5);
  for(const c of VARIANT_CASES){
   await page.locator("#r2-variants-select").selectOption(c.id);
   assert.equal(await page.locator("#r2-variants-case-title").innerText(),c.title);
   assert.match(await page.locator("#r2-variants-assumption").innerText(),/Required assumption/);
   assert.equal(await page.locator("#r2-variants-questions .r2-variant-question").count(),3);
   for(const [index,q] of c.questions.entries()){
    const card=page.locator("#r2-variants-questions .r2-variant-question").nth(index);
    assert.equal(await card.locator("pre code").textContent(),q.code);
    assert.equal(await card.locator(".r2-variant-option").count(),4);
    const wrong=(q.correct+1)%4;
    await card.locator(".r2-variant-option").nth(wrong).click();
    assert.match(await card.locator(".r2-variant-feedback").innerText(),/Review/);
    assert.ok((await card.locator(".r2-variant-feedback").innerText()).includes(q.feedback[wrong]));
    await card.locator(".r2-variant-option").nth(q.correct).click();
    assert.match(await card.locator(".r2-variant-feedback").innerText(),/Correct/);
   }
   assert.match(await page.locator("#r2-variants-progress").innerText(),/3 of 3 answers saved/);
  }
  assert.match(await page.locator("#r2-variants-progress").innerText(),/15 of 15 recorded across cases/);
  const [download]=await Promise.all([
   page.waitForEvent("download"),page.locator("#r2-variants-export").click()
  ]);
  assert.equal(download.suggestedFilename(),"julia-learn-review-v1.json");
  const bytes=await readFile(await download.path(),"utf8");
  const data=JSON.parse(bytes);
  assert.equal(data.schema,"amp-julia-learn-review-v1");
  assert.equal(data.sections.length,6);
  assert.equal(data.summary.authored,103);
  assert.equal(data.sections.find(s=>s.id==="l9-variants").recorded,15);
  assert.equal(data.sections.find(s=>s.id==="l9-variants").correct,15);
  assert.equal(data.sections.find(s=>s.id==="l7-assessments").recorded,1);
  assert.equal(data.sections.find(s=>s.id==="l8-transfer").recorded,1);
  assert.equal(bytes.includes("PRIVATE DRAFT CANARY"),false);
  assert.equal(bytes.includes("amp-julia-lab:draft"),false);
  assert.match(await page.locator("#r2-variants-export-status").innerText(),/validated latest answers/);
  await page.reload();await page.locator("#r2-variants").waitFor({state:"visible"});
  await page.locator("#r2-variants-select").selectOption("euler");
  assert.match(await page.locator("#r2-variants-progress").innerText(),/3 of 3 answers saved/);
  assert.deepEqual(await page.evaluate(()=>[
   localStorage.getItem("amp-julia-lab:v1"),
   localStorage.getItem("amp-julia-lab:draft:v1:01"),
   localStorage.getItem("amp-julia-learn:quiz-v1"),
   localStorage.getItem("amp-julia-learn:fundamentals-v1"),
   localStorage.getItem("amp-julia-learn:algorithms-v1"),
   localStorage.getItem("amp-julia-learn:assessments-v1"),
   localStorage.getItem("amp-julia-learn:transfer-v1")
  ]),['{"01:0":2}',"PRIVATE DRAFT CANARY",'{"01-predict":"1"}','{"types-1":"1"}',
      '{"contracts-1":"1"}','{"quadrature-step-1":"2"}','{"nonuniform-step-1":"2"}']);
  await page.locator("[data-r2-stage=check]").click();
  assert.equal(await page.locator("#r2-variants").isVisible(),false);
  await page.locator("[data-r2-stage=learn]").click();
  assert.equal(await page.locator("#r2-variants").isVisible(),true);
  assert.deepEqual(errors,[]);
  assert.equal(external.length,0);
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2);
  console.log("L9 CHROMIUM PASS",width,"15 new questions, genuine review JSON download, L1-L8 preserved");
  await page.close();
 }
}finally{await browser.close();await new Promise(done=>server.close(done));}
