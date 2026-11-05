import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {chromium} from "playwright";
import {TRANSFER_CASES} from "../src/transfer-assessments.js";
const root=resolve(".");
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
 ".css":"text/css; charset=utf-8",".json":"application/json"};
const server=createServer(async(req,res)=>{
 const url=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
 const path=resolve(root,"."+(url==="/"?"/index.html":url));
 if(!(path===root||path.startsWith(root+sep))){res.writeHead(403);res.end();return;}
 try{const bytes=await readFile(path);res.writeHead(200,{"Content-Type":types[extname(path)]||"application/octet-stream"});res.end(bytes);}
 catch{res.writeHead(404);res.end();}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const site="http://127.0.0.1:"+server.address().port;
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:844}});
  const errors=[],external=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("request",r=>{if(r.url().includes("jdoodle.com"))external.push(r.url());});
  await page.goto(site+"/#lesson/01");
  await page.locator("#r2-stage-learn").waitFor({state:"visible"});
  await page.evaluate(()=>{
   localStorage.setItem("amp-julia-lab:v1",'{"01:0":2}');
   localStorage.setItem("amp-julia-lab:draft:v1:01","previous draft");
   localStorage.setItem("amp-julia-learn:quiz-v1",'{"01-predict":"1"}');
   localStorage.setItem("amp-julia-learn:fundamentals-v1",'{"types-1":"1"}');
   localStorage.setItem("amp-julia-learn:algorithms-v1",'{"contracts-1":"1"}');
   localStorage.setItem("amp-julia-learn:assessments-v1",'{"quadrature-step-1":"2"}');
  });
  await page.reload();
  await page.locator("#r2-transfer").waitFor({state:"visible"});
  assert.equal(await page.locator("#r2-transfer-select option").count(),5);
  for(const c of TRANSFER_CASES){
   await page.locator("#r2-transfer-select").selectOption(c.id);
   assert.equal(await page.locator("#r2-transfer-case-title").innerText(),c.title);
   assert.equal(await page.locator("#r2-transfer .r2-transfer-exposition p").count(),2);
   assert.equal(await page.locator("#r2-transfer .r2-transfer-questions .r2-transfer-question").count(),3);
   assert.equal(await page.locator("#r2-transfer-justification .r2-transfer-question").count(),1);
   for(const [i,q] of c.steps.entries()){
    const card=page.locator("#r2-transfer .r2-transfer-questions .r2-transfer-question").nth(i);
    assert.equal(await card.locator("pre code").textContent(),q.code);
    assert.equal(await card.locator(".r2-transfer-option").count(),4);
    const wrong=(q.key+1)%4;
    await card.locator(".r2-transfer-option").nth(wrong).click();
    assert.match(await card.locator(".r2-transfer-feedback").innerText(),/Review the reasoning/);
    assert.ok((await card.locator(".r2-transfer-feedback").innerText()).includes(q.feedback[wrong]));
    await card.locator(".r2-transfer-option").nth(q.key).click();
    assert.match(await card.locator(".r2-transfer-feedback").innerText(),/Correct/);
   }
   const justify=page.locator("#r2-transfer-justification .r2-transfer-question");
   assert.equal(await justify.locator("pre code").textContent(),c.justify.code);
   assert.equal(await justify.locator(".r2-transfer-option").count(),4);
   await justify.locator(".r2-transfer-option").nth((c.justify.key+1)%4).click();
   assert.match(await justify.locator(".r2-transfer-feedback").innerText(),/Review the reasoning/);
   await justify.locator(".r2-transfer-option").nth(c.justify.key).click();
   assert.match(await page.locator("#r2-transfer-status").innerText(),/4 of 4 answered in this case/);
   assert.match(await page.locator("#r2-transfer-status").innerText(),/Justification currently correct/);
   const saved=JSON.parse(await page.evaluate(()=>localStorage.getItem("amp-julia-learn:transfer-v1")));
   assert.equal(saved[c.steps[0].id],String(c.steps[0].key));
   assert.equal(saved[c.justify.id],String(c.justify.key));
  }
  assert.match(await page.locator("#r2-transfer-status").innerText(),/20 of 20 answered across all transfer cases/);
  await page.reload();await page.locator("#r2-transfer").waitFor({state:"visible"});
  await page.locator("#r2-transfer-select").selectOption("regression");
  assert.match(await page.locator("#r2-transfer-status").innerText(),/4 of 4 answered in this case/);
  assert.deepEqual(await page.evaluate(()=>[
   localStorage.getItem("amp-julia-lab:v1"),
   localStorage.getItem("amp-julia-lab:draft:v1:01"),
   localStorage.getItem("amp-julia-learn:quiz-v1"),
   localStorage.getItem("amp-julia-learn:fundamentals-v1"),
   localStorage.getItem("amp-julia-learn:algorithms-v1"),
   localStorage.getItem("amp-julia-learn:assessments-v1")
  ]),['{"01:0":2}',"previous draft",'{"01-predict":"1"}',
   '{"types-1":"1"}','{"contracts-1":"1"}','{"quadrature-step-1":"2"}']);
  await page.locator("[data-r2-stage=check]").click();
  assert.equal(await page.locator("#r2-transfer").isVisible(),false);
  await page.locator("[data-r2-stage=learn]").click();
  assert.equal(await page.locator("#r2-transfer").isVisible(),true);
  assert.equal(external.length,0);
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,"Horizontal overflow");
  assert.deepEqual(errors,[]);
  console.log("L8 CHROMIUM PASS",width,"5 independent cases, 20 answer checks including justifications, old data intact");
  await page.close();
 }
}finally{await browser.close();await new Promise(ok=>server.close(ok));}
