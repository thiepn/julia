
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
  try{const bytes=await readFile(file);res.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream"});res.end(bytes);}
  catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
  for(const scheme of ["light","dark"]){
    for(const width of [320,390,768,1024,1440]){
      const page=await browser.newPage({viewport:{width,height:850},colorScheme:scheme});
      const errors=[];
      page.on("pageerror",error=>errors.push(error.message));
      try{
        await page.goto(origin+"/#course");
        await page.locator("#r2-course").waitFor({state:"visible"});
        assert.deepEqual(await page.locator(".r2-global-nav button").allInnerTexts(),["Course","Exam Prep","Resources"]);
        await page.locator("#r2-course-open").focus();
        await page.keyboard.press("Tab");
        assert.equal(await page.evaluate(()=>document.activeElement?.id),"r2-mixed-open","Keyboard Tab reaches Exam Prep");
        assert.equal(await page.locator("#r2-mixed-open").evaluate(el=>el.matches(":focus-visible")),true,"Keyboard focus is visible");
        const navBounds=await page.evaluate(()=>({
          brand:document.querySelector(".brand").getBoundingClientRect(),
          nav:document.querySelector(".r2-global-nav").getBoundingClientRect(),
          width:innerWidth
        }));
        const separated=(navBounds.nav.left>=navBounds.brand.right-1)||
          (navBounds.nav.top>=navBounds.brand.bottom-1);
        assert.ok(separated,"Brand and navigation must not overlap, whether side-by-side or stacked");
        assert.ok(navBounds.nav.right<=navBounds.width+1,"Navigation must fit viewport");
        assert.deepEqual(await page.locator(".r2-stage-tabs button").allInnerTexts(),["01 Learn","02 Quiz","03 Apply"]);
        assert.equal(await page.locator(".lesson-link").count(),16);
        assert.match(await page.locator(".r2-progress-note").innerText(),/concept checks only/);
        if(width<=900){
          const positions=await page.evaluate(()=>({
            lessons:document.querySelector(".r2-course-path").getBoundingClientRect().y,
            preview:document.querySelector(".r2-next-lesson").getBoundingClientRect().y
          }));
          assert.ok(positions.lessons<=positions.preview,"Course list must precede optional code preview on narrow viewports");
        }
        await page.locator("#r2-hero-continue").click();
        await page.waitForURL(/#lesson\/01$/);
        await page.locator("#r2-stage-learn").waitFor({state:"visible"});
        await page.locator('[data-r2-stage="check"]').click();
        assert.equal(await page.locator("#r2-stage-check").isVisible(),true);
        await page.locator("#questions .question:visible .choice").first().click();
        const savedChecks=await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1"));
        assert.ok(JSON.parse(savedChecks)["01:0"]>=0);
        await page.locator('[data-r2-stage="explore"]').click();
        assert.equal(await page.locator("#r2-stage-explore").isVisible(),true);
        assert.equal(await page.locator("#r2-apply-editor").isVisible(),true);
        assert.equal(await page.locator("#r2-apply-explore").isVisible(),true);
        await page.locator("#r2-apply-editor").click();
        assert.equal(await page.locator("#r2-stage-code").isVisible(),true);
        assert.equal(await page.locator("#scratch-code").count(),1,"One canonical Julia editor");
        await page.locator("#scratch-code").fill('println("phase01 retained")');
        const draft=await page.evaluate(()=>localStorage.getItem("amp-julia-lab:draft:v1:01"));
        assert.equal(draft,'println("phase01 retained")');
        await page.locator("#r2-mixed-open").click();
        assert.equal(await page.locator("#r2-mixed").isVisible(),true);
        assert.equal(await page.getByRole("heading",{name:"Exam Prep"}).isVisible(),true);
        assert.ok(await page.locator("#semester-rehearsal-items .rehearsal-item").count()>0);
        await page.locator("#r2-utilities-open").click();
        assert.equal(await page.locator("#r2-utilities").isVisible(),true);
        assert.equal(await page.getByRole("heading",{name:"Resources"}).isVisible(),true);
        assert.equal(await page.locator(".r2-resource-course-link").getAttribute("href"),"#course");
        assert.equal(await page.locator(".r2-reference-index a").count(),0);
        for(const selector of ["#course-backup","#offline-access","#submission-workflow","#r2-legacy-open"]){
          assert.equal(await page.locator(selector).count(),1,selector+" retained");
        }
        await page.locator(".r2-resource-course-link").click();
        await page.locator("#r2-course").waitFor({state:"visible"});
        await page.goBack();
        await page.locator("#r2-utilities").waitFor({state:"visible"});
        await page.goForward();
        await page.locator("#r2-course").waitFor({state:"visible"});
        await page.reload();
        assert.equal(await page.locator("#r2-course").isVisible(),true);
        assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1")),savedChecks);
        assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:draft:v1:01")),draft);
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
        assert.ok(overflow<=2,"No horizontal overflow at "+width+" "+scheme+": "+overflow);
        assert.deepEqual(errors,[],"No page errors at "+width+" "+scheme);
        console.log("PHASE01 PASS",scheme,width,"A01-A04,A06-A11,data,history,layout");
      }finally{await page.close();}
    }
  }
  for(const hash of ["#lesson/16","#mixed/09","#utilities/09"]){
    const page=await browser.newPage({viewport:{width:390,height:844}});
    try{
      await page.goto(origin+"/"+hash);
      const expected=hash.startsWith("#lesson")?"#lesson-main":hash.startsWith("#mixed")?"#r2-mixed":"#r2-utilities";
      await page.locator(expected).waitFor({state:"visible"});
      assert.equal(await page.locator("#lesson-jump").inputValue(),hash.slice(-2),"Direct link retains lesson context "+hash);
      console.log("PHASE01 DIRECT ROUTE PASS",hash);
    }finally{await page.close();}
  }
}finally{await browser.close();await new Promise(done=>server.close(done));}
