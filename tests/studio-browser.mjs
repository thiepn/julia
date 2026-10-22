import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";
const root=resolve("."),mimes={".html":"text/html;charset=utf-8",".css":"text/css;charset=utf-8",".js":"text/javascript;charset=utf-8",".json":"application/json"};
const server=createServer(async(req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
  const file=resolve(root,"."+(pathname==="/"?"/index.html":pathname));
  if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
  try{const b=await readFile(file);res.writeHead(200,{"Content-Type":mimes[extname(file)]??"application/octet-stream"});res.end(b);}
  catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
  for(const viewport of [
    {name:"desktop",width:1440,height:900},
    {name:"tablet",width:920,height:900},
    {name:"mobile",width:390,height:844},
    {name:"small-mobile",width:320,height:700}
  ]){
    const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height}}),errors=[];
    page.on("pageerror",err=>errors.push(err.message));
    await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js",route=>
      route.fulfill({status:200,contentType:"text/javascript",body:"window.__mock=true;"}));
    await page.goto(origin+"/#lesson/01");
    await page.getByRole("heading",{name:"Variables & numbers"}).waitFor();
    assert.equal(await page.locator(".lesson-link").count(),16);
    assert.equal(await page.locator("#lesson-jump option").count(),16);
    assert.equal(await page.locator("#lesson-jump").inputValue(),"01");
    assert.equal(await page.locator("#r2-stage-learn").isVisible(),true);
    assert.equal(await page.locator("#r2-stage-code").isVisible(),false);
    assert.equal(await page.locator(".r2-mobile-action").isVisible(),viewport.width<=767);
    const title=page.locator("#lesson-title");
    const version=await page.locator("head link[href='./styles.css']").count();
    assert.equal(version,1);
    await page.locator("#lesson-jump").selectOption("09");
    await page.getByRole("heading",{name:"Floating-point numbers"}).waitFor();
    assert.equal(await page.locator("#lesson-jump").inputValue(),"09");
    await page.locator('[data-r2-stage="explore"]').click();
    assert.equal(await page.locator("#r2-stage-explore").isVisible(),true);
    assert.ok(await page.locator("#r2-lab-choice option").count()>0);
    const before=await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1"));
    await page.locator('[data-r2-stage="code"]').click();
    assert.equal(await page.locator("#coding-title").isVisible(),true);
    await page.locator("#scratch-code").fill('println("studio draft")');
    assert.equal(await page.locator("#compiler-panel").isVisible(),true);
    assert.equal(await page.locator("#scratch-code").inputValue(),'println("studio draft")');
    assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1")),before);
    if(viewport.width<=767){
      assert.equal(await page.locator("#nav-items").isVisible(),false);
      await page.locator("#r2-course-open").click();
      assert.equal(await page.locator("#nav-items").isVisible(),true);
      await page.locator('.lesson-link[href="#lesson/09"]').click();
      await page.locator('[data-r2-stage="code"]').click();
      assert.equal(await page.locator("#scratch-code").inputValue(),'println("studio draft")');
    }
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(overflow<=2,viewport.name+" overflow "+overflow);
    assert.deepEqual(errors,[]);
    await page.close();
    console.log("STUDIO BROWSER PASS",viewport.name,"canonical course, jump controls, lab shortcuts, editor continuity, responsive viewport");
  }
}finally{await browser.close();await new Promise(done=>server.close(done));}
