import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {spawnSync} from "node:child_process";
import {chromium} from "playwright";
import {crc32} from "../src/submission-package.js";
import {createLocalRunner} from "../local-runner/server.mjs";
const root=resolve(".");
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8"};
const website=createServer(async(req,res)=>{
  const path=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
  const file=resolve(root,"."+(path==="/" ? "/index.html" : path));
  if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
  try{const b=await readFile(file);res.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream"});res.end(b);}
  catch{res.writeHead(404);res.end();}
});
await new Promise(done=>website.listen(0,"127.0.0.1",done));
const port=website.address().port,origin="http://127.0.0.1:"+port;
const runner=createLocalRunner({token:"fixture-session-code-only-in-ci",origins:[origin]});
await runner.listen({port:8765});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const withPlots=process.env.AMP_SUBMISSION_REAL_PLOTS==="1";
const textDecoder=new TextDecoder();
function inspectZip(bytes){
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),parts=new Map();
  let cursor=0;
  while(view.getUint32(cursor,true)===0x04034b50){
    const len=view.getUint32(cursor+18,true),nameLen=view.getUint16(cursor+26,true),extra=view.getUint16(cursor+28,true);
    assert.equal(view.getUint16(cursor+8,true),0,"ZIP must use STORE");
    const name=textDecoder.decode(bytes.subarray(cursor+30,cursor+30+nameLen));
    const payload=bytes.subarray(cursor+30+nameLen+extra,cursor+30+nameLen+extra+len);
    assert.equal(view.getUint32(cursor+14,true),crc32(payload),"CRC mismatch");
    parts.set(name,payload);cursor+=30+nameLen+extra+len;
  }
  assert.equal(view.getUint32(cursor,true),0x02014b50);
  assert.equal(view.getUint32(bytes.length-22,true),0x06054b50);
  assert.equal(parts.size,view.getUint16(bytes.length-12,true));
  return parts;
}
let passed=0;
try{
  for(const device of [
    {name:"desktop",settings:{viewport:{width:1390,height:900}}},
    {name:"mobile",settings:{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}}
  ]){
    const page=await browser.newPage({...device.settings,acceptDownloads:true});
    const errors=[];page.on("pageerror",e=>errors.push(e.message));
    await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js",route=>
      route.fulfill({status:200,contentType:"text/javascript",body:"window.__jdoodleTestStub=true;"}));
    await page.goto(origin+"/#lesson/04");
    await page.getByRole("heading",{name:"Plot mathematical functions"}).waitFor();
    await page.locator("#r2-utilities-open").click();
    await page.locator("#submission-workflow").evaluate(el=>el.open=true);
    assert.equal(await page.locator("#submission-name").isDisabled(),true);
    await page.locator("#submission-disable-embed").click();
    await page.getByRole("heading",{name:"Tools & settings"}).waitFor();
    await page.locator("#submission-workflow").evaluate(el=>el.open=true);
    assert.equal(await page.locator("#submission-name").isEnabled(),true);
    await page.evaluate(()=>window.print=()=>{window.__didPrint=true;});
    await page.locator("#submission-name").fill("Mustermann");
    await page.locator("#submission-number").fill("123456");
    await page.locator("#submission-task").fill("1.2");
    const source=withPlots?[
      "using Plots",
      'p = plot(1:4,[2,5,3,6]; label="Test Julia", xlabel="x", ylabel="y")',
      'savefig(p, "real.png")',
      'savefig(p, "real.svg")',
      'println("AMP-REAL-PLOT-OK")'
    ].join("\n"): '# UTF-8: α, ε, π\nprintln("AMP-REAL-CODE-OK")\nprintln(6 * 7)';
    await page.goto(origin+"/#lesson/04");
    await page.locator('[data-r2-stage="code"]').click();
    await page.locator("#scratch-code").fill(source);
    await page.locator("#local-runner-token").fill("fixture-session-code-only-in-ci");
    await page.locator("#local-runner-run").click();
    await page.locator("#local-runner-status").getByText("Executed with local Julia. Results are not graded.").waitFor({timeout:180000});
    await page.locator("#r2-utilities-open").click();
    await page.locator("#submission-workflow").evaluate(el=>el.open=true);
    assert.equal(await page.locator("#submission-include-results").isEnabled(),true);
    await page.locator("#submission-include-results").check();
    await page.locator("#submission-print-button").click();
    assert.equal(await page.evaluate(()=>window.__didPrint===true),true);
    assert.equal(await page.locator("#submission-print-source").textContent(),source);
    const pdf=await page.pdf({format:"A4",printBackground:true});
    assert.equal(pdf.subarray(0,5).toString("ascii"),"%PDF-");
    assert.ok(pdf.length>3000);
    const pdftotext=spawnSync("pdftotext",["-layout","-","-"],{input:pdf,encoding:"utf8"});
    {
      if(pdftotext.error)throw Error("Poppler pdftotext unavailable: "+pdftotext.error.message);
      assert.equal(pdftotext.status,0,pdftotext.stderr);
      assert.match(pdftotext.stdout,/Mustermann_123456_Aufgabe-1-2/);
      assert.match(pdftotext.stdout,/AMP-REAL-(PLOT|CODE)-OK/);
      if(!withPlots)assert.match(pdftotext.stdout,/α|ε|π/);
      console.log("SUBMISSION PRINT PASS",device.name,"searchable browser PDF",pdf.length);
    }
    await page.locator("#submission-pdf").setInputFiles({name:"code.pdf",mimeType:"application/pdf",buffer:pdf});
    await page.locator("#submission-stage").click();
    assert.match(await page.locator("#submission-status").innerText(),/Confirm/);
    await page.locator("#submission-confirm").check();
    await page.locator("#submission-stage").click();
    await page.waitForFunction(()=>document.getElementById("submission-count").textContent.includes("1 code/PDF pair"),null,{timeout:15000});
    assert.match(await page.locator("#submission-status").innerText(),/Pair staged locally/);
    await page.goto(origin+"/#lesson/09");
    await page.getByRole("heading",{name:"Floating-point numbers"}).waitFor();
    await page.locator("#r2-utilities-open").click();
    await page.locator("#submission-workflow").evaluate(el=>el.open=true);
    assert.match(await page.locator("#submission-count").innerText(),/1 code\/PDF pair/);
    await page.locator("#submission-task").fill("2.2b");
    const nextSource='function f(t)\n    return sqrt(1+t) - 1\nend\n# Print exactly this source in PDF';
    await page.goto(origin+"/#lesson/09");
    await page.locator('[data-r2-stage="code"]').click();
    await page.locator("#scratch-code").fill(nextSource);
    await page.locator("#r2-utilities-open").click();
    await page.locator("#submission-workflow").evaluate(el=>el.open=true);
    await page.evaluate(()=>window.print=()=>{window.__didPrint=true;});
    await page.locator("#submission-print-button").click();
    assert.equal(await page.locator("#submission-print-source").textContent(),nextSource);
    const pdfTwo=await page.pdf({format:"A4"});
    await page.locator("#submission-pdf").setInputFiles({name:"second.pdf",mimeType:"application/pdf",buffer:pdfTwo});
    await page.locator("#submission-confirm").check();
    await page.locator("#submission-stage").click();
    await page.waitForFunction(()=>document.getElementById("submission-count").textContent.includes("2 code/PDF pairs"),null,{timeout:15000});
    assert.match(await page.locator("#submission-status").innerText(),/Pair staged locally/);
    const before=await page.evaluate(()=>Object.entries(localStorage));
    assert.ok(!JSON.stringify(before).includes("Mustermann")&&!JSON.stringify(before).includes("123456"));
    const [archive]=await Promise.all([
      page.waitForEvent("download"),
      page.locator("#submission-download-zip").click()
    ]);
    assert.equal(archive.suggestedFilename(),"AMP_Uebungen_Julia_Abgabe.zip");
    const contents=inspectZip(new Uint8Array(await readFile(await archive.path())));
    const a="Mustermann_123456_Aufgabe-1-2",b="Mustermann_123456_Aufgabe-2-2b";
    assert.equal(textDecoder.decode(contents.get(a+".jl")),source);
    assert.equal(textDecoder.decode(contents.get(b+".jl")),nextSource);
    assert.equal(textDecoder.decode(contents.get(a+".pdf").subarray(0,5)),"%PDF-");
    assert.equal(textDecoder.decode(contents.get(b+".pdf").subarray(0,5)),"%PDF-");
    assert.match(textDecoder.decode(contents.get("results/"+a+"-run.txt")),/AMP-REAL/);
    if(withPlots){
      const png=contents.get("results/"+a+"-figure-1.png");
      const svg=contents.get("results/"+a+"-figure-2.svg");
      assert.ok(png&&png.length>1000);
      assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
      assert.ok(svg&&svg.length>1000);
      assert.match(textDecoder.decode(svg),/<svg/);
    }
    assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,
      device.name+" horizontal overflow");
    assert.deepEqual(errors,[]);
    passed++;
    console.log("SUBMISSION BROWSER PASS",device.name,withPlots?"real plots":"real stdout",
      contents.size,"ZIP entries, PDF and Julia source");
    await page.close();
  }
}finally{
  await browser.close();
  await runner.close();
  await new Promise(done=>website.close(done));
}
assert.equal(passed,2);
