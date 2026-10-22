import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";
import {r2Locator,r2Role} from "./r2-legacy-navigation.mjs";
const root=resolve(".");
const types={".js":"text/javascript; charset=utf-8",".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8"};
const server=createServer(async(req,res)=>{
 const path=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
 const file=resolve(root,"."+(path==="/" ? "/index.html" : path));
 if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
 try{const b=await readFile(file);res.writeHead(200,{"Content-Type":types[extname(file)]||"application/octet-stream"});res.end(b);}
 catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
let count=0;
try{
 for(const device of [
  {name:"desktop",options:{viewport:{width:1390,height:900}}},
  {name:"mobile",options:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}}
 ]){
  const page=await browser.newPage({...device.options,acceptDownloads:true}),errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js",r=>
   r.fulfill({status:200,contentType:"text/javascript",body:"window.__mockJDoodle=true;"}));
  await page.goto(origin+"/#lesson/02");
  await r2Role(page,"heading",{name:"Vectors & indexing"}).waitFor();
  await r2Locator(page,"#course-backup").evaluate(el=>el.open=true);
  assert.equal(await r2Locator(page,"#course-backup-export").isDisabled(),true);
  await r2Locator(page,"#course-backup-disable-embed").click();
  await r2Role(page,"heading",{name:"Vectors & indexing"}).waitFor();
  await r2Locator(page,"#course-backup").evaluate(el=>el.open=true);
  assert.equal(await r2Locator(page,"#course-backup-export").isEnabled(),true);
  const code='println("δ, π, α")';
  await r2Locator(page,"#scratch-code").fill(code);
  const [download]=await Promise.all([page.waitForEvent("download"),r2Locator(page,"#course-backup-export").click()]);
  assert.equal(download.suggestedFilename(),"AMP-Julia-course-backup-v1.json");
  const backupText=await readFile(await download.path(),"utf8");
  const data=JSON.parse(backupText);
  const key="amp-julia-lab:draft:v1:02";
  assert.equal(data.entries[key],code);
  assert.ok(!backupText.includes("jdoodle")&&!backupText.includes("runner-token"));
  await r2Locator(page,"#scratch-code").fill('println("new work")');
  await r2Locator(page,"#course-backup-file").setInputFiles({name:"course.json",mimeType:"application/json",buffer:Buffer.from(backupText)});
  await page.waitForFunction(()=>document.getElementById("course-backup-preview").textContent.includes("conflict"));
  assert.match(await r2Locator(page,"#course-backup-preview").innerText(),/1 conflict/);
  await r2Locator(page,"#course-backup-restore").click();
  await r2Role(page,"heading",{name:"Vectors & indexing"}).waitFor();
  assert.equal(await r2Locator(page,"#scratch-code").inputValue(),'println("new work")');
  await r2Locator(page,"#course-backup").evaluate(el=>el.open=true);
  await r2Locator(page,"#course-backup-file").setInputFiles({name:"course.json",mimeType:"application/json",buffer:Buffer.from(backupText)});
  await page.waitForFunction(()=>document.getElementById("course-backup-preview").textContent.includes("conflict"));
  await r2Locator(page,"#course-backup-mode").selectOption("replace");
  await r2Locator(page,"#course-backup-restore").click();
  assert.match(await r2Locator(page,"#course-backup-status").innerText(),/Confirm replacing/);
  await r2Locator(page,"#course-backup-approval").check();
  await r2Locator(page,"#course-backup-restore").click();
  await r2Role(page,"heading",{name:"Vectors & indexing"}).waitFor();
  assert.equal(await r2Locator(page,"#scratch-code").inputValue(),code);
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,device.name+" overflow");
  assert.deepEqual(errors,[]);
  count++;
  console.log("BACKUP BROWSER PASS",device.name,"export, conflict preview, keep, replace, canonical draft");
  await page.close();
 }
}finally{await browser.close();await new Promise(done=>server.close(done));}
assert.equal(count,2);
