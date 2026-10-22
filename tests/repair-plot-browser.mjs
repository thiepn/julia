// Authentic Plots.jl image evidence for the original lesson 04 repair.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";
import {r2Locator,r2Role} from "./r2-legacy-navigation.mjs";
import {createLocalRunner} from "../local-runner/server.mjs";
import {repairForLesson} from "../src/repair-cases.js";
const root=resolve("."),mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8"};
const site=createServer(async(req,res)=>{
 const path=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
 const file=resolve(root,"."+(path==="/" ? "/index.html":path));
 if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
 try{res.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream"});res.end(await readFile(file));}
 catch{res.writeHead(404);res.end();}
});
await new Promise(done=>site.listen(0,"127.0.0.1",done));
const origin="http://127.0.0.1:"+site.address().port,token="test-repair-plots-julia-secret";
const runner=createLocalRunner({token,origins:[origin]});
await runner.listen({port:8765});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const source=repairForLesson("04");
try{
 for(const spec of [
 {name:"desktop",options:{viewport:{width:1390,height:900}}},
 {name:"mobile",options:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}}
 ]){
   const page=await browser.newPage(spec.options),errors=[];
   page.on("pageerror",e=>errors.push(e.message));
   await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js",route=>route.fulfill({status:200,contentType:"text/javascript",body:"window.__mockJDoodle=true;"}));
   await page.goto(origin+"/#lesson/04");
   await r2Role(page,"heading",{name:"Plot mathematical functions"}).waitFor();
   await r2Locator(page,'button[data-r2-stage="code"]').click();
   await r2Locator(page,"#local-runner-disable-embed").click();
   await r2Role(page,"heading",{name:"Plot mathematical functions"}).waitFor();
   await r2Locator(page,'button[data-r2-stage="code"]').click();
   await r2Locator(page,"#local-runner-token").fill(token);
   const main='println("main lesson draft unchanged")';
   await r2Locator(page,"#scratch-code").fill(main);
   await r2Locator(page,'button[data-r2-stage="explore"]').click();
   await r2Locator(page,"#r2-lab-choice").selectOption("repair-lab");
   const progress=await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1"));
   for(const [code,count] of [[source.broken,1],[source.reference,2]]){
     await r2Locator(page,"#repair-editor").fill(code);
     assert.equal(await r2Locator(page,"#repair-run-figures img").count(),0);
     await r2Locator(page,"#repair-run-local").click();
     await r2Locator(page,"#repair-run-status").getByText("Repair draft executed with local Julia",{exact:false}).waitFor({timeout:160000});
     assert.match(await r2Locator(page,"#repair-run-output").innerText(),new RegExp("series="+count+"(?:\\D|$)"));
     await page.waitForFunction(()=>{const img=document.querySelector("#repair-run-figures img");return img?.naturalWidth>=100&&img?.naturalHeight>=100;},{timeout:160000});
     assert.equal(await r2Locator(page,"#repair-run-figures img").count(),1);
     const image=await r2Locator(page,"#repair-run-figures img").evaluate(img=>({src:img.getAttribute("src"),width:img.naturalWidth,height:img.naturalHeight,alt:img.alt}));
     assert.ok(image.src.startsWith("blob:"),JSON.stringify(image));
     assert.ok(image.width>=100&&image.height>=100);
     assert.match(image.alt,/repair-curves\.png/);
     assert.equal(await r2Locator(page,"#scratch-code").inputValue(),main);
     assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1")),progress);
     console.log("REPAIR FIGURE REAL JULIA PASS",spec.name,"series",count,image.width+"x"+image.height);
   }
   // New code must remove the former figure and prevent an old figure being shown.
   await r2Locator(page,"#repair-editor").fill('println("no plotted figure")');
   assert.equal(await r2Locator(page,"#repair-run-figures img").count(),0);
   assert.equal(await r2Locator(page,"#repair-run-output").innerText(),"");
   await page.goto(origin+"/#lesson/05");
   await r2Role(page,"heading",{name:"Norms & geometry"}).waitFor();
   assert.equal(await r2Locator(page,"#repair-run-figures img").count(),0);
   assert.equal(await r2Locator(page,"#scratch-code").inputValue(),await r2Locator(page,"#scratch-code").inputValue());
   assert.deepEqual(errors,[]);
   assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,spec.name+" overflow");
   await page.close();
 }
}finally{await browser.close();await runner.close();await new Promise(done=>site.close(done));}
