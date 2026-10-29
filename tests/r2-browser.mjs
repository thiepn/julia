import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,mkdir} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";
import {openLegacyWorkspace} from "./r2-legacy-navigation.mjs";
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
        if(scheme==="light"&&["desktop","mobile-390"].includes(device.name)&&["course","code","explore"].includes(view)){
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
      try{await page.locator("#r2-course").waitFor({state:"visible"});}
      catch(error){console.error("R2 STARTUP ERRORS",JSON.stringify(errors));throw error;}
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
      console.log("R2_PAGE_ERRORS",JSON.stringify(errors));
      console.log("R2_INITIAL_STATE",await page.evaluate(()=>({
        view:document.body.dataset.r2View,
        stage:document.body.dataset.r2Stage,
        mainHidden:document.getElementById("lesson-main")?.hidden,
        courseHidden:document.getElementById("r2-course")?.hidden,
        codeHidden:document.getElementById("r2-stage-code")?.hidden,
        codeParent:document.getElementById("r2-stage-code")?.parentElement?.className
      })));
      assert.equal(await page.locator("#r2-stage-code").isVisible(),false);
      await noOverflow("course");await shot("course");
      if(scheme==="light"&&device.name==="desktop"){
        await page.locator("#r2-next-code").click();
        await page.locator("#r2-stage-learn").waitFor({state:"visible"});
        await openLegacyWorkspace(page);
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
      await openLegacyWorkspace(page);
      await page.locator("#r2-stage-code").waitFor({state:"visible"});
      assert.equal(await page.locator("#r2-practice-guidance").count(),1);
      assert.equal(await page.locator('[data-r2-practice="build"]').getAttribute("aria-pressed"),"true");
      assert.equal(await page.locator("#scratch-code").count(),1);
      const touch=page.locator(".r2-touch-keys");
      assert.equal(await touch.isVisible(),device.width<=1024);
      assert.equal(await touch.locator("button").count(),9);
      if(device.name==="mobile-390"&&scheme==="light"){
        // Edit the original textarea; existing input listener owns persistence.
        await page.locator("#scratch-code").fill("f(x)");
        await page.locator("#scratch-code").evaluate(el=>el.setSelectionRange(2,3));
        await touch.locator('[data-touch-key="brackets"]').click();
        assert.equal(await page.locator("#scratch-code").inputValue(),"f([x])");
        assert.equal(await page.locator("#scratch-code").evaluate(el=>el.selectionStart),3);
        assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:draft:v1:09")),"f([x])");
        // Phase 09: a complete selected block is indented and outdented
        // through the original Julia editor's storage-owned input listener.
        await page.locator("#scratch-code").fill("begin\\nx = 1\\nend".replace(/\\n/g,"\n"));
        await page.locator("#scratch-code").evaluate(el=>el.setSelectionRange(6,12));
        await touch.locator('[data-touch-key="indent"]').click();
        assert.equal(await page.locator("#scratch-code").inputValue(),"begin\\n    x = 1\\nend".replace(/\\n/g,"\n"));
        await touch.locator('[data-touch-key="outdent"]').click();
        const unchanged="begin\\nx = 1\\nend".replace(/\\n/g,"\n");
        assert.equal(await page.locator("#scratch-code").inputValue(),unchanged);
        assert.equal(await page.evaluate(()=>localStorage.getItem("amp-julia-lab:draft:v1:09")),unchanged);
        assert.equal(await page.locator("#scratch-code").count(),1);
      }
      await noOverflow("touch-keys");
      await page.locator('[data-r2-practice="scaffold"]').click();
      assert.equal(await page.locator('[data-r2-practice="scaffold"]').getAttribute("aria-pressed"),"true");
      assert.match(await page.locator("#r2-practice-guidance").innerText(),/existing hints/);
      assert.equal(await page.locator("#r2-scaffold").isVisible(),true);
      assert.match(await page.locator("#r2-scaffold-count").innerText(),/Cue 1 of/);
      await page.locator("#r2-scaffold-next").click();
      assert.match(await page.locator("#r2-scaffold-count").innerText(),/Cue 2 of/);
      // On narrow viewports the canonical task is intentionally collapsed in
      // a native details element. Open it before interacting with its select.
      if(!await page.locator("#practice-mode").isVisible()){
        const taskPanel=page.locator(".r2-instructions");
        assert.equal(await taskPanel.evaluate(el=>el.open),false);
        await taskPanel.locator(":scope > summary").click();
      }
      assert.equal(await page.locator("#practice-mode").isVisible(),true);
      await page.locator("#practice-mode").selectOption("a");
      assert.match(await page.locator("#r2-scaffold-count").innerText(),/Cue 1 of/);
      assert.equal(await page.locator("#scratch-code").count(),1);
      await page.locator("#practice-mode").selectOption("original");
      await page.locator('[data-r2-practice="build"]').click();
      assert.equal(await page.locator("#r2-scaffold").isVisible(),false);
      // Every lesson owns a repair exercise; only lessons with a canonical
      // trace may enable tracing. Neither operation may replace the editor.
      const originalDraft=await page.locator("#scratch-code").inputValue();
      await page.locator('[data-r2-practice="debug"]').click();
      assert.equal(await page.locator("#r2-stage-explore").isVisible(),true);
      assert.equal(await page.locator("#r2-lab-choice").inputValue(),"repair-lab");
      assert.equal(await page.locator("#repair-editor").count(),1);
      await openLegacyWorkspace(page);
      assert.equal(await page.locator("#scratch-code").inputValue(),originalDraft);
      const traceEnabled=await page.locator('[data-r2-practice="trace"]').isEnabled();
      if(traceEnabled){
        await page.locator('[data-r2-practice="trace"]').click();
        assert.equal(await page.locator("#r2-lab-choice").inputValue(),"program-trace");
        assert.equal(await page.locator("#r2-stage-explore").isVisible(),true);
        await openLegacyWorkspace(page);
        assert.equal(await page.locator("#scratch-code").inputValue(),originalDraft);
      }
      assert.equal(await page.locator("#scratch-code").count(),1);
      await noOverflow("practice-path");
      await page.locator('[data-r2-stage="learn"]').click();
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
        assert.equal(await page.locator("#r2-stage-explore").isVisible(),true);
        await openLegacyWorkspace(page);
        await page.locator('[data-r2-stage="check"]').click();
        await page.locator('#r2-question-steps button[data-r2-question="0"]').click();
      }
      await page.locator("#r2-question-next").click();
      assert.match(await page.locator("#r2-question-index").innerText(),/Question 2 of 3/);
      await noOverflow("check");await shot("check");
      await page.locator("#r2-check-code-button").click();
      assert.equal(await page.locator("#r2-stage-explore").isVisible(),true);
      await openLegacyWorkspace(page);
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
      await openLegacyWorkspace(page);
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
      await page.locator("#r2-tests-jump").click();
      assert.equal(await page.locator("#r2-test-desk").isVisible(),true);
      assert.equal(await page.locator(".r2-test-cases-pane #external-test-cases li").count(),4);
      assert.equal(await page.locator(".r2-test-results-pane #external-test-local-output").count(),1);
      assert.equal(await page.locator("#r2-test-verification").innerText(),"Not run");
      await noOverflow("code-tests");await shot("code-tests");
      await page.locator('button[data-r2-stage="explore"]').click();
      assert.equal(await page.locator("#r2-stage-explore").isVisible(),true);
      assert.ok(await page.locator("#r2-lab-choice option").count()>=1);
      assert.equal(await page.locator(".r2-explore-stage .r2-lab:not(.r2-lab-inactive)").count(),1);
      assert.equal(await page.locator(".r2-explore-workbench").count(),1);
      await page.locator("#r2-lab-choice").selectOption("precision-lab");
      assert.equal(await page.locator("#r2-explore-source-state").innerText(),
        "Original Julia example · not executed");
      assert.equal(await page.locator("#precision-julia").count(),1);
      assert.equal(await page.locator(".r2-explore-live-source").innerText(),
        await page.locator("#precision-julia").textContent());
      const oldPrecisionSource=await page.locator("#precision-julia").textContent();
      await page.locator("#precision-x").selectOption("2");
      await page.waitForFunction(()=>document.querySelector(".r2-explore-live-source")?.textContent===
        document.getElementById("precision-julia")?.textContent);
      assert.notEqual(await page.locator(".r2-explore-live-source").textContent(),oldPrecisionSource);
      assert.ok(await page.locator("#precision-comparison tr").count()>0);
      await page.locator("#r2-lab-choice").selectOption("ue02-lab");
      assert.equal(await page.locator(".r2-explore-live-source").textContent(),
        await page.locator("#ue02-code").textContent());
      await page.locator("#r2-lab-choice").selectOption("precision-lab");
      await noOverflow("explore");await shot("explore");
      await openLegacyWorkspace(page);
      assert.equal(await page.locator("#r2-stage-code").isVisible(),true);
      assert.equal(await editor.inputValue(),'println("R2 original persisted source")');
      await page.locator('button[data-r2-stage="explore"]').click();
      await page.locator("#r2-mixed-open").click();
      assert.equal(await page.locator("#r2-mixed").isVisible(),true);
      assert.equal(await page.locator(".rehearsal-item:visible").count(),1);
      // Phase 08: original mixed prompts, no fabricated grading or persistence.
      assert.equal(await page.locator(".rehearsal-item").count(),6);
      assert.equal(await page.locator(".rehearsal-reasoning").count(),6);
      assert.equal(await page.locator(".rehearsal-attempt-status").count(),6);
      assert.match(await page.locator(".rehearsal-item:visible .rehearsal-attempt-status").innerText(),/not graded/);
      const proof=page.locator(".rehearsal-item").filter({has:page.locator(".rehearsal-working")}).first();
      await proof.locator(".rehearsal-working").evaluate(el=>{el.value="Reasoning retained until a new set is confirmed";el.dispatchEvent(new Event("input",{bubbles:true}));});
      assert.match(await proof.locator(".rehearsal-attempt-status").innerText(),/Attempt started/);
      await page.locator("#r2-course-open").click();
      await page.locator("#r2-mixed-open").click();
      assert.equal(await proof.locator(".rehearsal-working").inputValue(),"Reasoning retained until a new set is confirmed");
      page.once("dialog",dialog=>dialog.dismiss());
      await page.locator("#semester-rehearsal-new").click();
      assert.equal(await proof.locator(".rehearsal-working").inputValue(),"Reasoning retained until a new set is confirmed");
      page.once("dialog",dialog=>dialog.accept());
      await page.locator("#semester-rehearsal-new").click();
      assert.equal(await page.locator(".rehearsal-attempt-status").count(),6);
      assert.equal(await page.locator(".rehearsal-attempt-status").first().innerText(),"Not yet attempted · not graded");
      // Phase 08: a coding-plan draft survives lesson transfer and returns
      // to the exact source-owned task, without claiming Julia execution.
      await page.locator("#r2-mixed-next").click();
      const coding=page.locator(".rehearsal-item:visible");
      assert.equal(await coding.getAttribute("data-kind"),"coding");
      await coding.locator(".rehearsal-working").fill("Inputs, outputs, pivot edge cases; Julia execution pending.");
      const codingId=await coding.getAttribute("data-source-id");
      await coding.locator(".rehearsal-work").click();
      await page.waitForURL(/#lesson\/\d{2}$/);
      await page.locator("#r2-stage-explore").waitFor({state:"visible"});
      assert.equal(await page.locator("#semester-rehearsal-return").evaluate(
        el=>Boolean(el.closest(".r2-lesson-head"))),true);
      assert.equal(await page.locator("#semester-rehearsal-return").isVisible(),true);
      // Returning must remain possible after a genuine stage interruption,
      // not depend on the completion-depth lab being the selected experiment.
      await openLegacyWorkspace(page);
      assert.equal(await page.locator("#semester-rehearsal-return").isVisible(),true);
      await page.locator("#semester-rehearsal-return").click();
      assert.equal(await page.locator(".rehearsal-item:visible").getAttribute("data-source-id"),codingId);
      assert.equal(await page.locator(".rehearsal-item:visible .rehearsal-working").inputValue(),
        "Inputs, outputs, pivot edge cases; Julia execution pending.");
      assert.match(await page.locator(".rehearsal-item:visible .rehearsal-attempt-status").innerText(),/not graded/);
      assert.equal(await page.locator("#scratch-code").count(),1);
      // Source-paired proof/coding transfer must retain independent attempts
      // and never silently execute or grade Julia code.
      await page.locator(".rehearsal-item:visible .rehearsal-pair").click();
      assert.equal(await page.locator(".rehearsal-item:visible").getAttribute("data-kind"),"proof");
      const pairProof=page.locator(".rehearsal-item:visible .rehearsal-working");
      await pairProof.fill("Proof assumptions and boundary reasoning");
      await page.locator(".rehearsal-item:visible .rehearsal-pair").click();
      assert.equal(await page.locator(".rehearsal-item:visible").getAttribute("data-source-id"),codingId);
      assert.equal(await page.locator(".rehearsal-item:visible .rehearsal-working").inputValue(),
        "Inputs, outputs, pivot edge cases; Julia execution pending.");
      await page.locator(".rehearsal-item:visible .rehearsal-pair").click();
      assert.equal(await page.locator(".rehearsal-item:visible .rehearsal-working").inputValue(),
        "Proof assumptions and boundary reasoning");
      assert.equal(await page.locator(".rehearsal-pair").count(),6);
      // The comparison is source-only and mirrors independent, volatile notes.
      const compare=page.locator(".rehearsal-item:visible .rehearsal-comparison");
      // Snapshot must already be up to date before a native details toggle;
      // Chromium dispatches the toggle event asynchronously.
      assert.match(await compare.locator(".rehearsal-comparison-notes").textContent(),
        /Proof assumptions and boundary reasoning/);
      await compare.locator("summary").click();
      assert.match(await compare.innerText(),/Original proof claim/);
      assert.match(await compare.innerText(),/Original coding task/);
      assert.match(await compare.innerText(),/Source-authored Julia Test names/);
      assert.match(await compare.innerText(),/Proof assumptions and boundary reasoning/);
      assert.match(await compare.innerText(),/Inputs, outputs, pivot edge cases/);
      assert.match(await compare.innerText(),/does not establish Julia test success/);
      await page.locator(".rehearsal-item:visible .rehearsal-working").fill("Revised proof assumption");
      assert.match(await compare.innerText(),/Revised proof assumption/);
      await page.locator(".rehearsal-item:visible .rehearsal-pair").click();
      await page.locator(".rehearsal-item:visible .rehearsal-pair").click();
      assert.match(await compare.innerText(),/Revised proof assumption/);
      // Original test assertions are displayed as inert source reference,
      // never copied into the runner or interpreted as executable results.
      assert.ok(await compare.locator(".rehearsal-source-check code").count()>0);
      assert.match(await compare.locator(".rehearsal-source-check code").first().innerText(),/@test/);
      assert.match(await compare.innerText(),/Original proof reference/);
      assert.match(await compare.innerText(),/Original coding reference/);
      // Learner hypotheses stay distinct from read-only original tests.
      const predictions=compare.locator(".rehearsal-check-worksheet");
      const sourceTestCount=await compare.locator(".rehearsal-source-check code").count();
      assert.ok(sourceTestCount>0);
      assert.equal(await predictions.locator(".rehearsal-check-note").count(),sourceTestCount);
      assert.match(await predictions.locator(".rehearsal-check-progress").textContent(),/0 of .*not run here/);
      const predictionInjection='<svg onload="window.__injected=true"></svg>';
      const firstPrediction=predictions.locator(".rehearsal-check-note").first();
      await firstPrediction.fill(predictionInjection);
      assert.match(await predictions.locator(".rehearsal-check-progress").textContent(),/1 of .*not run here/);
      assert.equal(await compare.locator("svg").count(),0);
      assert.equal(await page.evaluate(()=>Boolean(window.__injected)),false);
      await page.locator(".rehearsal-item:visible .rehearsal-pair").click();
      assert.equal(await page.locator(".rehearsal-item:visible .rehearsal-check-note").first().inputValue(),
        predictionInjection);
      await page.locator(".rehearsal-item:visible .rehearsal-pair").click();
      assert.equal(await firstPrediction.inputValue(),predictionInjection);
      const audit=compare.locator(".rehearsal-transfer-review");
      assert.equal(await audit.locator(".rehearsal-review-input").count(),3);
      assert.match(await audit.locator(".rehearsal-review-progress").innerText(),/0 of 3/);
      const adversarial='<img src=x onerror="window.__injected=true">';
      await audit.locator('[data-review-field="assumptions"]').fill(adversarial);
      await audit.locator('[data-review-field="boundary"]').fill("x = 0: test the limiting assumption");
      await audit.locator('[data-review-field="coverage"]').fill("Check named Julia tests; input outside their documented cases unverified");
      assert.match(await audit.locator(".rehearsal-review-progress").innerText(),/3 of 3.*not checked or graded/);
      assert.equal(await compare.locator("img").count(),0);
      assert.equal(await page.evaluate(()=>Boolean(window.__injected)),false);
      await page.locator(".rehearsal-item:visible .rehearsal-pair").click();
      const codeAudit=page.locator(".rehearsal-item:visible .rehearsal-transfer-review");
      assert.equal(await codeAudit.locator('[data-review-field="assumptions"]').inputValue(),adversarial);
      assert.equal(await codeAudit.locator('[data-review-field="boundary"]').inputValue(),
        "x = 0: test the limiting assumption");
      assert.match(await codeAudit.locator(".rehearsal-review-progress").textContent(),/3 of 3/);
      // The paired comparison starts collapsed: open it for a genuine user edit.
      await page.locator(".rehearsal-item:visible .rehearsal-comparison > summary").click();
      await codeAudit.locator('[data-review-field="coverage"]').fill("Revised gap: no observed Julia execution");
      await page.locator(".rehearsal-item:visible .rehearsal-pair").click();
      assert.equal(await audit.locator('[data-review-field="coverage"]').inputValue(),
        "Revised gap: no observed Julia execution");
      // A different syllabus area must never inherit this review.
      await page.locator("#r2-mixed-next").click();
      await page.locator("#r2-mixed-next").click();
      const different=page.locator(".rehearsal-item:visible .rehearsal-transfer-review");
      assert.equal(await different.locator('[data-review-field="assumptions"]').inputValue(),"");
      assert.equal(await page.locator(".rehearsal-item:visible .rehearsal-check-note").first().inputValue(),"");
      await page.locator("#r2-mixed-prev").click();
      await page.locator("#r2-mixed-prev").click();
      assert.equal(await audit.locator('[data-review-field="assumptions"]').inputValue(),adversarial);
      assert.equal(await firstPrediction.inputValue(),predictionInjection);
      // Review edits survive canonical lesson navigation and cancellation,
      // but an explicitly accepted new set clears all volatile reflections.
      await page.locator(".rehearsal-item:visible .rehearsal-work").click();
      await page.locator("#semester-rehearsal-return").click();
      assert.equal(await audit.locator('[data-review-field="assumptions"]').inputValue(),adversarial);
      assert.equal(await firstPrediction.inputValue(),predictionInjection);
      assert.equal(await page.locator(".rehearsal-item:visible .rehearsal-working").evaluate(
        el=>document.activeElement===el),true);
      page.once("dialog",dialog=>dialog.dismiss());
      await page.locator("#semester-rehearsal-new").click();
      assert.equal(await audit.locator('[data-review-field="assumptions"]').inputValue(),adversarial);
      assert.equal(await firstPrediction.inputValue(),predictionInjection);
      page.once("dialog",dialog=>dialog.accept());
      await page.locator("#semester-rehearsal-new").click();
      assert.equal(await page.locator(".rehearsal-review-input").count(),18);
      for(const input of await page.locator(".rehearsal-review-input").all())
        assert.equal(await input.inputValue(),"");
      assert.match(await page.locator(".rehearsal-review-progress").first().textContent(),/0 of 3/);
      for(const input of await page.locator(".rehearsal-check-note").all())
        assert.equal(await input.inputValue(),"");
      assert.match(await page.locator(".rehearsal-check-progress").first().textContent(),/0 of/);
      // Prediction-only work must trigger confirmation on destructive reset.
      await page.locator(".rehearsal-item:visible .rehearsal-comparison > summary").click();
      await page.locator(".rehearsal-item:visible .rehearsal-check-note").first().fill("Prediction only");
      page.once("dialog",dialog=>dialog.dismiss());
      await page.locator("#semester-rehearsal-new").click();
      assert.equal(await page.locator(".rehearsal-item:visible .rehearsal-check-note").first().inputValue(),
        "Prediction only");
      page.once("dialog",dialog=>dialog.accept());
      await page.locator("#semester-rehearsal-new").click();
      assert.equal(await page.locator(".rehearsal-check-note").first().inputValue(),"");
      assert.equal(await page.locator("#scratch-code").count(),1);

      await noOverflow("mixed");await shot("mixed");
      const lessonBeforeUtilities=await page.locator("#lesson-jump").inputValue();
      await page.locator("#r2-utilities-open").click();
      await page.locator("#course-backup summary").click();
      assert.equal(await page.locator("#course-backup-export").isVisible(),true);
      await page.locator(".r2-legacy-tools > summary").click();
      await page.locator(".r2-reference-submission > summary").click();
      assert.equal(await page.locator("#embed-url").isVisible(),true);
      assert.equal(await page.locator("#submission-workflow").isVisible(),true);
      await noOverflow("utilities");await shot("utilities");
      assert.equal(new URL(page.url()).hash,"#utilities/"+lessonBeforeUtilities);
      await page.reload();
      await page.locator("#r2-utilities").waitFor({state:"visible"});
      assert.equal(await page.locator("#lesson-jump").inputValue(),lessonBeforeUtilities);
      if(device.name==="desktop"&&scheme==="light"){
        for(const id of Array.from({length:16},(_,i)=>String(i+1).padStart(2,"0"))){
          await page.locator("#r2-course-open").click();
          await page.locator('.lesson-link[href="#lesson/'+id+'"]').click();
          await page.waitForFunction(id=>document.querySelector("#lesson-jump")?.value===id,id); // allow hashchange render
          assert.equal(await page.locator("#lesson-jump").inputValue(),id);
          assert.equal(await page.locator("#r2-stage-learn").isVisible(),true);
          await page.locator('[data-r2-stage="check"]').click();
          assert.equal(await page.locator("#questions .question:visible").count(),1);
          await openLegacyWorkspace(page);
          assert.equal(await page.locator("#scratch-code").isVisible(),true);
          await page.locator('button[data-r2-stage="explore"]').click();
          assert.ok(await page.locator("#r2-lab-choice option").count()>=1);
          assert.equal(await page.locator("#repair-lab").count(),1);
          const expectedSource={
            "04":["plotting-workshop","plotting-recipe-code"],
            "09":["precision-lab","precision-julia"],
            "12":["elimination-lab","elim-julia"],
            "14":["factor-lab","factor-julia"],
            "15":["fitting-lab","fit-julia"],
            "16":["sensitivity-lab","sensitivity-julia"]
          }[id];
          if(expectedSource){
            const [lab,sourceId]=expectedSource;
            assert.equal(await page.locator('#r2-lab-choice option[value="'+lab+'"]').count(),1);
            if(await page.locator("#r2-lab-choice").isVisible())
              await page.locator("#r2-lab-choice").selectOption(lab);
            else assert.equal(await page.locator("#r2-lab-choice").inputValue(),lab);
            assert.equal(await page.locator(".r2-explore-live-source").textContent(),
              await page.locator("#"+sourceId).textContent());
            assert.equal(await page.locator("#"+sourceId).count(),1);
          }
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
