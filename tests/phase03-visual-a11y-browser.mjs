import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,mkdir} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium,firefox,webkit} from "playwright";

const root=resolve(".");
const mime={".html":"text/html;charset=utf-8",".css":"text/css;charset=utf-8",
  ".js":"text/javascript;charset=utf-8",".json":"application/json",
  ".webmanifest":"application/manifest+json"};
const server=createServer(async(req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
  const filepath=resolve(root,"."+(pathname==="/"?"/index.html":pathname));
  if(!(filepath===root||filepath.startsWith(root+sep))){res.writeHead(403);res.end();return;}
  try{
    const bytes=await readFile(filepath);
    if(res.destroyed||res.writableEnded)return;
    res.writeHead(200,{"Content-Type":mime[extname(filepath)]||"application/octet-stream"});
    res.end(bytes);
  }catch(error){
    if(res.headersSent||res.destroyed){if(!res.destroyed)res.destroy();return;}
    res.writeHead(404);res.end();
  }
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const origin="http://127.0.0.1:"+server.address().port;
const engines={chromium,firefox,webkit};
const enabled=process.env.PHASE03_ENGINES?.split(",")||["chromium"];
const capture=process.env.PHASE03_SCREENSHOTS==="1";
const audited=[320,390,768,1280,1920];
const contrast=async locator=>locator.evaluate(element=>{
  const rgb=value=>{
    const m=value.match(/rgba?\(([^)]+)\)/i);
    if(!m)return null;
    const numbers=m[1].split(/[, ]+/).map(x=>parseFloat(x)).filter(x=>Number.isFinite(x));
    return numbers.length<3?null:numbers.slice(0,4);
  };
  const luminance=c=>{
    const [r,g,b]=c.slice(0,3).map(x=>{
      x/=255;return x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4;
    });
    return 0.2126*r+0.7152*g+0.0722*b;
  };
  const fg=rgb(getComputedStyle(element).color);
  let bg=null;
  for(let p=element;p;p=p.parentElement){
    const value=rgb(getComputedStyle(p).backgroundColor);
    if(value&&value[3]!==0){bg=value;break;}
  }
  if(!bg)bg=[255,255,255];
  const lo=Math.min(luminance(fg),luminance(bg));
  const hi=Math.max(luminance(fg),luminance(bg));
  return {ratio:(hi+0.05)/(lo+0.05),foreground:fg,background:bg};
});
const checkContrast=async(locator,name,min=4.5)=>{
  const result=await contrast(locator);
  assert.ok(result.ratio>=min,name+" text "+result.ratio.toFixed(2)+":1 below "+min+
    " computed "+JSON.stringify(result));
};
const screenshot=async(page,engine,theme,width,name)=>{
  if(!capture||engine!=="chromium"||![390,768,1280].includes(width))return;
  const dir=resolve("phase03-screenshots",theme);
  await mkdir(dir,{recursive:true});
  await page.screenshot({path:resolve(dir,width+"-"+name+".jpg"),type:"jpeg",quality:78,
    fullPage:true,animations:"disabled"});
};
try{
for(const engine of enabled){
  assert.ok(engines[engine],"Unexpected engine "+engine);
  const browser=await engines[engine].launch({headless:true,args:engine==="chromium"?["--no-sandbox"]:[]});
  try{
    for(const theme of ["light","dark"]){
      for(const width of audited){
        const page=await browser.newPage({viewport:{width,height:880},colorScheme:theme});
        const errors=[];
        page.on("pageerror",err=>errors.push(err.message));
        try{
          await page.goto(origin+"/#course");
          await page.locator("#r2-course").waitFor({state:"visible"});
          assert.deepEqual(await page.locator(".r2-global-nav button").allInnerTexts(),
            ["Course","Exam Prep","Resources"]);
          assert.equal(await page.locator(".r2-course-list .lesson-link").count(),16);
          await checkContrast(page.locator(".r2-course-hero h1"),"Course heading");
          await checkContrast(page.locator(".r2-course-list .lesson-link").first(),"Syllabus link");
          await checkContrast(page.locator("#r2-course-open"),"Selected header nav");
          if(width<=390){
            const overlap=await page.evaluate(()=>{
              const brand=document.querySelector(".brand").getBoundingClientRect();
              const nav=document.querySelector(".r2-global-nav").getBoundingClientRect();
              return {overlap:brand.bottom>nav.top+1,right:nav.right,viewport:innerWidth};
            });
            assert.equal(overlap.overlap,false,"Mobile brand and nav must occupy separate rows");
            assert.ok(overlap.right<=overlap.viewport+1,"Mobile nav must fit");
            const navSize=await page.locator("#r2-mixed-open").evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
            assert.ok(navSize>=13,"Navigation text too small");
          }
          await screenshot(page,engine,theme,width,"course");
          await page.goto(origin+"/#lesson/09");
          await page.locator("#r2-stage-learn").waitFor({state:"visible"});
          await checkContrast(page.locator("#lesson-theory"),"Lesson prose");
          await checkContrast(page.locator(".r2-lesson-head h1"),"Lesson title");
          assert.equal(await page.locator(".r2-study-disclosure").count(),6);
          for(const details of await page.locator(".r2-study-disclosure").all())
            assert.equal(await details.evaluate(el=>el.open),false,"Original content starts folded");
          await checkContrast(page.locator(".r2-study-summary").first(),"Study disclosure summary");
          await screenshot(page,engine,theme,width,"learn");
          const summary=page.locator('[data-study-module="fundamentals"] > summary');
          await summary.focus();
          await page.keyboard.press("Enter");
          assert.equal(await page.locator('[data-study-module="fundamentals"]').evaluate(el=>el.open),true,
            "Keyboard Enter opens original study module");
          await screenshot(page,engine,theme,width,"learn-open");
          await page.keyboard.press("Enter");
          assert.equal(await page.locator('[data-study-module="fundamentals"]').evaluate(el=>el.open),false);
          await page.locator('[data-r2-stage="check"]').click();
          await page.locator("#r2-stage-check").waitFor({state:"visible"});
          await checkContrast(page.locator(".r2-check .question h3").first(),"Quiz question");
          await checkContrast(page.locator(".r2-check .choice").first().first(),"Quiz option");
          await screenshot(page,engine,theme,width,"quiz");
          await page.locator('[data-r2-stage="explore"]').click();
          await page.locator("#r2-stage-explore").waitFor({state:"visible"});
          assert.equal(await page.locator("#r2-apply-editor").isVisible(),true);
          await screenshot(page,engine,theme,width,"apply");
          await page.locator("#r2-apply-editor").click();
          await page.locator("#r2-stage-code").waitFor({state:"visible"});
          assert.equal(await page.locator("#scratch-code").count(),1);
          await screenshot(page,engine,theme,width,"code");
          await page.locator("#r2-mixed-open").click();
          await page.locator("#r2-mixed").waitFor({state:"visible"});
          await checkContrast(page.locator(".r2-mixed h1"),"Exam heading");
          await screenshot(page,engine,theme,width,"exam");
          await page.locator("#r2-utilities-open").click();
          await page.locator("#r2-utilities").waitFor({state:"visible"});
          const activeSummaries=page.locator("#r2-utilities details summary");
          assert.ok(await activeSummaries.count()>=2,"Resources keeps original disclosures");
          for(let i=0;i<Math.min(5,await activeSummaries.count());i++)
            await checkContrast(activeSummaries.nth(i),"Resources active summary "+i);
          await screenshot(page,engine,theme,width,"resources");
          const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
          assert.ok(overflow<=2,engine+" "+theme+" "+width+" horizontal overflow "+overflow);
          assert.deepEqual(errors,[],engine+" "+theme+" "+width+" browser errors");
          console.log("P03 VISUAL A11Y PASS",engine,theme,width,
            "contrast, syllabus, navigation, keyboard, canonical editor, seven views");
        }finally{await page.close();}
      }
    }
  }finally{await browser.close();}
}
}finally{await new Promise(done=>server.close(done));}
