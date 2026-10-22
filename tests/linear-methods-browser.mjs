import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {chromium} from "playwright";
import {r2Locator,r2Role} from "./r2-legacy-navigation.mjs";
const root=resolve("."),mime={".html":"text/html",".css":"text/css",".js":"text/javascript"};
const server=createServer(async(req,res)=>{
 const pathname=new URL(req.url,"http://127.0.0.1").pathname;
 const path=resolve(root,"."+(pathname==="/"?"/index.html":pathname));
 if(!path.startsWith(root+sep)){res.writeHead(403);res.end();return;}
 try{res.writeHead(200,{"Content-Type":mime[extname(path)]||"application/octet-stream"});res.end(await readFile(path));}
 catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
 for(const spec of [
   {name:"desktop",viewport:{width:1390,height:900}},
   {name:"mobile",viewport:{width:390,height:844},isMobile:true,hasTouch:true}
 ]){
   const page=await browser.newPage({...spec,acceptDownloads:true}),errors=[];
   page.on("pageerror",error=>errors.push(error.message));
   await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js",route=>route.fulfill({status:200,contentType:"text/javascript",body:"window.__mockJDoodle=true;"}));
   await page.goto(origin+"/#lesson/15");
   await r2Role(page,"heading",{name:"Explore linear least squares"}).waitFor();
   assert.equal(await r2Locator(page,"#linear-methods").isVisible(),true);
   assert.equal(await r2Locator(page,"#linear-method-results tr").count(),2);
   await r2Locator(page,"#linear-method-case").selectOption("repeated");
   assert.match(await r2Locator(page,"#linear-method-rank").innerText(),/Rank-deficient/);
   await r2Locator(page,"#linear-method-case").selectOption("close");
   assert.match(await r2Locator(page,"#linear-method-caution").innerText(),/square the condition/);
   assert.equal(await r2Locator(page,"#linear-method-results tr").count(),2);
   const before=await r2Locator(page,"#scratch-code").inputValue();
   await r2Locator(page,"#scratch-code").fill("using LinearAlgebra\nfit_qr(t,y) = (A=hcat(ones(length(t)),t); c=qr(A)\\y; (coefficients=c,residual=norm(A*c-y),orthogonality=norm(A'*(A*c-y))))");
   await r2Locator(page,"#completion-track-choice").selectOption("qr_fit");
   const [download]=await Promise.all([page.waitForEvent("download"),r2Locator(page,"#completion-test-download").click()]);
   assert.equal(download.suggestedFilename(),"amp-depth-qr_fit-tests.jl");
   assert.match(await readFile(await download.path(),"utf8"),/fit_qr\(t,y\)/);
   await page.goto(origin+"/#lesson/12");
   await r2Role(page,"heading",{name:"Solve linear systems"}).waitFor();
   assert.equal(await r2Locator(page,"#linear-methods").isVisible(),false);
   assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,spec.name+" horizontal overflow");
   await page.goto(origin+"/#lesson/15");
   assert.notEqual(before,await r2Locator(page,"#scratch-code").inputValue());
   assert.match(await r2Locator(page,"#scratch-code").inputValue(),/fit_qr/);
   assert.deepEqual(errors,[]);
   await page.close();
   console.log("LINEAR CHROMIUM PASS",spec.name,"comparison, rank, canonical source and retained draft");
 }
}finally{await browser.close();await new Promise(done=>server.close(done));}
