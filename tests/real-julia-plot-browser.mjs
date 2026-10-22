// Use real on-disk PNG/SVG files produced by Plots.jl on the same CI job.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, join, extname, sep } from "node:path";
import { chromium } from "playwright";
const root = resolve(".");
const artifactDir = join(root, "tests", "generated-julia-figures");
const files = {
  "04": { path:"julia-curves.png", name:"julia-curves.png", mimeType:"image/png" },
  "05": { path:"julia-ellipse.svg", name:"julia-ellipse.svg", mimeType:"image/svg+xml" },
  "06": { path:"julia-shear.png", name:"julia-shear.png", mimeType:"image/png" }
};
const mime = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8" };
const server = createServer(async(req,res)=>{
  const pathname = decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
  const file = resolve(root, "." + (pathname==="/" ? "/index.html" : pathname));
  if (!(file===root||file.startsWith(root+sep))) {res.writeHead(403);res.end();return;}
  try {
    const bytes=await readFile(file);
    res.writeHead(200,{"content-type":mime[extname(file)]||"application/octet-stream","cache-control":"no-store"});
    res.end(bytes);
  } catch {res.writeHead(404);res.end("Not found");}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const port=server.address().port;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
let passes=0;
try {
  for(const device of [
    {name:"desktop",viewport:{width:1390,height:900},isMobile:false},
    {name:"mobile",viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}
  ]){
    const page=await browser.newPage({viewport:device.viewport,isMobile:device.isMobile,hasTouch:!!device.hasTouch,deviceScaleFactor:device.deviceScaleFactor||1});
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js",route=>route.fulfill({status:200,contentType:"text/javascript",body:"window.__fixture=true;"}));
    for (const [lesson,asset] of Object.entries(files)) {
      await page.goto("http://127.0.0.1:"+port+"/#lesson/"+lesson);
      await page.locator('[data-r2-stage="code"]').click();
      await page.locator(".r2-compiler-extras > summary").click();
      const priorDraft=await page.locator("#scratch-code").inputValue();
      const priorProgress=await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1"));
      assert.equal(await page.locator("#local-plot-preview").isVisible(),true);
      const buffer=await readFile(join(artifactDir,asset.path));
      await page.locator("#plot-file").setInputFiles({name:asset.name,mimeType:asset.mimeType,buffer});
      await page.waitForFunction(()=>{const i=document.querySelector("#plot-image");return !!i && !i.hidden && i.naturalWidth>=100 && i.naturalHeight>=100;});
      assert.match(await page.locator("#plot-status").innerText(),/local preview only/);
      assert.equal(await page.locator("#scratch-code").inputValue(),priorDraft);
      assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1")),priorProgress);
      const imageDims=await page.locator("#plot-image").evaluate(img=>({width:img.naturalWidth,height:img.naturalHeight,src:img.getAttribute("src")}));
      assert.ok(imageDims.src.startsWith("blob:"));
      assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,"horizontal overflow: "+device.name+" lesson "+lesson);
      await page.locator("#plot-clear").click();
      assert.equal(await page.locator("#plot-image").isVisible(),false);
      assert.match(await page.locator("#plot-status").innerText(),/No local figure selected/);
      assert.deepEqual(errors,[]);
      passes++;
      console.log("REAL JULIA BROWSER PASS",device.name,lesson,asset.name,imageDims.width+"x"+imageDims.height);
    }
    await page.close();
  }
}finally{
  await browser.close();
  await new Promise(done=>server.close(done));
}
assert.equal(passes,6);
console.log("REAL JULIA BROWSER PASS",passes,"genuine image imports; no Julia browser execution/grading");
