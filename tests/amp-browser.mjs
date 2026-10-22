import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";

const root=resolve(".");
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8"};
const server=createServer(async(req,res)=>{
  const name=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
  const file=resolve(root,"."+(name==="/" ? "/index.html" : name));
  if(!(file===root || file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
  try{const bytes=await readFile(file);
    res.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream","Cache-Control":"no-store"});
    res.end(bytes);
  }catch{res.writeHead(404);res.end("Not found");}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const port=server.address().port,base="http://127.0.0.1:"+port;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
let count=0;
try{
  for(const spec of [
    {name:"desktop",options:{viewport:{width:1390,height:900}}},
    {name:"mobile",options:{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}}
  ]){
    const page=await browser.newPage({...spec.options,acceptDownloads:true});
    const errors=[];page.on("pageerror",e=>errors.push(e.message));
    await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js",route=>
      route.fulfill({status:200,contentType:"text/javascript",body:"window.__providerTestStub=true;"}));
    await page.goto(base+"/#lesson/09");
    await page.getByRole("heading",{name:"Floating-point numbers"}).waitFor();
    assert.equal(await page.locator(".lesson-link").count(),16);
    assert.equal(await page.locator("#amp-root-workshop").isVisible(),true);
    assert.equal(await page.locator("#amp-condition-workshop").isVisible(),true);
    assert.equal(await page.locator("#amp-mission-workshop").isVisible(),true);
    const savedDraft=await page.locator("#scratch-code").inputValue();
    const savedProgress=await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1"));
    await page.locator("#amp-root-case").selectOption("cancellation");
    assert.match(await page.locator("#amp-root-summary").innerText(),/relative result discrepancy/i);
    assert.equal(await page.locator("#amp-root-chart circle").count(),5);
    await page.locator("#amp-root-mode").selectOption("cancellation");
    assert.equal(await page.locator("#amp-root-sweep-table tr").count(),7);
    assert.equal(await page.locator("#amp-root-chart circle").count(),7);
    assert.match(await page.locator("#amp-root-chart-label").innerText(),/relative difference/i);
    const [csv]=await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button",{name:"Export CSV comparison"}).click()
    ]);
    assert.equal(csv.suggestedFilename(),"amp-root-cancellation.csv");
    const csvText=await readFile(await csv.path(),"utf8");
    assert.match(csvText,/relative_condition_max/);
    assert.equal(csvText.trim().split("\n").length,8);
    const [jl]=await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button",{name:"Download Julia experiment",exact:true}).first().click()
    ]);
    assert.equal(jl.suggestedFilename(),"amp-root-cancellation.jl");
    assert.match(await readFile(await jl.path(),"utf8"),/using PrettyTables/);
    await page.locator("#amp-condition-case").selectOption("composition");
    await page.locator("#amp-condition-x").selectOption("1.5");
    assert.equal(await page.locator("#amp-condition-table tr").count(),4);
    assert.match(await page.locator("#amp-condition-formula").innerText(),/sin\(x² \+ 1\)/);
    const [conditionFile]=await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button",{name:"Download Julia experiment",exact:true}).nth(1).click()
    ]);
    assert.match(await readFile(await conditionFile.path(),"utf8"),/fprime/);
    assert.equal(await page.locator("#scratch-code").inputValue(),savedDraft);
    assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:v1")),savedProgress);
    await page.locator("#amp-mission-choice").selectOption("relative_response");
    assert.match(await page.locator("#amp-mission-task").innerText(),/relative output change/i);
    await page.locator("#scratch-code").fill(
      "relative_response(f,x,eta) = abs((f(x*(1+eta))-f(x))/(eta*f(x)))");
    const [missionFile]=await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button",{name:"Download Julia tests for current draft"}).click()
    ]);
    const script=await readFile(await missionFile.path(),"utf8");
    assert.match(script,/using Test/);
    assert.match(script,/relative_response\(f,x,eta\)/);
    assert.equal((script.match(/@testset /g)||[]).length,5);
    await page.goto(base+"/#lesson/16");
    await page.getByRole("heading",{name:"Conditioning capstone"}).waitFor();
    assert.equal(await page.locator("#amp-root-workshop").isVisible(),true);
    assert.equal(await page.locator("#amp-mission-choice option").count(),1);
    assert.match(await page.locator("#amp-mission-starter").innerText(),/small_root/);
    await page.goto(base+"/#lesson/04");
    await page.getByRole("heading",{name:"Plot mathematical functions"}).waitFor();
    for(const section of ["#amp-root-workshop","#amp-condition-workshop","#amp-mission-workshop"])
      assert.equal(await page.locator(section).isVisible(),false);
    assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,
      spec.name+" unexpected horizontal overflow");
    assert.deepEqual(errors,[]);
    count++;
    console.log("AMP BROWSER PASS",spec.name,"three workshops, real exports and isolated canonical drafts");
    await page.close();
  }
}finally{
  await browser.close();
  await new Promise(done=>server.close(done));
}
assert.equal(count,2);
console.log("AMP BROWSER PASS",count,"desktop/mobile comprehensive checks");
