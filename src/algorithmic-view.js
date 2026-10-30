import {ALGORITHM_UNITS,readAlgorithmAnswers,writeAlgorithmAnswer,
 gradeAlgorithmCheck} from "./algorithmic-learning.js";

// Adapt authored L5 algorithm traces to the existing purely presentational learning control.
// The data stores, question IDs and saved answers are independent from L4.
const FUNDAMENTALS=ALGORITHM_UNITS.map(unit=>({
 ...unit,concepts:[unit.invariant],
 examples:unit.examples.map(ex=>({...ex,steps:ex.trace,why:ex.reason,trap:ex.pitfall})),
 checks:unit.checks.map(q=>({...q,options:q.choices,answer:q.correct}))
}));
const readFundamentalsAnswers=readAlgorithmAnswers;
const writeFundamentalsAnswer=writeAlgorithmAnswer;
const gradeFundamentalsCheck=gradeAlgorithmCheck;

// L4 reads authored sources only. No JS evaluation, Julia compilation, or new grading of old MCQs.
export function initAlgorithmView({doc,mount}){
 const make=(tag,className,text)=>{const n=doc.createElement(tag);
  if(className)n.className=className.replaceAll("r2-algorithms","r2-fundamentals");if(text!==undefined)n.textContent=text;return n;};
 mount.id="r2-algorithms";mount.classList.add("r2-fundamentals");mount.setAttribute("aria-labelledby","r2-algorithms-title");
 const heading=make("h2",null,"Algorithmic problem-solving");heading.id="r2-algorithms-title";
 const pickerLabel=make("label",null,"Topic");pickerLabel.htmlFor="r2-algorithms-topic";
 const picker=make("select");picker.id="r2-algorithms-topic";
 for(const unit of FUNDAMENTALS){const option=make("option",null,unit.title);option.value=unit.id;picker.append(option);}
 const selector=make("div","r2-algorithms-picker");selector.append(pickerLabel,picker);
 const unitHeading=make("h3");unitHeading.id="r2-algorithms-unit";
 const concepts=make("ul","r2-algorithms-concepts");
 const prose=make("div","r2-algorithms-explanation");
 const exampleHeading=make("h4",null,"Worked algorithms");
 const exampleNav=make("nav","r2-algorithms-example-nav");
 exampleNav.setAttribute("aria-label","Choose fundamentals example");
 const exampleTitle=make("h5");exampleTitle.id="r2-algorithms-example-title";
 const source=make("pre","r2-algorithms-source");const sourceCode=make("code");sourceCode.id="r2-algorithms-code";source.append(sourceCode);
 const output=make("details","r2-algorithms-output");output.append(make("summary",null,"Reveal expected output"));
 const outPre=make("pre");const outCode=make("code");outCode.id="r2-algorithms-stdout";
 outPre.append(outCode);output.append(outPre);
 const exampleSteps=make("ol","r2-algorithms-steps");
 const whyTitle=make("h5",null,"Why it works"),why=make("p");why.id="r2-algorithms-why";
 const trapTitle=make("h5",null,"Common mistake"),trap=make("p");trap.id="r2-algorithms-trap";
 const quizHeading=make("h4",null,"Reasoning checks");
 const quizProgress=make("p","r2-algorithms-progress");quizProgress.id="r2-algorithms-progress";
 const checks=make("div","r2-algorithms-checks");
 const intro=make("section","r2-algorithms-intro");intro.append(unitHeading,prose,concepts);
 const worked=make("section","r2-algorithms-worked");
 worked.append(exampleHeading,exampleNav,exampleTitle,source,output,exampleSteps,whyTitle,why,trapTitle,trap);
 const tested=make("section","r2-algorithms-tested");tested.append(quizHeading,quizProgress,checks);
 mount.append(heading,selector,intro,worked,tested);
 let currentLesson="01";
 const stores=()=>{try{return doc.defaultView.localStorage;}catch{
  return {getItem(){throw Error("Storage denied");},setItem(){throw Error("Storage denied");}};}};
 const lessonTopic={"01":"contracts","02":"vector-scans","03":"vector-scans",
  "04":"root-finding","05":"root-finding","06":"matrix-methods","07":"invariants",
  "08":"invariants","09":"numerical-safety","10":"matrix-methods","11":"matrix-methods",
  "12":"matrix-methods","13":"numerical-safety","14":"matrix-methods",
  "15":"root-finding","16":"numerical-safety"};
 function renderCheck(unit){
  const saved=readFundamentalsAnswers(stores());
  quizProgress.textContent=unit.checks.filter(q=>saved[q.id]!==undefined&&gradeFundamentalsCheck(q,saved[q.id]).correct)
   .length+" of "+unit.checks.length+" correct · conceptual check, not code execution";
  checks.replaceChildren();
  for(const [i,q] of unit.checks.entries()){
   const card=make("section","r2-algorithms-question");
   const qTitle=make("h5",null,(i+1)+". "+q.prompt);qTitle.id="r2-algorithms-q-"+i;
   const codeBlock=make("pre","r2-algorithms-source");
   codeBlock.append(make("code",null,q.code));
   const opts=make("div","r2-algorithms-options");opts.setAttribute("role","group");
   opts.setAttribute("aria-labelledby",qTitle.id);
   const response=make("p","r2-algorithms-feedback");response.setAttribute("role","status");
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
    const button=make("button","r2-algorithms-option",option);
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
   const hint=make("details","r2-algorithms-hint");hint.append(make("summary",null,"Hint"),make("p",null,q.hint));
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
