import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";
import {createLocalRunner} from "../local-runner/server.mjs";
const root=resolve(".");
const types={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8"};
const site=createServer(async(req,res)=>{
  const path=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
  const file=resolve(root,"."+(path==="/" ? "/index.html" : path));
  if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
  try{const bytes=await readFile(file);res.writeHead(200,{"Content-Type":types[extname(file)]||"application/octet-stream"});res.end(bytes);}
  catch{res.writeHead(404);res.end();}
});
await new Promise(done=>site.listen(0,"127.0.0.1",done));
const port=site.address().port,origin="http://127.0.0.1:"+port;
const runner=createLocalRunner({token:"test-only-access-code-not-secret",origins:[origin]});
await runner.listen({port:8765});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
let passed=0;
try{
  for(const spec of [{label:"desktop",options:{viewport:{width:1390,height:900}}},{label:"mobile",options:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}}]){
    const page=await browser.newPage(spec.options),errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js",route=>route.fulfill({status:200,contentType:"text/javascript",body:"window.__jdoodleStub=true;"}));
    await page.goto(origin+"/#lesson/04");
    await page.getByRole("heading",{name:"Plot mathematical functions"}).waitFor();
    await page.locator('[data-r2-stage="code"]').click();
    await page.getByRole("button",{name:"Disable JDoodle and reload for local execution"}).click();
    await page.getByRole("heading",{name:"Plot mathematical functions"}).waitFor();
    await page.locator('[data-r2-stage="code"]').click();
    const noEmbed=await page.evaluate(()=>document.querySelector("#embed-slot .jdoodle-embed")===null);
    assert.equal(noEmbed,true);
    await page.locator("#local-runner-token").fill("test-only-access-code-not-secret");
    const source=[
      "using Plots",
      'p = plot(1:4,[1,4,2,3]; label="real Julia", xlabel="x", ylabel="value")',
      'savefig(p, "source.png")',
      'savefig(p, "source.svg")',
      'println("REAL-JULIA-PLOT-EXECUTED")'
    ].join("\n");
    await page.locator("#scratch-code").fill(source);
    const progressBefore=await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1"));
    await page.getByRole("button",{name:"Run current Julia draft"}).click();
    await page.locator("#local-runner-status").getByText("Executed with local Julia. Results are not graded.").waitFor({timeout:160000});
    assert.match(await page.locator("#local-runner-output").innerText(),/REAL-JULIA-PLOT-EXECUTED/);
    assert.equal(await page.locator("#local-runner-images img").count(),2);
    const info=await page.locator("#local-runner-images img").evaluateAll(imgs=>imgs.map(i=>({src:i.getAttribute("src"),width:i.naturalWidth,height:i.naturalHeight})));
    assert.ok(info.every(i=>i.src.startsWith("blob:")&&i.width>=100&&i.height>=100),JSON.stringify(info));
    assert.equal(await page.locator("#scratch-code").inputValue(),source);
    assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1")),progressBefore);
    assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,spec.label+" overflow");
    await page.goto(origin+"/#lesson/05");
    await page.getByRole("heading",{name:"Norms & geometry"}).waitFor();
    assert.equal(await page.locator("#local-runner-images img").count(),0);
    assert.equal(await page.locator("#local-runner-output").innerText(),"");
    assert.deepEqual(errors,[]);
    passed++;
    console.log("LOCAL RUNNER BROWSER PASS",spec.label,"actual PNG and SVG, real stdout, preserved progress");
    await page.close();
  }
}finally{
  await browser.close();
  await runner.close();
  await new Promise(done=>site.close(done));
}
assert.equal(passed,2);
console.log("LOCAL RUNNER BROWSER PASS",passed,"genuine desktop/mobile execution checks");
