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
  // A deterministic placeholder checks our integration without claiming live JDoodle execution.
  await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js", route =>
    route.fulfill({status:200,contentType:"text/javascript",body:"window.__jdoodleLoaderFixture = true;"}));
  await page.goto("http://127.0.0.1:"+port+"/#lesson/01");
  await check("desktop loads curriculum",async()=>{
    await page.getByRole("heading",{name:"Variables & numbers"}).waitFor();
    assert.equal(await page.locator(".lesson-link").count(),16);
    assert.equal(await page.locator(".question").count(),3);
    assert.equal(await page.locator('a[href="https://www.jdoodle.com/online-compiler-julia"]').count(),1);
    assert.equal(await page.locator('a[href="https://onecompiler.com/julia"]').count(),1);
    assert.deepEqual(errors,[]);
    assert.equal(await page.evaluate(()=>window.__jdoodleLoaderFixture),true);
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
  await check("J8 answer reasoning and continue learning target the next unreviewed concept",async()=>{
    assert.match(await page.locator("#continue-lesson").innerText(),/Continue lesson 02/);
    await page.getByRole("button",{name:/Continue lesson 02/}).click();
    await page.getByRole("heading",{name:"Vectors & indexing"}).waitFor();
    assert.equal(await page.evaluate(()=>document.activeElement.id),"lesson-title");
    await page.locator('[data-question="0"][data-choice="0"]').click();
    assert.match(await page.locator(".question").first().locator(".answer-reason").innerText(),/Julia starts indexing at 1/);
    assert.match(await page.locator(".question").first().locator(".retry").innerText(),/Try again/);
    assert.equal(await page.locator("#concept-brief").innerText(),"0/3 correct · Answer at least two to review this concept checkpoint.");
    await page.locator('[data-question="0"][data-choice="1"]').click();
    assert.match(await page.locator(".question").first().locator(".answer-reason").innerText(),/first vector element uses index 1/);
    await page.locator('[data-question="1"][data-choice="1"]').click();
    assert.match(await page.locator("#concept-brief").innerText(),/2\/3 correct · Concept checkpoint reviewed/);
    assert.match(await page.locator("#continue-lesson").innerText(),/Continue lesson 03/);
    assert.equal(await page.locator("#output-feedback").innerText(),"");
    await page.getByRole("button",{name:"Previous"}).click();
    await page.getByRole("heading",{name:"Variables & numbers"}).waitFor();
    assert.equal(await page.locator("#progress-label").innerText(),"2 of 16 concept sets reviewed");
    // This test should not modify the state expected by J7 checks below.
    await page.evaluate(()=>{
      const p=JSON.parse(localStorage.getItem("amp-julia-lab:v1")||"{}");
      delete p["02:0"];delete p["02:1"];
      localStorage.setItem("amp-julia-lab:v1",JSON.stringify(p));
    });
    await page.reload();
    assert.match(await page.locator("#continue-lesson").innerText(),/Continue lesson 02/);
  });
  await check("J9 repair lab is editable, persists and remains independent of challenge draft",async()=>{
    const starter=await page.locator("#repair-editor").inputValue();
    assert.match(starter,/area = side \* 2/);
    assert.match(await page.locator("#repair-expected").innerText(),/28 and 49/);
    await page.locator("#repair-compare").click();
    assert.match(await page.locator("#repair-feedback").innerText(),/may still be valid/i);
    assert.match(await page.locator("#progress-label").innerText(),/1 of 16/);
    await page.locator("#repair-editor").fill(starter.replace("side * 2","side ^ 2"));
    await page.locator("#repair-compare").click();
    assert.match(await page.locator("#repair-feedback").innerText(),/Text matches the reference example/);
    assert.match(await page.locator("#repair-feedback").innerText(),/does not verify Julia execution/);
    assert.equal(await page.locator("#scratch-code").inputValue(),"side = 7\n# Calculate and print the perimeter and area.\n");
    await page.reload();
    assert.match(await page.locator("#repair-editor").inputValue(),/area = side \^ 2/);
    await page.getByRole("button",{name:"Next lesson"}).click();
    await page.getByRole("heading",{name:"Vectors & indexing"}).waitFor();
    assert.match(await page.locator("#repair-editor").inputValue(),/v\[0\]/);
    await page.locator("#repair-editor").fill("println([3, 5, 7][1])");
    await page.getByRole("button",{name:"Previous"}).click();
    await page.getByRole("heading",{name:"Variables & numbers"}).waitFor();
    assert.match(await page.locator("#repair-editor").inputValue(),/area = side \^ 2/);
    await page.locator("#repair-reference summary").click();
    assert.match(await page.locator("#repair-cause").innerText(),/squaring the side/);
    await page.reload();
    assert.equal(await page.locator("#repair-reference").evaluate(el=>el.open),false);
    page.once("dialog",dialog=>dialog.dismiss());
    await page.getByRole("button",{name:"Reset repair"}).click();
    assert.match(await page.locator("#repair-editor").inputValue(),/area = side \^ 2/);
    page.once("dialog",dialog=>dialog.accept());
    await page.getByRole("button",{name:"Reset repair"}).click();
    assert.match(await page.locator("#repair-editor").inputValue(),/area = side \* 2/);
    assert.match(await page.locator("#progress-label").innerText(),/1 of 16/);
    await page.getByRole("button",{name:"Next lesson"}).click();
    await page.getByRole("heading",{name:"Vectors & indexing"}).waitFor();
    assert.equal(await page.locator("#repair-editor").inputValue(),"println([3, 5, 7][1])");
    await page.getByRole("button",{name:"Previous"}).click();
    await page.getByRole("heading",{name:"Variables & numbers"}).waitFor();
  });
  await check("per-lesson coding drafts survive navigation and reload",async()=>{
    const starter = await page.locator("#scratch-code").inputValue();
    assert.match(starter,/side = 7/);
    await page.locator("#scratch-code").fill("println(123)\n# my own work");
    assert.match(await page.locator("#draft-feedback").innerText(),/saved locally/i);
    await page.reload();
    assert.equal(await page.locator("#scratch-code").inputValue(),"println(123)\n# my own work");
    await page.getByRole("button",{name:"Next lesson"}).click();
    await page.getByRole("heading",{name:"Vectors & indexing"}).waitFor();
    assert.match(await page.locator("#scratch-code").inputValue(),/v = \[3, 5, 7, 9\]/);
    await page.locator("#scratch-code").fill("println(777)");
    await page.getByRole("button",{name:"Previous"}).click();
    await page.getByRole("heading",{name:"Variables & numbers"}).waitFor();
    assert.equal(await page.locator("#scratch-code").inputValue(),"println(123)\n# my own work");
    page.once("dialog", dialog=>dialog.dismiss());
    await page.getByRole("button",{name:"Reset to starter"}).click();
    assert.equal(await page.locator("#scratch-code").inputValue(),"println(123)\n# my own work");
    page.once("dialog", dialog=>dialog.accept());
    await page.getByRole("button",{name:"Reset to starter"}).click();
    assert.equal(await page.locator("#scratch-code").inputValue(),starter);
    await page.getByRole("button",{name:"Next lesson"}).click();
    await page.getByRole("heading",{name:"Vectors & indexing"}).waitFor();
    assert.equal(await page.locator("#scratch-code").inputValue(),"println(777)");
    await page.getByRole("button",{name:"Previous"}).click();
    await page.getByRole("heading",{name:"Variables & numbers"}).waitFor();
  });
  await check("download exports the correct real .jl file for current lesson",async()=>{
    const value="using LinearAlgebra\nx = [3, 4]\nprintln(norm(x))\n";
    await page.locator("#scratch-code").fill(value);
    const [download]=await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button",{name:"Download .jl"}).click()
    ]);
    assert.equal(download.suggestedFilename(),"amp-julia-lab-lesson-01.jl");
    const fs=await import("node:fs/promises");
    const text=await fs.readFile(await download.path(),"utf8");
    assert.equal(text,value);
    assert.match(await page.locator("#draft-feedback").innerText(),/not execute or grade/i);
  });
  await check("import rejects invalid files and protects current draft on cancel",async()=>{
    await page.locator("#scratch-code").fill("println(123)");
    await page.locator("#import-file").setInputFiles({
      name:"invalid.txt",mimeType:"text/plain",buffer:Buffer.from("println(999)")
    });
    assert.equal(await page.locator("#scratch-code").inputValue(),"println(123)");
    assert.match(await page.locator("#draft-feedback").innerText(),/Select a \.jl/);
    page.once("dialog",dialog=>dialog.dismiss());
    await page.locator("#import-file").setInputFiles({
      name:"verified.jl",mimeType:"text/plain",buffer:Buffer.from("println(456)")
    });
    assert.equal(await page.locator("#scratch-code").inputValue(),"println(123)");
    page.once("dialog",dialog=>dialog.accept());
    await page.locator("#import-file").setInputFiles({
      name:"verified.jl",mimeType:"text/plain",buffer:Buffer.from("println(456)")
    });
    await page.getByText(/Imported verified\.jl for this lesson/).waitFor();
    assert.equal(await page.locator("#scratch-code").inputValue(),"println(456)");
    await page.reload();
    assert.equal(await page.locator("#scratch-code").inputValue(),"println(456)");
    assert.equal(await page.locator("#progress-label").innerText(),"1 of 16 concept sets reviewed");
    await page.getByRole("button",{name:"Next lesson"}).click();
    await page.getByRole("heading",{name:"Vectors & indexing"}).waitFor();
    assert.equal(await page.locator("#scratch-code").inputValue(),"println(777)");
    await page.getByRole("button",{name:"Previous"}).click();
    await page.getByRole("heading",{name:"Variables & numbers"}).waitFor();
  });
  await check("J10 norm explorer renders correct geometry and inverse distinction",async()=>{
    await page.goto("http://127.0.0.1:"+port+"/#lesson/05");
    await page.getByRole("heading",{name:"Norms & geometry"}).waitFor();
    assert.equal(await page.locator("#numerical-explorer").isVisible(),true);
    assert.equal(await page.locator("#num-vector").innerText(),"(1, 1)");
    assert.equal(await page.locator("#num-mapped").innerText(),"(2, 0.5)");
    assert.equal(await page.locator("#num-determinant").innerText(),"1");
    assert.equal(await page.locator("#numerical-plot .numeric-reference").count(),1);
    assert.equal(await page.locator("#numerical-plot .numeric-direct").count(),1);
    assert.equal(await page.locator("#numerical-plot .numeric-inverse").count(),1);
    await page.locator("#num-norm").selectOption("one");
    assert.equal(await page.locator("#num-length").innerText(),"2");
    assert.equal(await page.locator("#num-mapped-length").innerText(),"2.5");
    await page.locator("#num-matrix").selectOption("singular");
    assert.equal(await page.locator("#num-determinant").innerText(),"0");
    assert.match(await page.locator("#num-inverse-state").innerText(),/not a norm/);
    assert.equal(await page.locator("#numerical-plot .numeric-inverse").count(),0);
    await page.reload();
    assert.equal(await page.locator("#num-norm").inputValue(),"one");
    assert.equal(await page.locator("#num-matrix").inputValue(),"singular");
    assert.equal(await page.locator("#progress-label").innerText(),"1 of 16 concept sets reviewed");
    await page.getByRole("button",{name:"Reset experiment"}).click();
    assert.equal(await page.locator("#num-norm").inputValue(),"two");
    assert.equal(await page.locator("#num-matrix").inputValue(),"stretch");
    await page.goto("http://127.0.0.1:"+port+"/#lesson/06");
    await page.getByRole("heading",{name:"Matrices & transformations"}).waitFor();
    assert.equal(await page.locator("#numerical-explorer").isVisible(),true);
    await page.goto("http://127.0.0.1:"+port+"/#lesson/07");
    await page.getByRole("heading",{name:"Conditions & loops"}).waitFor();
    assert.equal(await page.locator("#numerical-explorer").isVisible(),false);
    await page.goto("http://127.0.0.1:"+port+"/#lesson/01");
    await page.getByRole("heading",{name:"Variables & numbers"}).waitFor();
    assert.equal(await page.locator("#progress-label").innerText(),"1 of 16 concept sets reviewed");
  });
  await check("J11 Gaussian elimination steps, pivoting and singular feedback",async()=>{
    await page.goto("http://127.0.0.1:"+port+"/#lesson/12");
    await page.getByRole("heading",{name:"Solve linear systems"}).waitFor();
    assert.equal(await page.locator("#elimination-lab").isVisible(),true);
    assert.equal(await page.locator("#elim-stage").innerText(),"Step 1 of 14");
    assert.match(await page.locator("#elim-operation").innerText(),/augmented matrix/);
    assert.equal(await page.locator("#elim-matrix-body tr").count(),3);
    await page.getByRole("button",{name:"Next step"}).click();
    assert.match(await page.locator("#elim-operation").innerText(),/Swap R1/);
    await page.getByRole("button",{name:"Last",exact:true}).click();
    assert.match(await page.locator("#elim-solution-text").innerText(),/x = \[2, 3, -1\]/);
    assert.match(await page.locator("#elim-residual").innerText(),/\|\|A·x − b\|\|₂/);
    assert.equal(await page.getByRole("button",{name:"Next step"}).isDisabled(),true);
    await page.locator("#elim-system").selectOption("swap");
    await page.locator("#elim-pivot").selectOption("none");
    await page.getByRole("button",{name:"Last",exact:true}).click();
    assert.match(await page.locator("#elim-solution-text").innerText(),/zero pivot/);
    assert.match(await page.locator("#elim-residual").innerText(),/partial pivoting/);
    await page.locator("#elim-pivot").selectOption("partial");
    await page.getByRole("button",{name:"Last",exact:true}).click();
    assert.match(await page.locator("#elim-solution-text").innerText(),/x = \[1, 2, -1\]/);
    await page.locator("#elim-system").selectOption("singular");
    await page.getByRole("button",{name:"Last",exact:true}).click();
    assert.match(await page.locator("#elim-solution-text").innerText(),/No unique solution/);
    assert.equal(await page.locator("#elim-residual").innerText()==="",false);
    await page.locator(".elim-julia-details summary").click();
    assert.match(await page.locator("#elim-julia").innerText(),/x = A \\ b/);
    await page.reload();
    assert.equal(await page.locator("#elim-system").inputValue(),"singular");
    assert.equal(await page.locator("#elim-pivot").inputValue(),"partial");
    assert.equal(await page.locator("#progress-label").innerText(),"1 of 16 concept sets reviewed");
    await page.goto("http://127.0.0.1:"+port+"/#lesson/13");
    await page.getByRole("heading",{name:"Elimination & triangular systems"}).waitFor();
    assert.equal(await page.locator("#elimination-lab").isVisible(),true);
    await page.goto("http://127.0.0.1:"+port+"/#lesson/14");
    await page.getByRole("heading",{name:"QR & Cholesky"}).waitFor();
    assert.equal(await page.locator("#elimination-lab").isVisible(),false);
    await page.goto("http://127.0.0.1:"+port+"/#lesson/01");
    await page.getByRole("heading",{name:"Variables & numbers"}).waitFor();
    assert.equal(await page.locator("#progress-label").innerText(),"1 of 16 concept sets reviewed");
  });
  await check("provided JDoodle embed is configured on all lessons without claiming Julia execution",async()=>{
    const slot = page.locator(".jdoodle-embed");
    await slot.waitFor();
    assert.equal(await slot.getAttribute("data-pym-src"),"https://www.jdoodle.com/embed/v1/d74ec9cf98a1b5b");
    assert.match(await page.locator("#runtime-state").innerText(),/unverified|failed/i);
    assert.equal(await page.locator("#progress-label").innerText(),"1 of 16 concept sets reviewed");
    await page.getByRole("button",{name:"Next lesson"}).click();
    await page.getByRole("heading",{name:"Vectors & indexing"}).waitFor();
    assert.equal(await slot.getAttribute("data-pym-src"),"https://www.jdoodle.com/embed/v1/d74ec9cf98a1b5b");
    await page.getByRole("button",{name:"Previous"}).click();
    await page.getByRole("heading",{name:"Variables & numbers"}).waitFor();
  });
  await check("untrusted cross-origin-like output messages never grant grading",async()=>{
    await page.evaluate(()=>window.postMessage({type:"jdoodle-execution-output",output:"28\n49",status:"success"},window.location.origin));
    assert.equal(await page.locator("#output-feedback").innerText(),"");
    assert.equal(await page.locator("#progress-label").innerText(),"1 of 16 concept sets reviewed");
  });
  await check("same-page fake JDoodle output cannot become a trusted frame message",async()=>{
    const panel=page.locator("#bridge-diagnostics");
    await panel.locator("summary").click();
    await page.evaluate(()=>window.postMessage({type:"execution-output",output:"28\n49"},window.location.origin));
    await page.waitForTimeout(50);
    assert.match(await page.locator("#bridge-status").innerText(),/No matching diagnostic messages/);
    assert.equal(await page.locator("#output-feedback").innerText(),"");
    assert.equal(await page.locator("#progress-label").innerText(),"1 of 16 concept sets reviewed");
    await panel.locator("summary").click();
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
    assert.match(await page.locator("#runtime-state").innerText(),/unverified|failed/i);
  });
  await check("JDoodle loader failure leaves fallbacks available",async()=>{
    await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js", route=>route.abort());
    await page.evaluate(()=>localStorage.setItem("amp-julia-lab:jdoodle-embed-v1","https://www.jdoodle.com/embed/v1/testembed"));
    await page.reload();
    await page.getByText("Embed failed to load").waitFor();
    assert.equal(await page.locator(".compiler-links a").count(),2);
    assert.equal(await page.locator(".jdoodle-embed").count(),1);
    assert.equal(await page.locator("#progress-label").innerText(),"1 of 16 concept sets reviewed");
    await page.evaluate(()=>localStorage.removeItem("amp-julia-lab:jdoodle-embed-v1"));
  });
  await check("explicitly disabling and restoring editor does not erase study progress", async()=>{
    await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js",route=>route.abort());
    await page.getByRole("button",{name:"Compiler settings"}).click();
    await page.getByRole("button",{name:"Disable embedded editor"}).click();
    await page.getByText("Compiler not connected").waitFor();
    assert.equal(await page.locator("#progress-label").innerText(),"1 of 16 concept sets reviewed");
    await page.getByRole("button",{name:"Compiler settings"}).click();
    await page.getByRole("button",{name:"Restore course editor"}).click();
    await page.getByText("Embed failed to load").waitFor();
    assert.equal(await page.locator(".jdoodle-embed").getAttribute("data-pym-src"),"https://www.jdoodle.com/embed/v1/d74ec9cf98a1b5b");
    assert.equal(await page.locator("#progress-label").innerText(),"1 of 16 concept sets reviewed");
  });
  await page.close();

  const probe=await browser.newPage({viewport:{width:1000,height:800}});
  await probe.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js",route=>route.fulfill({
    status:200,contentType:"text/javascript",
    body:"const host=document.querySelector('.jdoodle-embed'); const f=document.createElement('iframe'); f.src=host.getAttribute('data-pym-src'); host.appendChild(f);"
  }));
  await probe.route("https://www.jdoodle.com/embed/v1/d74ec9cf98a1b5b",route=>route.fulfill({
    status:200,contentType:"text/html",body:"<!doctype html><title>Fixture: not JDoodle</title>"
  }));
  await probe.goto("http://127.0.0.1:"+port+"/#lesson/01");
  await check("simulated matching iframe is diagnosed without grading or capturing output",async()=>{
    await probe.locator(".jdoodle-embed iframe").waitFor();
    const frame=probe.frame({url:/jdoodle\.com\/embed\/v1\/d74ec9cf98a1b5b/});
    assert.ok(frame,"Synthetic provider iframe exists");
    await frame.evaluate(()=>window.parent.postMessage({onLoad:true,output:"PRIVATE"}, "*"));
    const panel=probe.locator("#bridge-diagnostics");
    await panel.locator("summary").click();
    await probe.getByText(/JDoodle sent an onLoad notification/).waitFor();
    assert.ok(frame,"Synthetic same-origin provider iframe exists");
    await frame.evaluate(()=>window.parent.postMessage({
      type:"execution-output",output:"PRIVATE_JULIA_CODE",status:"success"
    },"*"));
    await probe.getByText(/1 JDoodle-frame message/).waitFor();
    assert.match(await probe.locator("#bridge-status").innerText(),/execution-output/);
    assert.doesNotMatch(await probe.locator("#bridge-status").innerText(),/PRIVATE_JULIA_CODE/);
    assert.equal(await probe.locator("#progress-label").innerText(),"0 of 16 concept sets reviewed");
    await probe.evaluate(()=>window.postMessage({type:"execution-output",output:"spoof"},"*"));
    await probe.waitForTimeout(50);
    assert.match(await probe.locator("#bridge-status").innerText(),/\b1 JDoodle-frame message/);
    assert.equal(await probe.locator("#output-feedback").innerText(),"");
  });
  await probe.close();

  const mobile = await browser.newPage({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:2,hasTouch:true});
  mobile.on("pageerror",e=>errors.push(e.message));
  await mobile.goto("http://127.0.0.1:"+port+"/#lesson/04");
  await check("mobile allows lesson navigation and reads instructions",async()=>{
    await mobile.getByRole("heading",{name:"Plot mathematical functions"}).waitFor();
    assert.equal(await mobile.locator(".question").count(),3);
    assert.equal(await mobile.locator(".compiler-links a").count(),2);
    assert.equal(await mobile.locator("#continue-lesson").isVisible(),true);
    assert.equal(await mobile.locator("#concept-brief").isVisible(),true);
    assert.equal(await mobile.locator("#repair-editor").count(),1);
    await mobile.goto("http://127.0.0.1:"+port+"/#lesson/12");
    await mobile.getByRole("heading",{name:"Solve linear systems"}).waitFor();
    assert.equal(await mobile.locator("#elimination-lab").isVisible(),true);
    await mobile.locator("#elim-system").selectOption("swap");
    await mobile.locator("#elim-pivot").selectOption("none");
    await mobile.getByRole("button",{name:"Last",exact:true}).click();
    assert.match(await mobile.locator("#elim-solution-text").innerText(),/zero pivot/);
    const eliminationOverflow=await mobile.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(eliminationOverflow<=2,"J11 elimination overflow: "+eliminationOverflow);
    await mobile.goto("http://127.0.0.1:"+port+"/#lesson/05");
    await mobile.getByRole("heading",{name:"Norms & geometry"}).waitFor();
    assert.equal(await mobile.locator("#numerical-explorer").isVisible(),true);
    const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(overflow<=2,"J10 numerical explorer caused horizontal overflow: "+overflow);
    assert.equal(await mobile.getByRole("button",{name:"Compare with example"}).isVisible(),true);
    await mobile.getByRole("button",{name:"Go to compiler and alternatives"}).click();
    await mobile.locator("#compiler-title").waitFor();
    assert.equal(await mobile.evaluate(()=>document.activeElement.id),"compiler-title");
    await mobile.getByRole("button",{name:"Return to my code"}).click();
    assert.equal(await mobile.evaluate(()=>document.activeElement.id),"scratch-code");
    const horizontal = await mobile.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(horizontal<=2,"Unexpected horizontal page overflow: "+horizontal);
    assert.deepEqual(errors,[]);
  });
  console.log("BROWSER PASS",passed,"acceptance checks; live JDoodle runtime NOT_TESTED");
} finally {
  await browser.close();
  await new Promise(done=>server.close(done));
}
