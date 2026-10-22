import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";

const root=resolve("."),mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",
  ".js":"text/javascript; charset=utf-8",".json":"application/json"};
const server=createServer(async(req,res)=>{
  const path=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
  const file=resolve(root,"."+(path==="/"?"/index.html":path));
  if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
  try{const content=await readFile(file);res.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream"});res.end(content);}
  catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
  for(const spec of [
    {name:"desktop",settings:{viewport:{width:1390,height:900}}},
    {name:"mobile",settings:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}}
  ]){
    const page=await browser.newPage(spec.settings),errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js",route=>
      route.fulfill({status:200,contentType:"text/javascript",body:"window.__stub=true;"}));
    await page.goto(origin+"/#lesson/01");
    await page.getByRole("heading",{name:"Variables & numbers"}).waitFor();
    const before=await page.evaluate(()=>JSON.stringify({...localStorage}));
    assert.equal(await page.locator("#semester-rehearsal").evaluate(el=>el.open),false);
    await page.locator("#semester-rehearsal-open").click();
    assert.equal(await page.locator("#semester-rehearsal").evaluate(el=>el.open),true);
    assert.equal(await page.locator(".rehearsal-item").count(),6);
    for(const area of ["arithmetic","solvers","least-squares"]){
      assert.equal(await page.locator('.rehearsal-item[data-area="'+area+'"]').count(),2);
    }
    const first=page.locator(".rehearsal-item").first();
    const attempt=first.locator(".rehearsal-working");
    await attempt.fill("My independent reasoning stays available when returning.");
    page.once("dialog",dialog=>dialog.dismiss());
    await page.locator("#semester-rehearsal-new").click();
    assert.equal(await attempt.inputValue(),"My independent reasoning stays available when returning.");
    assert.equal(await page.locator(".rehearsal-item").count(),6);
    await attempt.fill("");
    assert.equal(await first.locator(".rehearsal-approach").isVisible(),false);
    await first.getByRole("button",{name:"Show approach"}).click();
    assert.equal(await first.locator(".rehearsal-approach").isVisible(),true);
    assert.ok(await first.locator(".rehearsal-approach li").count()>=3);
    const initial=await page.locator(".rehearsal-item").evaluateAll(nodes=>nodes.map(n=>n.dataset.sourceId).join("|"));
    await page.locator("#semester-rehearsal-new").click();
    const next=await page.locator(".rehearsal-item").evaluateAll(nodes=>nodes.map(n=>n.dataset.sourceId).join("|"));
    assert.notEqual(initial,next);
    const chosen=page.locator('.rehearsal-item[data-area="solvers"][data-kind="coding"]');
    await chosen.getByRole("button",{name:/Open exercise in lesson/}).click();
    await page.getByRole("heading",{name:"Solve linear systems"}).waitFor();
    assert.equal(await page.locator("#completion-track-choice").inputValue(),"pivoted_lr");
    assert.equal(await page.locator("#completion-tracks").isVisible(),true);
    const lessonDraft=page.locator("#scratch-code");
    await lessonDraft.fill('println("unfinished learner solution")');
    page.once("dialog",dialog=>dialog.dismiss());
    await page.locator("#completion-starter-use").click();
    assert.equal(await lessonDraft.inputValue(),'println("unfinished learner solution")');
    assert.match(await page.locator("#completion-track-status").innerText(),/retained/i);
    page.once("dialog",dialog=>dialog.accept());
    await page.locator("#completion-starter-use").click();
    assert.match(await lessonDraft.inputValue(),/function pivoted_lr/);
    assert.match(await page.locator("#completion-track-status").innerText(),/loaded/i);
    const afterStarter=await page.evaluate(()=>localStorage.getItem("amp-julia-lab:draft:v1:12"));
    assert.match(afterStarter,/function pivoted_lr/);
    await page.locator("#semester-rehearsal-return").click();
    assert.equal(await page.locator("#semester-rehearsal").evaluate(el=>el.open),true);
    assert.equal(await page.locator(".rehearsal-item").count(),6);
    assert.ok(await page.locator('.rehearsal-item[data-source-id="pivoted_lr"] .rehearsal-work').isFocused());
    assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1")),JSON.parse(before)["amp-julia-lab:v1"]??null);
    assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:draft:v1:01")),JSON.parse(before)["amp-julia-lab:draft:v1:01"]??null);
    assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,spec.name+" horizontal overflow");
    assert.deepEqual(errors,[]);
    console.log("SEMESTER REHEARSAL PASS",spec.name,"six tasks, reveal, refresh, native lesson handoff, no stored grade");
    await page.close();
  }
}finally{await browser.close();await new Promise(done=>server.close(done));}
