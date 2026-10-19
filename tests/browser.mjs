// Run with: node tests/browser.mjs
// This is local browser acceptance, not evidence of a live JDoodle/Julia execution.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { chromium } from "playwright";

const root = resolve(".");
const types = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8" };
const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
  const file = resolve(root, "." + (pathname === "/" ? "/index.html" : pathname));
  if (!(file === root || file.startsWith(root + sep))) {
    res.writeHead(403); res.end(); return;
  }
  try {
    const data = await readFile(file);
    res.writeHead(200, { "content-type":types[extname(file)] || "application/octet-stream", "cache-control":"no-store" });
    res.end(data);
  } catch { res.writeHead(404); res.end("Not found"); }
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const port = server.address().port;
const browser = await chromium.launch({ headless:true, args:["--no-sandbox"] });
let passed=0;
const check = async (name, fn) => {
  try { await fn(); passed++; console.log("PASS",name); }
  catch (error) { console.error("FAIL",name,error); throw error; }
};
try {
  const page = await browser.newPage({viewport:{width:1390,height:900}});
  const errors=[];
  page.on("pageerror", e=>errors.push(e.message));
  await page.goto("http://127.0.0.1:"+port+"/#lesson/01");
  await check("desktop loads curriculum",async()=>{
    await page.getByRole("heading",{name:"Variables & numbers"}).waitFor();
    assert.equal(await page.locator(".lesson-link").count(),16);
    assert.equal(await page.locator(".question").count(),3);
    assert.equal(await page.locator('a[href="https://www.jdoodle.com/online-compiler-julia"]').count(),1);
    assert.equal(await page.locator('a[href="https://onecompiler.com/julia"]').count(),1);
    assert.deepEqual(errors,[]);
  });
  await check("MCQ checks persist across reload and hash navigation",async()=>{
    await page.locator('[data-question="0"][data-choice="2"]').click();
    await page.locator('[data-question="1"][data-choice="1"]').click();
    assert.match(await page.locator("#progress-label").innerText(),/1 of 16/);
    await page.reload();
    assert.equal(await page.locator(".question-head .correct").count(),2);
    await page.getByRole("button",{name:"Next lesson"}).click();
    await page.getByRole("heading",{name:"Vectors & indexing"}).waitFor();
    assert.equal(await page.locator(".question").count(),3);
    await page.getByRole("button",{name:"Previous"}).click();
    await page.getByRole("heading",{name:"Variables & numbers"}).waitFor();
    assert.equal(await page.locator(".question-head .correct").count(),2);
  });
  await check("unconfigured embed does not imply execution",async()=>{
    assert.match(await page.locator("#runtime-state").innerText(),/Not configured/);
    assert.match(await page.locator("#embed-placeholder").innerText(),/Compiler not connected/);
  });
  await check("output comparison explicitly cannot award code mastery",async()=>{
    await page.locator("#output-input").fill("28\n49");
    await page.getByRole("button",{name:"Compare output"}).click();
    assert.match(await page.locator("#output-feedback").innerText(),/not proof/i);
    assert.equal(await page.locator("#progress-label").innerText(),"1 of 16 concept sets reviewed");
    await page.locator("#output-input").fill("42");
    await page.getByRole("button",{name:"Compare output"}).click();
    assert.equal(await page.locator("#output-feedback").getAttribute("data-status"),"differs");
  });
  await check("invalid JDoodle URL rejected without third-party request",async()=>{
    await page.getByRole("button",{name:"Compiler settings"}).click();
    await page.locator("#embed-url").fill("https://evil.example/embed/v1/malicious");
    await page.getByRole("button",{name:"Save compiler link"}).click();
    assert.match(await page.locator("#settings-feedback").innerText(),/JDoodle HTTPS/);
    assert.match(await page.locator("#runtime-state").innerText(),/Not configured/);
  });
  await page.close();

  const mobile = await browser.newPage({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:2,hasTouch:true});
  mobile.on("pageerror",e=>errors.push(e.message));
  await mobile.goto("http://127.0.0.1:"+port+"/#lesson/04");
  await check("mobile allows lesson navigation and reads instructions",async()=>{
    await mobile.getByRole("heading",{name:"Plot mathematical functions"}).waitFor();
    assert.equal(await mobile.locator(".question").count(),3);
    assert.equal(await mobile.locator(".compiler-links a").count(),2);
    const horizontal = await mobile.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(horizontal<=2,"Unexpected horizontal page overflow: "+horizontal);
    assert.deepEqual(errors,[]);
  });
  console.log("BROWSER PASS",passed,"acceptance checks; live JDoodle runtime NOT_TESTED");
} finally {
  await browser.close();
  await new Promise(done=>server.close(done));
}
