import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,mkdir} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";

const root=resolve("."),mimes={".html":"text/html;charset=utf-8",".css":"text/css;charset=utf-8",
  ".js":"text/javascript;charset=utf-8",".json":"application/json"};
const server=createServer(async(req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
  const file=resolve(root,"."+(pathname==="/"?"/index.html":pathname));
  if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
  try{res.writeHead(200,{"Content-Type":mimes[extname(file)]||"application/octet-stream"});res.end(await readFile(file));}
  catch{res.writeHead(404);res.end();}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const origin="http://127.0.0.1:"+server.address().port;
const modules={
  paths:"#r2-learning-paths",
  fundamentals:"#r2-fundamentals",
  algorithms:"#r2-algorithms",
  assessments:"#r2-assessments",
  transfer:"#r2-transfer",
  variants:"#r2-variants"
};
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
  for(const theme of ["light","dark"]){
    for(const width of [320,390,768,1280]){
      const mobile=width<=430,page=await browser.newPage({viewport:{width,height:844},colorScheme:theme}),errors=[];
      page.on("pageerror",err=>errors.push(err.message));
      page.on("request",request=>{
        if(request.url().includes("jdoodle.com"))errors.push("unexpected JDoodle loading");
      });
      try{
        await page.goto(origin+"/#lesson/09");
        await page.locator("#r2-stage-learn").waitFor({state:"visible"});
        assert.equal(await page.locator("#lesson-jump").inputValue(),"09");
        assert.equal(await page.locator("#r2-stage-code").isVisible(),false);
        assert.match(await page.locator(".r2-learn-reading .r2-lesson-step").innerText(),/Understand/);
        assert.match(await page.locator(".r2-example-pane .r2-lesson-step").innerText(),/See it in Julia/);
        assert.equal(await page.locator("#r2-further-study details[data-study-module]").count(),6);
        for(const [id,selector] of Object.entries(modules)){
          const parent=page.locator('details[data-study-module="'+id+'"]');
          assert.equal(await parent.evaluate(el=>el.open),false,id+" starts closed");
          assert.equal(await page.locator(selector).count(),1,id+" authoritative module preserved");
          assert.equal(await page.locator(selector).isVisible(),false,id+" initially folded");
        }
        assert.match(await page.locator('[data-study-module="fundamentals"] .r2-study-description').innerText(),
          /Suggested for this lesson/);
        const quizButton=page.locator("#r2-stage-learn [data-r2-forward=check]");
        assert.equal(await quizButton.count(),1);
        assert.ok(await quizButton.evaluate(el=>Boolean(el.compareDocumentPosition(document.querySelector("#r2-further-study"))&Node.DOCUMENT_POSITION_FOLLOWING)),
          "Quiz CTA precedes advanced content");
        const height=await page.evaluate(()=>document.documentElement.scrollHeight);
        assert.ok(height<(mobile?8000:6500),"Default reading must be short, got "+height+" at "+width);
        if(process.env.PHASE02_SCREENSHOTS==="1"&&[390,768,1280].includes(width)){
          const folder=resolve("phase02-screenshots",theme);
          await mkdir(folder,{recursive:true});
          await page.screenshot({path:resolve(folder,width+"-lesson09-default.jpg"),type:"jpeg",quality:75,fullPage:true,animations:"disabled"});
        }
        // Keyboard users can open native details and then reach original materials.
        const summary=page.locator('[data-study-module="fundamentals"] > summary');
        await summary.focus();await summary.press("Enter");
        assert.equal(await page.locator('[data-study-module="fundamentals"]').evaluate(el=>el.open),true);
        assert.equal(await page.locator("#r2-fundamentals").isVisible(),true);
        const selectedTopic=await page.locator("#r2-fundamentals-topic").inputValue();
        assert.ok(selectedTopic.length>0);
        await summary.press("Enter");
        assert.equal(await page.locator('[data-study-module="fundamentals"]').evaluate(el=>el.open),false);
        // Every original L4-L9 source is still reachable on demand, without a copy.
        for(const [id,selector] of Object.entries(modules)){
          await page.locator('details[data-study-module="'+id+'"] > summary').click();
          assert.equal(await page.locator(selector).isVisible(),true,id+" expands");
          assert.ok((await page.locator(selector).textContent()).length>60,id+" original content retained");
          await page.locator('details[data-study-module="'+id+'"] > summary').click();
        }
        await quizButton.click();
        await page.locator("#r2-stage-check").waitFor({state:"visible"});
        assert.equal(await page.locator("#r2-stage-learn").isVisible(),false);
        await page.locator('[data-r2-stage="explore"]').click();
        await page.locator("#r2-stage-explore").waitFor({state:"visible"});
        await page.locator("#r2-apply-editor").click();
        await page.locator("#r2-stage-code").waitFor({state:"visible"});
        assert.equal(await page.locator("#scratch-code").count(),1,"One canonical Julia editor");
        await page.locator("#scratch-code").fill('println("phase02 persisted")');
        const savedDraft=await page.evaluate(()=>localStorage.getItem("amp-julia-lab:draft:v1:09"));
        assert.equal(savedDraft,'println("phase02 persisted")');
        await page.locator('[data-r2-stage="learn"]').click();
        await page.locator("#r2-stage-learn").waitFor({state:"visible"});
        // The in-page jump must not become an invalid lesson hash.
        const sourceHash=new URL(page.url()).hash;
        await page.locator(".r2-further-shortcut").click();
        assert.equal(new URL(page.url()).hash,sourceHash);
        assert.equal(await page.evaluate(()=>document.activeElement?.id),"r2-further-study-title");
        await page.locator('[data-study-module="paths"] > summary').click();
        const suggested=page.locator("#r2-paths-suggested button[data-kind]").first();
        const kind=await suggested.getAttribute("data-kind");
        const id=kind==="fundamentals"?"fundamentals":"algorithms";
        const targetSelector=id==="fundamentals"?"#r2-fundamentals-topic":"#r2-algorithms-topic";
        const chosen=await suggested.getAttribute("data-skill");
        await suggested.click();
        assert.equal(await page.locator('[data-study-module="'+id+'"]').evaluate(el=>el.open),true,
          "A revision action reveals its original target");
        assert.equal(await page.locator(targetSelector).inputValue(),chosen);
        await page.locator("#r2-lesson-next").click();
        await page.waitForFunction(()=>document.querySelector("#lesson-jump")?.value==="10");
        for(const id of Object.keys(modules)){
          assert.equal(await page.locator('[data-study-module="'+id+'"]').evaluate(el=>el.open),false,
            id+" resets on lesson change");
        }
        await page.reload();
        await page.locator("#r2-stage-learn").waitFor({state:"visible"});
        assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:draft:v1:09")),savedDraft);
        assert.equal(await page.locator("#r2-further-study details").count(),6);
        const excess=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
        assert.ok(excess<=2,theme+" "+width+" overflow "+excess);
        assert.deepEqual(errors,[]);
        console.log("PHASE02 CHROMIUM PASS",theme,width,
          "concise reading, lesson mapping, native keyboard, six sources, quiz/apply/editor, revision focus, continuity");
      }finally{await page.close();}
    }
  }
}finally{await browser.close();await new Promise(ok=>server.close(ok));}
