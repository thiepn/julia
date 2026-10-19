// One-time, read-only browser reconnaissance of the *public* supplied JDoodle
// embed. Do not post programs, change account settings, or interpret its event
// fields as trusted. This is not an automated test of Julia code execution.
// Run only when JULIA_LAB_LIVE_PROBE=1; no credentials/API plans involved.
import {chromium, request} from "playwright";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve, extname, sep} from "node:path";
const target = "https://www.jdoodle.com/embed/v1/d74ec9cf98a1b5b";
if (process.env.JULIA_LAB_LIVE_PROBE !== "1") {
  console.log("JDoodle live probe NOT_TESTED (disabled)");
  process.exit(0);
}
const safeUrl = (input) => {
  try { const u=new URL(input); return u.origin+u.pathname; } catch{return "invalid";}
};
const ctx=await request.newContext({timeout:12000,ignoreHTTPSErrors:false});
for (const url of [target,"https://www.jdoodle.com/assets/jdoodle-pym.min.js"]){
  try {
    const r=await ctx.get(url,{timeout:12000});
    console.log("JDoodle GET",safeUrl(url),"HTTP",r.status(),"content-type",r.headers()["content-type"]||"unknown");
  } catch(e) {
    console.log("JDoodle GET NOT_VERIFIED",safeUrl(url),String(e.message).slice(0,190));
  }
}
await ctx.dispose();
const root=resolve(".");
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8"};
const server=createServer(async(req,res)=>{
  const path=new URL(req.url,"http://localhost").pathname;
  const file=resolve(root,"."+(path==="/"?"/index.html":path));
  if(!file.startsWith(root+sep)){res.writeHead(403);return res.end();}
  try{const b=await readFile(file);res.writeHead(200,{"content-type":types[extname(file)]||"application/octet-stream"});res.end(b);}
  catch{res.writeHead(404);res.end("not found");}
});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
let browser;
try{
  browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.addInitScript(()=>{
    if(window!==window.top)return;
    window.__juliaLabObservedMessages=[];
    window.addEventListener("message",event=>{
      const data=event.data;
      // Log structural field names only, never code, stdout, message values, tokens.
      window.__juliaLabObservedMessages.push({
        origin:event.origin,
        kind:data===null?"null":Array.isArray(data)?"array":typeof data,
        keys:data && typeof data==="object"&&!Array.isArray(data)?Object.keys(data).slice(0,15):[]
      });
    });
  });
  page.on("pageerror",e=>console.log("Host page exception:",String(e.message).slice(0,180)));
  await page.goto("http://127.0.0.1:"+server.address().port+"/#lesson/01",{waitUntil:"domcontentloaded",timeout:16000});
  await page.waitForTimeout(10000);
  const state=await page.locator("#runtime-state").textContent();
  const frames=page.frames().map(f=>safeUrl(f.url())).filter(s=>s!=="invalid");
  console.log("Host runtime label",state);
  console.log("Frame origin/path inventory",JSON.stringify(frames.slice(0,15)));
  const observed=await page.evaluate(()=>window.__juliaLabObservedMessages||[]);
  console.log("Observed message shapes",JSON.stringify(observed.filter(x=>/^https:\/\/(www\.)?jdoodle\.com$/.test(x.origin)).slice(0,20)));
  for(const f of page.frames()){
    if(!/^https:\/\/(www\.)?jdoodle\.com/.test(f.url()))continue;
    const summary=await f.evaluate(()=>{
      const b=Array.from(document.querySelectorAll("button, [role=button]"))
        .map(el=>(el.innerText||el.getAttribute("aria-label")||"").trim())
        .filter(Boolean).slice(0,25).map(x=>x.slice(0,55));
      return {title:document.title,buttons:b,editors:document.querySelectorAll("textarea,[contenteditable=true],.monaco-editor,.CodeMirror,.ace_editor").length,
        textLength:(document.body?.innerText||"").length};
    }).catch(e=>({error:String(e.message).slice(0,130)}));
    console.log("Provider frame inspect",safeUrl(f.url()),JSON.stringify(summary));
  }
  console.log("LIVE_PROBE_END: no Julia program executed, no event payload contract assumed");
} catch(e){console.log("LIVE_PROBE_NOT_VERIFIED",String(e.message).slice(0,260));}
finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
