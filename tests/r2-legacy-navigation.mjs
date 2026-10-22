// Legacy browser-acceptance adapter for R2. Each action uses the *visible*
// R2 Course / Check / Code / Explore / Tools controls first. Existing assertions
// keep reading the original canonical elements, progress and Julia output.
const browserActions=new Set(["click","fill","selectOption","setInputFiles","check","uncheck","press","type","dblclick"]);
const childLocators=new Set(["first","last","nth","locator","getByRole","getByText","getByLabel","filter","and","or"]);
const buttonIds=[
  ["next lesson","#next"],["previous","#previous"],["reset repair","#repair-reset"],
  ["download .jl","#download-draft"],["compiler settings","#r2-utilities-open"],
  ["run current julia draft","#local-runner-run"],
  ["disable jdoodle and reload for local execution","#local-runner-disable-embed"],
  ["reset experiment","#num-reset"],["next step","#elim-next"],
  ["use least-squares fit","#fit-apply"],["last","#elim-end"]
];
function roleName(opts){
  return typeof opts?.name==="string"?opts.name.toLowerCase().replace(/[←→↗]/g,"").trim():null;
}
function roleTarget(page,role,opts){
  const name=roleName(opts);
  if(role==="button"&&name==="run current julia draft"&&page.viewportSize()?.width<768)
    return page.locator("#r2-mobile-next");
  if(role==="button"&&(name?.startsWith("continue lesson")||
     (opts?.name instanceof RegExp&&opts.name.source.startsWith("Continue lesson"))))
    return page.locator("#r2-hero-continue");
  const mapping=role==="button"&&buttonIds.find(([key])=>key===name);
  if(mapping)return page.locator(mapping[1]);
  return page.getByRole(role,{...opts,includeHidden:true});
}
async function showCanonical(page,locator) {
  const info=await locator.first().evaluate(el=>{
    const activity=el.closest(".r2-activity");
    const stage=activity?.id?.replace("r2-stage-","")||null;
    const lab=el.closest(".r2-lab")?.id||null;
    const question=el.closest(".question");
    const questionIndex=question?[...question.parentElement.children].indexOf(question):null;
    const mixedTask=el.closest(".rehearsal-item");
    const mixedIndex=mixedTask?[...mixedTask.parentElement.children].indexOf(mixedTask):null;
    const closed=[];
    for(let parent=el.parentElement;parent;parent=parent.parentElement)
      if(parent.tagName==="DETAILS"&&!parent.open){
        closed.unshift([...document.querySelectorAll("details")].indexOf(parent));
      }
    let view=null;
    if(el.closest("#r2-course"))view="course";
    else if(el.closest("#r2-mixed"))view="mixed";
    else if(el.closest("#r2-utilities"))view="utilities";
    return {stage,lab,questionIndex,mixedIndex,closed,view};
  });
  if(info.view==="course" && !(await page.locator("#r2-course").isVisible()))
    await page.locator("#r2-course-open").click();
  if(info.view==="mixed" && !(await page.locator("#r2-mixed").isVisible()))
    await page.locator("#r2-mixed-open").click();
  if(info.mixedIndex!==null&&info.mixedIndex>=0){
    let current=Number((await page.locator("#r2-mixed-progress").innerText()).match(/\d+/)?.[0]||1)-1;
    while(current<info.mixedIndex){await page.locator("#r2-mixed-next").click();current++;}
    while(current>info.mixedIndex){await page.locator("#r2-mixed-prev").click();current--;}
  }
  if(info.view==="utilities" && !(await page.locator("#r2-utilities").isVisible()))
    await page.locator("#r2-utilities-open").click();
  if(info.stage) {
    if(!(await page.locator("#lesson-main").isVisible())){
      const id=await page.locator("#lesson-jump").inputValue();
      await page.locator("#r2-course-open").click();
      await page.locator('.lesson-link[href="#lesson/'+id+'"]').click();
    }
    const tab=page.locator('button[data-r2-stage="'+info.stage+'"]');
    if(await tab.getAttribute("aria-pressed")!=="true") await tab.click();
    if(info.lab) {
      const labChoice=page.locator("#r2-lab-choice");
      if(await labChoice.inputValue()!==info.lab)await labChoice.selectOption(info.lab);
    }
    if(info.questionIndex!==null && info.questionIndex>=0){
      let current=Number((await page.locator("#r2-question-index").innerText()).match(/\d+/)?.[0]||1)-1;
      while(current<info.questionIndex){await page.locator("#r2-question-next").click();current++;}
      while(current>info.questionIndex){await page.locator("#r2-question-prev").click();current--;}
    }
  }
  // Open existing real disclosures, outermost first; never force hidden content
  // or alter grading/state from a test.
  for(const originalIndex of info.closed){
    const disclosure=page.locator("details").nth(originalIndex);
    if(!(await disclosure.evaluate(el=>el.open))){
      await disclosure.locator(":scope > summary").click();
    }
  }
}
function wrap(page,target){
  return new Proxy(target,{get(locator,name){
    const member=locator[name];
    if(typeof member!=="function")return member;
    if(name==="isVisible")return async(...args)=>{
      // An existing lab was previously always on-screen. R2 makes it
      // reachable through the Explore picker; test that real route first.
      const lab=await locator.first().evaluate(el=>{
        const parent=el.closest(".r2-lab");
        const eligible=el===parent||el.id==="compiler-panel";
        return {eligible:!!eligible, available:parent?!parent.hidden:true};
      });
      if(lab.eligible&&lab.available)await showCanonical(page,locator);
      return member.apply(locator,args);
    };
    if(browserActions.has(name))return async(...args)=>{
      await showCanonical(page,locator);
      return member.apply(locator,args);
    };
    if(childLocators.has(name))return (...args)=>wrap(page,member.apply(locator,args));
    return member.bind(locator);
  }});
}
export function r2Locator(page,selector,...args){return wrap(page,page.locator(selector,...args));}
export function r2Role(page,role,opts){return wrap(page,roleTarget(page,role,opts));}
