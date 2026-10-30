import {FUNDAMENTALS,readFundamentalsAnswers,writeFundamentalsAnswer,
 gradeFundamentalsCheck} from "./fundamentals.js";

// L4 reads authored sources only. No JS evaluation, Julia compilation, or new grading of old MCQs.
export function initFundamentalsView({doc,mount}){
 const make=(tag,className,text)=>{const n=doc.createElement(tag);
  if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;};
 mount.id="r2-fundamentals";mount.setAttribute("aria-labelledby","r2-fundamentals-title");
 const heading=make("h2",null,"Julia fundamentals");heading.id="r2-fundamentals-title";
 const pickerLabel=make("label",null,"Topic");pickerLabel.htmlFor="r2-fundamentals-topic";
 const picker=make("select");picker.id="r2-fundamentals-topic";
 for(const unit of FUNDAMENTALS){const option=make("option",null,unit.title);option.value=unit.id;picker.append(option);}
 const selector=make("div","r2-fundamentals-picker");selector.append(pickerLabel,picker);
 const unitHeading=make("h3");unitHeading.id="r2-fundamentals-unit";
 const concepts=make("ul","r2-fundamentals-concepts");
 const prose=make("div","r2-fundamentals-explanation");
 const exampleHeading=make("h4",null,"Worked Julia examples");
 const exampleNav=make("nav","r2-fundamentals-example-nav");
 exampleNav.setAttribute("aria-label","Choose fundamentals example");
 const exampleTitle=make("h5");exampleTitle.id="r2-fundamentals-example-title";
 const source=make("pre","r2-fundamentals-source");const sourceCode=make("code");sourceCode.id="r2-fundamentals-code";source.append(sourceCode);
 const output=make("details","r2-fundamentals-output");output.append(make("summary",null,"Reveal expected output"));
 const outPre=make("pre");const outCode=make("code");outCode.id="r2-fundamentals-stdout";
 outPre.append(outCode);output.append(outPre);
 const exampleSteps=make("ol","r2-fundamentals-steps");
 const whyTitle=make("h5",null,"Why it works"),why=make("p");why.id="r2-fundamentals-why";
 const trapTitle=make("h5",null,"Common mistake"),trap=make("p");trap.id="r2-fundamentals-trap";
 const quizHeading=make("h4",null,"Check understanding");
 const quizProgress=make("p","r2-fundamentals-progress");quizProgress.id="r2-fundamentals-progress";
 const checks=make("div","r2-fundamentals-checks");
 const intro=make("section","r2-fundamentals-intro");intro.append(unitHeading,prose,concepts);
 const worked=make("section","r2-fundamentals-worked");
 worked.append(exampleHeading,exampleNav,exampleTitle,source,output,exampleSteps,whyTitle,why,trapTitle,trap);
 const tested=make("section","r2-fundamentals-tested");tested.append(quizHeading,quizProgress,checks);
 mount.append(heading,selector,intro,worked,tested);
 let currentLesson="01";
 const stores=()=>{try{return doc.defaultView.localStorage;}catch{
  return {getItem(){throw Error("Storage denied");},setItem(){throw Error("Storage denied");}};}};
 const lessonTopic={"01":"variables","02":"arrays","03":"broadcasting","07":"loops",
  "08":"functions","09":"types","10":"conditions","11":"arrays","12":"functions"};
 function renderCheck(unit){
  const saved=readFundamentalsAnswers(stores());
  quizProgress.textContent=unit.checks.filter(q=>saved[q.id]!==undefined&&gradeFundamentalsCheck(q,saved[q.id]).correct)
   .length+" of "+unit.checks.length+" correct · conceptual check, not code execution";
  checks.replaceChildren();
  for(const [i,q] of unit.checks.entries()){
   const card=make("section","r2-fundamentals-question");
   const qTitle=make("h5",null,(i+1)+". "+q.prompt);qTitle.id="r2-fundamentals-q-"+i;
   const codeBlock=make("pre","r2-fundamentals-source");
   codeBlock.append(make("code",null,q.code));
   const opts=make("div","r2-fundamentals-options");opts.setAttribute("role","group");
   opts.setAttribute("aria-labelledby",qTitle.id);
   const response=make("p","r2-fundamentals-feedback");response.setAttribute("role","status");
   response.setAttribute("aria-live","polite");
   function show(answer,savedOk){
    const result=gradeFundamentalsCheck(q,answer);
    response.dataset.status=result.correct?"correct":"retry";
    response.textContent=(result.correct?"Correct. ":"Try again. ")+result.feedback+
     (!savedOk?" Answer not saved locally.":"");
    for(const button of opts.children)button.setAttribute("aria-pressed",
      String(button.dataset.option===String(answer)));
   }
   q.options.forEach((option,index)=>{
    const button=make("button","r2-fundamentals-option",option);
    button.type="button";button.dataset.option=String(index);
    button.setAttribute("aria-pressed",String(saved[q.id]===String(index)));
    button.addEventListener("click",()=>{
     const result=writeFundamentalsAnswer(q,String(index),stores());
     show(String(index),result.saved);
     const progress=readFundamentalsAnswers(stores());
     quizProgress.textContent=unit.checks.filter(item=>progress[item.id]!==undefined&&
      gradeFundamentalsCheck(item,progress[item.id]).correct).length+
      " of "+unit.checks.length+" correct · conceptual check, not code execution";
    });
    opts.append(button);
   });
   const hint=make("details","r2-fundamentals-hint");hint.append(make("summary",null,"Hint"),make("p",null,q.hint));
   card.append(qTitle,codeBlock,opts,hint,response);checks.append(card);
   if(saved[q.id]!==undefined)show(saved[q.id],true);
  }
 }
 function renderChapter(){
  const unit=FUNDAMENTALS.find(item=>item.id===picker.value)||FUNDAMENTALS[0];
  unitHeading.textContent=unit.title;
  prose.replaceChildren(...unit.explain.split("\n\n").map(paragraph=>make("p",null,paragraph)));
  concepts.replaceChildren(...unit.concepts.map(concept=>make("li",null,concept)));
  exampleNav.replaceChildren();
  const selectExample=index=>{
   const ex=unit.examples[index];
   exampleTitle.textContent=ex.title;sourceCode.textContent=ex.code;
   outCode.textContent=ex.output;output.open=false;
   exampleSteps.replaceChildren(...ex.steps.map(step=>make("li",null,step)));
   why.textContent=ex.why;trap.textContent=ex.trap;
   for(const button of exampleNav.children)
    button.setAttribute("aria-pressed",String(Number(button.dataset.example)===index));
  };
  unit.examples.forEach((example,index)=>{
   const button=make("button",null,"Example "+(index+1));
   button.type="button";button.dataset.example=String(index);
   button.setAttribute("aria-label",example.title);
   button.addEventListener("click",()=>selectExample(index));
   exampleNav.append(button);
  });
  selectExample(0);renderCheck(unit);
 }
 picker.addEventListener("change",renderChapter);
 return {showLesson(id){
  if(currentLesson!==id){currentLesson=id;picker.value=lessonTopic[id]||"variables";}
  renderChapter();
 }};
}
