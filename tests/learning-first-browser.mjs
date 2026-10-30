import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";

const root=resolve(".");
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",
  ".js":"text/javascript; charset=utf-8",".json":"application/json"};
const server=createServer(async(req,res)=>{
  const path=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
  const file=resolve(root,"."+(path==="/"?"/index.html":path));
  if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
  try{const content=await readFile(file);res.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream"});res.end(content);}
  catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const origin="http://127.0.0.1:"+server.address().port;
try{
  for(const width of [390,1280]){
    const page=await browser.newPage({viewport:{width,height:850}});
    const errors=[],thirdParty=[];
    page.on("pageerror",error=>errors.push(error.message));
    page.on("request",req=>{if(req.url().includes("jdoodle.com"))thirdParty.push(req.url());});
    await page.goto(origin+"/#course");
    await page.locator("#r2-course").waitFor({state:"visible"});
    assert.equal(await page.locator(".lesson-link").count(),16);
    assert.deepEqual(await page.locator(".r2-global-nav button").allInnerTexts(),
      ["Course","Practice","Reference"]);
    assert.deepEqual(await page.locator(".r2-stage-tabs button[data-r2-stage]").allInnerTexts(),
      ["01 Learn","02 Quiz","03 Practice"]);
    assert.equal(await page.locator("#r2-stage-code").isVisible(),false);
    assert.equal(thirdParty.length,0,"No third-party compiler during normal learning");
    await page.locator("#r2-next-code").click();
    await page.locator("#r2-stage-learn").waitFor({state:"visible"});
    assert.match(await page.locator("#example-code").innerText(),/println/);
    // L2 read-only examples: switching code changes the authored output only.
    for(const id of ["01","02","03"]){
      assert.equal(await page.locator("#lesson-jump").inputValue(),id);
      assert.equal(await page.locator(".r2-worked-nav button").count(),6);
      assert.equal(await page.locator(".r2-worked-steps li").count(),3);
      assert.equal(await page.locator(".r2-worked-output").isVisible(),true);
      await page.locator(".r2-worked-output > summary").click();
      assert.ok((await page.locator("#r2-worked-stdout").innerText()).length>0);
      await page.locator(".r2-worked-nav button").nth(1).click();
      assert.equal(await page.locator(".r2-worked-nav button[aria-pressed=true]").count(),1);
      assert.equal(await page.locator(".r2-worked-output").evaluate(el=>el.open),false);
      assert.ok((await page.locator("#r2-worked-why").innerText()).length>=90);
      assert.ok((await page.locator("#r2-worked-pitfall").innerText()).length>=60);
      assert.ok((await page.locator("#example-code").innerText()).length>10);
      if(id!=="03"){
        await page.locator("#r2-lesson-next").click();
        const next=String(Number(id)+1).padStart(2,"0");
        await page.waitForFunction(next=>document.querySelector("#lesson-jump")?.value===next,next);
      }
    }
    await page.locator("#r2-course-open").click();
    await page.locator('.lesson-link[href="#lesson/01"]').click();
    await page.waitForFunction(()=>document.querySelector("#lesson-jump")?.value==="01");
    assert.equal(await page.locator(".r2-worked-nav button[aria-pressed=true]").count(),1);
    assert.equal(await page.locator("#r2-worked-stdout").textContent(),"8");
    await page.locator("[data-r2-stage=check]").click();
    await page.locator("#r2-stage-check").waitFor({state:"visible"});
    await page.locator('#questions button[data-question="0"][data-choice="2"]').click();
    const stored=await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1"));
    assert.equal(JSON.parse(stored)["01:0"],2);
    await page.locator("[data-r2-stage=explore]").click();
    await page.locator("#r2-stage-explore").waitFor({state:"visible"});
    assert.match(await page.locator("#r2-study-task-prompt").innerText(),/perimeter and area/);
    assert.match(await page.locator("#r2-study-starter").innerText(),/side = 7/);
    assert.equal(await page.locator("#r2-study-hint-list li").count(),3);
    await page.locator("#r2-study-task-choice").selectOption("a");
    assert.match(await page.locator("#r2-study-task-prompt").innerText(),/circumference and area/);
    assert.match(await page.locator("#r2-study-starter").innerText(),/r = 3/);
    await page.evaluate(()=>localStorage.setItem("amp-julia-lab:draft:v1:01","original learner draft"));
    await page.locator("#r2-utilities-open").click();
    await page.locator("#r2-utilities").waitFor({state:"visible"});
    assert.equal(await page.locator(".r2-reference-index a").count(),16);
    assert.equal(await page.locator("#r2-legacy-open").isVisible(),false);
    assert.equal(thirdParty.length,0);
    await page.reload();
    assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:draft:v1:01")),"original learner draft");
    assert.equal(JSON.parse(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1")))["01:0"],2);
    assert.equal(thirdParty.length,0);
    assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,"No horizontal overflow");
    assert.deepEqual(errors,[],"No browser errors");
    console.log("LEARNING-FIRST L1 PASS",width,"course, quiz, three task variants, reference, storage, no embed");
    await page.close();
  }
}finally{await browser.close();await new Promise(done=>server.close(done));}
