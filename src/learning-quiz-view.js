import {quizForLesson,gradeQuizAnswer,readQuizAnswers,writeQuizAnswer} from "./learning-quiz.js";

// Presentation for source-authored questions. Only compares stored answers to an answer key.
// Never evaluates Julia code, and never modifies canonical MCQ progress.
export function initLearningQuizView({doc,mount}){
  const el=(tag,className,textContent)=>{
    const x=doc.createElement(tag);
    if(className)x.className=className;
    if(textContent!==undefined)x.textContent=textContent;
    return x;
  };
  const title=el("h2",null,"Applied Julia quiz"),
    overview=el("p","r2-extra-overview","Choose an answer or enter a number. These checks assess understanding, not executable Julia code."),
    status=el("p","r2-extra-progress"),
    nav=el("nav","r2-extra-nav"),
    typeLabel=el("p","r2-extra-type"),
    questionTitle=el("h3","r2-extra-title"),
    pre=el("pre","r2-extra-source"),code=el("code"),
    choices=el("div","r2-extra-choices"),
    numeric=el("form","r2-extra-numeric"),
    numericLabel=el("label",null,"Your numeric answer"),
    numericInput=el("input"),
    submit=el("button",null,"Check answer"),
    hint=el("details","r2-extra-hint"),
    hintTitle=el("summary",null,"Hint"),
    hintBody=el("p"),
    feedback=el("p","r2-extra-feedback"),
    footer=el("div","r2-extra-footer"),
    previous=el("button",null,"Previous"),
    next=el("button",null,"Next question");
  mount.id="r2-extra-quiz";
  title.id="r2-extra-title-heading";
  status.id="r2-extra-progress";status.setAttribute("role","status");
  nav.id="r2-extra-nav";typeLabel.id="r2-extra-type";
  nav.setAttribute("aria-label","Applied question navigation");
  questionTitle.id="r2-extra-question";
  pre.append(code);code.id="r2-extra-code";
  choices.setAttribute("role","group");choices.setAttribute("aria-labelledby","r2-extra-question");
  numericLabel.htmlFor="r2-extra-input";
  numericInput.id="r2-extra-input";numericInput.name="answer";
  numericInput.type="text";numericInput.inputMode="decimal";numericInput.autocomplete="off";
  numericInput.maxLength=40;
  submit.type="submit";numeric.append(numericLabel,numericInput,submit);
  hint.append(hintTitle,hintBody);
  feedback.id="r2-extra-feedback";feedback.setAttribute("role","status");feedback.setAttribute("aria-live","polite");
  previous.type="button";next.type="button";
  footer.append(previous,next);
  mount.append(title,overview,status,nav,typeLabel,questionTitle,pre,choices,numeric,hint,feedback,footer);
  mount.setAttribute("aria-labelledby","r2-extra-title-heading");
  let lessonId=null,questionIndex=0;
  const storage=()=>{
    try{return doc.defaultView.localStorage;}
    catch{return {getItem(){throw Error("Storage unavailable");},setItem(){throw Error("Storage unavailable");}};}
  };
  const currentItems=()=>quizForLesson(lessonId)||[];
  const labels={predict:"Predict output",order:"Order statements",
    debug:"Find the error",complete:"Complete expression",numeric:"Numeric answer"};
  function presentResult(result){
    feedback.dataset.status=result.correct?"correct":"retry";
    feedback.textContent=(result.correct?"Correct. ":"Try again. ")+result.feedback+
      (result.saved===false?" Answer not saved locally.":"");
  }
  function render(){
    const items=currentItems();
    mount.hidden=!items.length;
    if(!items.length)return;
    const answers=readQuizAnswers(storage());
    const correct=items.filter(item=>answers[item.id]!==undefined&&
      gradeQuizAnswer(item,answers[item.id]).correct).length;
    status.textContent=correct+" of "+items.length+" correct · practice only, not a code grade";
    questionIndex=Math.max(0,Math.min(questionIndex,items.length-1));
    const item=items[questionIndex];
    nav.replaceChildren();
    for(const [i,entry] of items.entries()){
      const button=el("button",null,String(i+1).padStart(2,"0"));
      button.type="button";button.dataset.question=entry.id;
      button.setAttribute("aria-current",i===questionIndex?"step":"false");
      button.setAttribute("aria-label","Applied question "+(i+1)+": "+labels[entry.kind]);
      button.addEventListener("click",()=>{questionIndex=i;render();});
      nav.append(button);
    }
    typeLabel.textContent=(questionIndex+1)+"/"+items.length+" · "+labels[item.kind];
    questionTitle.textContent=item.prompt;
    code.textContent=item.code;
    choices.replaceChildren();
    const isNumeric=item.kind==="numeric";
    numeric.hidden=!isNumeric;choices.hidden=isNumeric;
    const prior=answers[item.id];
    if(isNumeric)numericInput.value=prior??"";
    else for(const [i,label] of item.choices.entries()){
      const button=el("button","r2-extra-choice",label);
      button.type="button";button.dataset.choice=String(i);
      button.setAttribute("aria-pressed",String(prior===String(i)));
      button.addEventListener("click",()=>{
        const result=writeQuizAnswer(item,String(i),storage());
        render();presentResult(result);
      });
      choices.append(button);
    }
    hintBody.textContent=item.hint;hint.open=false;
    feedback.textContent="";feedback.dataset.status="";
    if(prior!==undefined){
      const result=gradeQuizAnswer(item,prior);
      if(result.valid)presentResult({...result,saved:true});
    }
    previous.disabled=questionIndex===0;
    next.disabled=questionIndex===items.length-1;
    next.textContent=questionIndex===items.length-1?"End of quiz":"Next question";
  }
  numeric.addEventListener("submit",event=>{
    event.preventDefault();
    const item=currentItems()[questionIndex];
    if(item?.kind!=="numeric")return;
    const result=writeQuizAnswer(item,numericInput.value,storage());
    if(!result.valid){
      feedback.dataset.status="invalid";feedback.textContent=result.feedback;
      return;
    }
    render();presentResult(result);
  });
  previous.addEventListener("click",()=>{questionIndex--;render();});
  next.addEventListener("click",()=>{questionIndex++;render();});
  return {showLesson(id){
    if(lessonId!==id){lessonId=id;questionIndex=0;}
    render();
  }};
}
