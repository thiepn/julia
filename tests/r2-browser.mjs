import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,mkdir} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";
const root=resolve(".");
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",
  ".js":"text/javascript; charset=utf-8",".json":"application/json",".svg":"image/svg+xml"};
const server=createServer(async(req,res)=>{
  const path=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
  const file=resolve(root,"."+(path==="/"?"/index.html":path));
  if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return;}
  try{const content=await readFile(file);res.writeHead(200,
    {"Content-Type":mime[extname(file)]||"application/octet-stream"});res.end(content);}
  catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const origin="http://127.0.0.1:"+server.address().port;
const viewports=[
  {name:"mobile-320",width:320,height:700},
  {name:"mobile-360",width:360,height:800},
  {name:"mobile-390",width:390,height:844},
  {name:"mobile-430",width:430,height:932},
  {name:"tablet-768",width:768,height:1024},
  {name:"tablet-1024",width:1024,height:768},
  {name:"desktop-1280",width:1280,height:800},
  {name:"desktop",width:1440,height:900},
  {name:"desktop-1920",width:1920,height:1080}
];
const shots=process.env.R2_SCREENSHOTS==="1";
try{
  for(const scheme of ["light","dark"]){
    for(const device of viewports){
      const page=await browser.newPage({viewport:{width:device.width,height:device.height},colorScheme:scheme});
      const errors=[];page.on("pageerror",error=>errors.push(error.message));
      await page.route("https://www.jdoodle.com/assets/jdoodle-pym.min.js",
        route=>route.fulfill({status:200,contentType:"text/javascript",body:"window.__mock=true;"}));
      const shot=async view=>{
        if(!shots)return;
        const dir=resolve("r2-screenshots",scheme);await mkdir(dir,{recursive:true});
        await page.screenshot({path:resolve(dir,device.name+"-"+view+".jpg"),type:"jpeg",quality:72,fullPage:true,animations:"disabled"});
        if(scheme==="light"&&["desktop","mobile-390"].includes(device.name)&&["course","code"].includes(view)){
          const capture=await page.screenshot({type:"jpeg",quality:58,animations:"disabled"});
          console.log("R2_VISUAL_CAPTURE:"+device.name+":"+view+":"+capture.toString("base64"));
        }
      };
      const noOverflow=async label=>{
        const d=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
        if(d>2){const offenders=await page.evaluate(()=>[...document.querySelectorAll("body *")]
          .map(e=>({tag:e.tagName,id:e.id,cls:typeof e.className==="string"?e.className.slice(0,65):"",
            x:Math.round(e.getBoundingClientRect().x),
            right:Math.round(e.getBoundingClientRect().right),width:Math.round(e.getBoundingClientRect().width),
            display:getComputedStyle(e).display}))
          .filter(x=>x.display!=="none"&&(x.right>innerWidth+2||x.x< -2))
          .sort((a,b)=>b.right-a.right).slice(0,14));console.log("R2 OVERFLOW ELEMENTS",device.name,scheme,label,JSON.stringify(offenders));}
        assert.ok(d<=2,device.name+" "+scheme+" "+label+" horizontal overflow: "+d);
      };
      await page.goto(origin+"/#course");
      await page.locator("#r2-course").waitFor({state:"visible"});
      assert.equal(await page.locator(".lesson-link").count(),16);
      assert.equal(await page.locator("#r2-course-progress").innerText(),"0 of 16 concept sets reviewed");
      assert.match(await page.locator('.lesson-link[href="#lesson/02"] .r2-syllabus-details').innerText(),
        /10 min.*Suggested before: 01/);
      assert.match(await page.locator('.lesson-link[href="#lesson/11"] .r2-syllabus-details').innerText(),
        /Suggested before: 06, 08/);
      assert.equal(await page.locator('.lesson-link[href="#lesson/01"] .nav-score').innerText(),"0/3 correct");
      assert.equal(await page.locator("#r2-preview-prereqs").isVisible(),false);
      assert.equal(await page.locator("#r2-next-lesson-title").innerText(),"01 · Variables & numbers");
      assert.match(await page.locator("#r2-next-lesson-code").innerText(),/println\(a \+ b\)/);
      assert.equal(await page.locator("#r2-stage-code").isVisible(),false);
      await noOverflow("course");await shot("course");
      if(scheme==="light"&&device.name==="desktop"){
        await page.locator("#r2-next-code").click();
        await page.locator("#r2-stage-code").waitFor({state:"visible"});
        assert.equal(await page.locator("#lesson-jump").inputValue(),"01");
        await page.locator("#r2-course-open").click();
        await page.locator("#r2-course").waitFor({state:"visible"});
        await page.locator('.lesson-link[href="#lesson/11"]').click();
        await page.waitForFunction(()=>document.querySelector("#lesson-jump")?.value==="11");
        assert.equal(await page.locator('#r2-lesson-prereqs a[href="#lesson/06"]').count(),1);
        assert.equal(await page.locator('#r2-lesson-prereqs a[href="#lesson/08"]').count(),1);
        await page.locator('#r2-lesson-prereqs a[href="#lesson/06"]').click();
        await page.waitForFunction(()=>document.querySelector("#lesson-jump")?.value==="06");
        await page.locator("#r2-lesson-next").click();
        await page.waitForFunction(()=>document.querySelector("#lesson-jump")?.value==="07");
        await page.locator("#r2-lesson-previous").click();
        await page.waitForFunction(()=>document.querySelector("#lesson-jump")?.value==="06");
        await page.locator("#r2-back-course").click();
        await page.locator("#r2-course").waitFor({state:"visible"});
      }
      await page.locator('.lesson-link[href="#lesson/09"]').click();
      await page.getByRole("heading",{name:"Floating-point numbers"}).waitFor();
      assert.equal(await page.locator("#r2-stage-learn").isVisible(),true);
      assert.equal(await page.locator("#r2-stage-code").isVisible(),false);
      assert.equal(await page.locator(".r2-learn-reading #lesson-theory").count(),1);
      assert.equal(await page.locator(".r2-example-pane #example-code").count(),1);
      assert.match(await page.locator("#example-code").innerText(),/isapprox/);
      assert.equal(await page.locator("#r2-example-source").innerText(),"Kalicharan ch. 2; AMP VL01");
      await noOverflow("learn");await shot("learn");
      await page.locator('[data-r2-stage="check"]').click();
      assert.equal(await page.locator("#r2-stage-check").isVisible(),true);
      assert.equal(await page.locator("#questions .question:visible").count(),1);
      assert.equal(await page.locator("#r2-check-code").innerText(),
        await page.locator("#example-code").innerText());
      assert.equal(await page.locator("#r2-question-steps button").count(),3);
      assert.equal(await page.locator('#r2-question-steps button[aria-current="step"]').count(),1);
      if(device.name==="desktop"&&scheme==="light"){
        // Original evaluator determines correction and checkpoint progress.
        await page.locator('[data-question="0"][data-choice="0"]').click();
        assert.equal(await page.locator('#r2-question-steps button[data-r2-question="0"]').getAttribute("data-state"),"Try again");
        assert.equal(await page.locator("#questions .question:visible .answer-reason").count(),1);
        await page.locator('[data-question="0"][data-choice="1"]').click();
        assert.equal(await page.locator('#r2-question-steps button[data-r2-question="0"]').getAttribute("data-state"),"Correct");
        await page.locator('#r2-question-steps button[data-r2-question="2"]').click();
        assert.match(await page.locator("#r2-question-index").innerText(),/Question 3 of 3/);
        assert.equal(await page.locator("#questions .question:visible").count(),1);
        await page.locator("#r2-review-concept").click();
        assert.equal(await page.locator("#r2-stage-learn").isVisible(),true);
        await page.locator("#r2-example-code").click();
        assert.equal(await page.locator("#r2-stage-code").isVisible(),true);
        await page.locator('[data-r2-stage="check"]').click();
        await page.locator('#r2-question-steps button[data-r2-question="0"]').click();
      }
      await page.locator("#r2-question-next").click();
      assert.match(await page.locator("#r2-question-index").innerText(),/Question 2 of 3/);
      await noOverflow("check");await shot("check");
      await page.locator("#r2-check-code-button").click();
      const editor=page.locator("#scratch-code");
      assert.equal(await editor.isVisible(),true);
      assert.equal(await page.locator("#compiler-panel").isVisible(),true);
      if(device.width>=768){
        const rect=await editor.boundingBox();
        assert.ok(rect.height>=420,device.name+" editor height "+rect.height);
      }
      await editor.fill('println("R2 original persisted source")');
      assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:draft:v1:09")),
        'println("R2 original persisted source")');
      await page.locator('[data-r2-stage="learn"]').click();
      await page.locator('button[data-r2-stage="code"]').click();
      assert.equal(await editor.inputValue(),'println("R2 original persisted source")');
      if(device.name==="desktop"&&scheme==="light"){
        await page.locator("#r2-course-open").click();
        await page.locator("#r2-course").waitFor({state:"visible"});
        assert.equal(await page.locator('.lesson-link[href="#lesson/09"] .nav-score').innerText(),"1/3 correct");
        assert.equal(await page.locator("#r2-course-progress").innerText(),"0 of 16 concept sets reviewed");
        assert.match(await page.locator("#r2-resume-current").innerText(),/Return to 09.*Code/);
        await page.locator("#r2-resume-current").click();
        await page.locator("#r2-stage-code").waitFor({state:"visible"});
        assert.equal(await editor.inputValue(),'println("R2 original persisted source")');
      }
      await noOverflow("code");await shot("code");
      await page.locator('button[data-r2-stage="explore"]').click();
      assert.equal(await page.locator("#r2-stage-explore").isVisible(),true);
      assert.ok(await page.locator("#r2-lab-choice option").count()>=1);
      await noOverflow("explore");await shot("explore");
      await page.locator("#r2-mixed-open").click();
      assert.equal(await page.locator("#r2-mixed").isVisible(),true);
      assert.equal(await page.locator(".rehearsal-item:visible").count(),1);
      await noOverflow("mixed");await shot("mixed");
      await page.locator("#r2-utilities-open").click();
      await page.locator("#course-backup summary").click();
      assert.equal(await page.locator("#course-backup-export").isVisible(),true);
      assert.equal(await page.locator("#embed-url").isVisible(),true);
      assert.equal(await page.locator("#submission-workflow").isVisible(),true);
      await noOverflow("utilities");await shot("utilities");
      assert.equal(new URL(page.url()).hash,"#utilities/09");
      await page.reload();
      await page.locator("#r2-utilities").waitFor({state:"visible"});
      assert.equal(await page.locator("#lesson-jump").inputValue(),"09");
      if(device.name==="desktop"&&scheme==="light"){
        for(const id of Array.from({length:16},(_,i)=>String(i+1).padStart(2,"0"))){
          await page.locator("#r2-course-open").click();
          await page.locator('.lesson-link[href="#lesson/'+id+'"]').click();
          await page.waitForFunction(id=>document.querySelector("#lesson-jump")?.value===id,id); // allow hashchange render
          assert.equal(await page.locator("#lesson-jump").inputValue(),id);
          assert.equal(await page.locator("#r2-stage-learn").isVisible(),true);
          await page.locator('[data-r2-stage="check"]').click();
          assert.equal(await page.locator("#questions .question:visible").count(),1);
          await page.locator('button[data-r2-stage="code"]').click();
          assert.equal(await page.locator("#scratch-code").isVisible(),true);
          await page.locator('button[data-r2-stage="explore"]').click();
          assert.ok(await page.locator("#r2-lab-choice option").count()>=1);
          assert.equal(await page.locator("#repair-lab").count(),1);
          await noOverflow("all-16-lesson-"+id);
        }
        await page.goto(origin+"/#course");
        await page.locator("#r2-course").waitFor({state:"visible"});
        const backups=await page.evaluate(()=>Object.keys(localStorage).filter(k=>/draft:v1/.test(k)));
        assert.ok(backups.includes("amp-julia-lab:draft:v1:09"));
        console.log("R2 CANONICAL COURSE PASS all 16 lesson IDs, all four stage entries, original drafts intact");
      }
      assert.deepEqual(errors,[],device.name+" "+scheme+" JavaScript errors");
      console.log("R2 STUDIO PASS",scheme,device.name,
        "course/learn/check/code/explore/mixed/utilities, canonical draft continuity, no horizontal overflow");
      await page.close();
    }
  }
}finally{await browser.close();await new Promise(done=>server.close(done));}
