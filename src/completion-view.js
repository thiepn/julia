// Lesson-adjacent depth: uses the canonical editor and existing download action.
// No new saved progress, second runner, score or assignment-answer repository.
import {completionTracksForLesson,buildCompletionTests} from "./completion-tracks.js";
import {proofScaffoldsForLesson} from "./completion-proofs.js";
import {experimentsForLesson} from "./completion-experiments.js";
export function initCompletionDepth({doc=document,download,getDraft,runLocalTests,getIdentity}={}){
 if(typeof download!=="function"||typeof getDraft!=="function")throw Error("Depth practice requires canonical editor and download.");
 const by=id=>doc.getElementById(id),section=by("completion-depth");
 const trackSelect=by("completion-track-choice"),proofSelect=by("completion-proof-choice"),
       experimentSelect=by("completion-experiment-choice");
 const tracks=by("completion-tracks"),proofs=by("completion-proofs"),experiments=by("completion-experiments");
 let selectedLesson=null,currentTracks=[],currentProofs=[],currentExperiments=[];
 const options=(select,values)=>{
   select.replaceChildren();
   for(const [value,label] of values){
     const option=doc.createElement("option");option.value=value;option.textContent=label;select.append(option);
   }
 };
 const set=(id,text)=>{by(id).textContent=text;};
 const asList=(node,items)=>{
   node.replaceChildren();
   for(const item of items){const li=doc.createElement("li");li.textContent=item;node.append(li);}
 };
 function renderTrack(){
   const track=currentTracks.find(t=>t.id===trackSelect.value);
   if(!track)return;
   set("completion-track-description",track.concept);
   set("completion-track-source",track.source);
   set("completion-track-starter",track.starter);
   set("completion-track-question",track.question);
   asList(by("completion-track-steps"),track.steps);
   set("completion-track-status",track.checks.length
      ?track.checks.length+" independent Julia assertions available for the current editor draft."
      :"Exploration only; no automatic Julia assertions for this topic.");
   by("completion-test-download").disabled=!track.checks.length;
   by("completion-test-local-run").disabled=!track.checks.length;
   by("completion-test-local-status").textContent="";
   by("completion-test-local-output").textContent="";
 }
 function renderProof(){
   const proof=currentProofs.find(t=>t.id===proofSelect.value);
   if(!proof)return;
   set("completion-proof-source",proof.sourcePart);
   set("completion-proof-assumptions",proof.assumptions);
   set("completion-proof-target",proof.target);
   set("completion-proof-transfer",proof.transfer);
   set("completion-proof-warning",proof.notice);
   by("completion-proof-warning").hidden=!proof.notice;
   asList(by("completion-proof-steps"),proof.steps);
 }
 function renderExperiment(){
   const experiment=currentExperiments.find(e=>e.id===experimentSelect.value);
   if(!experiment)return;
   set("completion-experiment-intent",experiment.intent);
   set("completion-experiment-code",experiment.code);
   set("completion-experiment-status","Real Julia execution is required to observe the computed output.");
 }
 trackSelect.addEventListener("change",renderTrack);
 proofSelect.addEventListener("change",renderProof);
 experimentSelect.addEventListener("change",renderExperiment);
 by("completion-test-download").addEventListener("click",()=>{
   try{
     const track=currentTracks.find(t=>t.id===trackSelect.value);
     if(!track)throw Error("No practice selected.");
     const file=buildCompletionTests(track.id,getDraft());
     download(file);
     set("completion-track-status","Test source downloaded for the current Julia editor. It was not executed or graded in the browser.");
   }catch(err){set("completion-track-status",String(err.message||err));}
 });
 by("completion-test-local-run").addEventListener("click",async()=>{
   try{
     const track=currentTracks.find(t=>t.id===trackSelect.value);
     if(!track||!track.checks.length)throw Error("Select a Julia function exercise with tests.");
     if(typeof runLocalTests!=="function"||typeof getIdentity!=="function")throw Error("Local Julia companion is unavailable.");
     const id=track.id,lesson=selectedLesson,identity=getIdentity(),script=buildCompletionTests(id,getDraft());
     await runLocalTests({script,validFor:()=>selectedLesson===lesson&&
       trackSelect.value===id&&getIdentity()===identity,
       statusElement:by("completion-test-local-status"),
       outputElement:by("completion-test-local-output")});
   }catch(error){by("completion-test-local-status").textContent=String(error.message||error);}
 });
 by("completion-starter-copy").addEventListener("click",async()=>{
   const track=currentTracks.find(t=>t.id===trackSelect.value);
   if(!track)return;
   try{
     await doc.defaultView.navigator.clipboard.writeText(track.starter);
     set("completion-track-status","Starter copied. Paste into the existing Julia editor when ready.");
   }catch{set("completion-track-status","Clipboard unavailable. Select the visible starter source manually.");}
 });
 by("completion-experiment-download").addEventListener("click",()=>{
   const experiment=currentExperiments.find(t=>t.id===experimentSelect.value);
   if(!experiment)return;
   download({filename:"amp-experiment-"+experiment.id+".jl",mime:"text/plain;charset=utf-8",content:experiment.code+"\n"});
   set("completion-experiment-status","Julia experiment downloaded. Execute with your local Julia environment.");
 });
 return {showForLesson(id){
   selectedLesson=id;
   currentTracks=completionTracksForLesson(id);
   currentProofs=proofScaffoldsForLesson(id);
   currentExperiments=experimentsForLesson(id);
   section.hidden=!(currentTracks.length||currentProofs.length||currentExperiments.length);
   by("completion-test-local-status").textContent="";
   by("completion-test-local-output").textContent="";
   tracks.hidden=!currentTracks.length;
   proofs.hidden=!currentProofs.length;
   experiments.hidden=!currentExperiments.length;
   if(currentTracks.length){
     options(trackSelect,currentTracks.map(t=>[t.id,t.title]));renderTrack();
   }
   if(currentProofs.length){
     options(proofSelect,currentProofs.map(t=>[t.id,t.title]));renderProof();
   }
   if(currentExperiments.length){
     options(experimentSelect,currentExperiments.map(t=>[t.id,t.title]));renderExperiment();
   }
 }};
}
