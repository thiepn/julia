import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";
const root=resolve("."),mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8"};
const server=createServer(async(req,res)=>{
 const path=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
 const file=resolve(root,"."+(path==="/" ? "/index.html" : path));
 if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
 try{const content=await readFile(file);res.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream"});res.end(content);}
 catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
let total=0;
try{
 for(const spec of [
   {name:"desktop",settings:{viewport:{width:1390,height:900}}},
   {name:"mobile",settings:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}}
 ]){
   const page=await browser.newPage({...spec.settings,acceptDownloads:true}),errors=[];
   page.on("pageerror",e=>errors.push(e.message));
   await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js",route=>route.fulfill({status:200,contentType:"text/javascript",body:"window.__mockJDoodle=true;"}));
   await page.goto(origin+"/#lesson/02");
   await page.getByRole("heading",{name:"Vectors & indexing"}).waitFor();
   assert.equal(await page.locator("#completion-depth").isVisible(),true);
   assert.equal(await page.locator("#completion-tracks").isVisible(),true);
   assert.equal(await page.locator("#completion-proofs").isVisible(),false);
   assert.match(await page.locator("#completion-track-starter").innerText(),/column_energy/);
   const originalDraft=await page.locator("#scratch-code").inputValue();
   const progress=await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1"));
   await page.locator("#scratch-code").fill("column_energy(A)=vec(sum(abs2.(A);dims=1))");
   const [testScript]=await Promise.all([
     page.waitForEvent("download"),page.locator("#completion-test-download").click()
   ]);
   assert.equal(testScript.suggestedFilename(),"amp-depth-matrix_shapes-tests.jl");
   const source=await readFile(await testScript.path(),"utf8");
   assert.match(source,/column_energy\(A\)=vec\(sum/);
   assert.equal((source.match(/@testset /g)||[]).length,5);
   await page.goto(origin+"/#lesson/09");
   await page.getByRole("heading",{name:"Floating-point numbers"}).waitFor();
   assert.equal(await page.locator("#completion-experiments").isVisible(),true);
   await page.locator("#completion-experiment-choice").selectOption("cancellation");
   const [experiment]=await Promise.all([page.waitForEvent("download"),page.locator("#completion-experiment-download").click()]);
   assert.equal(experiment.suggestedFilename(),"amp-experiment-cancellation.jl");
   assert.match(await readFile(await experiment.path(),"utf8"),/isfinite\(stable\)/);
   await page.goto(origin+"/#lesson/16");
   await page.getByRole("heading",{name:"Conditioning capstone"}).waitFor();
   assert.equal(await page.locator("#completion-proofs").isVisible(),true);
   await page.locator("#completion-proof-choice").selectOption("UE02-derivative");
   assert.match(await page.locator("#completion-proof-warning").innerText(),/finite/);
   assert.match(await page.locator("#completion-proof-source").innerText(),/Übung 2/);
   await page.goto(origin+"/#lesson/05");
   await page.getByRole("heading",{name:"Norms & geometry"}).waitFor();
   assert.equal(await page.locator("#completion-tracks").isVisible(),false);
   assert.equal(await page.locator("#completion-proofs").isVisible(),true);
   await page.goto(origin+"/#lesson/02");
   await page.getByRole("heading",{name:"Vectors & indexing"}).waitFor();
   assert.equal(await page.locator("#scratch-code").inputValue(),"column_energy(A)=vec(sum(abs2.(A);dims=1))");
   assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1")),progress);
   assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,spec.name+" overflow");
   assert.deepEqual(errors,[]);
   total++;console.log("COMPLETION BROWSER PASS",spec.name,"Julia test and experiment downloads; proof warnings; preserved progress");
   await page.close();
 }
}finally{await browser.close();await new Promise(done=>server.close(done));}
assert.equal(total,2);
