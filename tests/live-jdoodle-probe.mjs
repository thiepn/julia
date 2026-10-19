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

  // ONE interactive smoke execution of a fixed harmless Julia program.
  const jf=page.frames().find(f=>{
    try{const u=new URL(f.url());return u.origin==="https://www.jdoodle.com"&&u.pathname==="/embed/v1/d74ec9cf98a1b5b";}
    catch{return false;}
  });
  if(!jf){console.log("JULIA_RUN_NOT_TESTED: expected JDoodle frame missing");}
  else {
    const selectors=[".monaco-editor",".ace_editor",".cm-editor","textarea","[contenteditable=true]"];
    const counts={};
    for(const selector of selectors)counts[selector]=await jf.locator(selector).count();
    console.log("Provider editor selector counts",JSON.stringify(counts));
    let editor=null;
    for(const selector of [".monaco-editor",".ace_editor",".cm-editor","[contenteditable=true]","textarea"]){
      if(counts[selector]>0){editor=jf.locator(selector).first();break;}
    }
    const run=jf.getByRole("button",{name:/^Execute$/i}).first();
    console.log("JDoodle execute button",await run.count(),"enabled",await run.isEnabled().catch(()=>false));
    if(editor && await run.isVisible().catch(()=>false)){
      const known='println("J6_" * "RUN_OK_" * string(11 * 13))';
      await editor.click({timeout:5000});
      await page.keyboard.press("ControlOrMeta+A");
      await page.keyboard.insertText(known);
      await page.waitForTimeout(500);
      const visibleInserted=await jf.evaluate(x=>document.body.innerText.includes(x),known).catch(()=>false);
      console.log("JULIA_CODE_ENTRY_UI",visibleInserted?"visible in text":"Monaco/virtual editor may not expose text");
      await run.click({timeout:5000});
      console.log("JULIA_EXECUTE_BUTTON_CLICKED");
      await page.waitForTimeout(20000);
      const body=await jf.evaluate(()=>document.body?.innerText||"").catch(()=>"");
      const expectedResult = "J6_RUN_OK_143"; // This exact string is NOT present in source code.
      const panes=await jf.evaluate(expected=>Array.from(document.querySelectorAll(".ace_editor")).map((el,i)=>({
        index:i,containsCalculatedOutput:(el.innerText||"").includes(expected),
        chars:(el.innerText||"").length,readOnly:el.classList.contains("ace_read-only")
      })),expectedResult).catch(()=>[]);
      const resultAppeared = body.includes(expectedResult);
      console.log("JULIA_CALCULATED_OUTPUT_NOT_IN_SOURCE",resultAppeared);
      console.log("JULIA_EDITOR_AND_OUTPUT_PANES",JSON.stringify(panes));
      const outputText = await jf.evaluate(()=>document.querySelectorAll(".ace_editor")[1]?.innerText||"").catch(()=>"");
      const redacted = outputText.slice(0,400).replace(/https?:\/\/\S+/g,"[URL]").replace(/[a-z0-9_-]{20,}/gi,"[REDACTED]");
      console.log("JULIA_OUTPUT_PANE_REDACTED_PREVIEW",JSON.stringify(redacted));
      const messages=await page.evaluate(()=>window.__juliaLabObservedMessages||[]);
      console.log("Provider message key schemas",
        JSON.stringify(messages.filter(x=>x.origin==="https://www.jdoodle.com"&&x.kind==="object").map(x=>x.keys).slice(-20)));
      console.log("JULIA_EXECUTION_PROBE",resultAppeared && panes.some(p=>p.containsCalculatedOutput)?"CALCULATED_OUTPUT_OBSERVED":"NOT_VERIFIED");
    } else console.log("JULIA_RUN_NOT_TESTED: editor or Run control unavailable");
  }
  console.log("LIVE_PROBE_END: one user-authorized fixed Julia smoke test, no automatic grading");

} catch(e){console.log("LIVE_PROBE_NOT_VERIFIED",String(e.message).slice(0,260));}
finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
