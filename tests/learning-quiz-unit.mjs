import assert from "node:assert/strict";
import {lessons} from "../src/lessons.js";
import {LEARNING_QUIZZES,QUIZ_KINDS,LEARNING_QUIZ_STORAGE_KEY,
  quizForLesson,gradeQuizAnswer,readQuizAnswers,writeQuizAnswer} from "../src/learning-quiz.js";

assert.deepEqual(Object.keys(LEARNING_QUIZZES),["01","02","03"]);
const seen=new Set();
for(const lesson of lessons.slice(0,3)){
 const items=quizForLesson(lesson.id);
 assert.equal(items.length,5,lesson.id+" must offer five distinct formats");
 assert.deepEqual(items.map(q=>q.kind),QUIZ_KINDS);
 for(const q of items){
   assert.ok(!seen.has(q.id));seen.add(q.id);
   assert.ok(q.id.startsWith(lesson.id+"-"));
   for(const field of ["prompt","code","hint","verifySource","expectedOutput"]){
     assert.equal(typeof q[field],"string",q.id+" "+field);
     assert.ok(q[field].trim().length>=(field==="expectedOutput"?1:4),q.id+" "+field);
   }
   if(q.kind==="numeric"){
     assert.equal(typeof q.answer,"number");
     assert.equal(q.correctFeedback.length>40,true);
     assert.equal(q.wrongFeedback.length>40,true);
     assert.deepEqual(gradeQuizAnswer(q,String(q.answer)),{
       valid:true,correct:true,feedback:q.correctFeedback
     });
     assert.equal(gradeQuizAnswer(q,"not a number").valid,false);
     assert.equal(gradeQuizAnswer(q,"0x10").valid,false);
     assert.equal(gradeQuizAnswer(q,"1e10").valid,false);
     assert.equal(gradeQuizAnswer(q,String(q.answer+1)).correct,false);
   }else{
     assert.equal(q.choices.length,4);
     assert.equal(q.feedback.length,4);
     assert.equal(new Set(q.choices).size,4,"Unique options "+q.id);
     assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4);
     q.choices.forEach((choice,index)=>{
       assert.ok(choice.trim().length>0,q.id+" choice "+index);
       assert.ok(q.feedback[index].length>=28,q.id+" feedback "+index);
       const result=gradeQuizAnswer(q,String(index));
       assert.equal(result.valid,true);
       assert.equal(result.correct,index===q.correct,q.id+" choice "+index);
       assert.equal(result.feedback,q.feedback[index]);
     });
     assert.equal(gradeQuizAnswer(q,"99").valid,false);
   }
 }
}
assert.equal(quizForLesson("04"),null);
assert.equal(seen.size,15);
// Storage remains independent of original course MCQ, drafts and backup keys.
const data=new Map([["amp-julia-lab:v1",'{"01:0":2}'],["amp-julia-lab:draft:v1:01","old learner draft"]]);
const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
assert.deepEqual(readQuizAnswers(storage),{});
const q=quizForLesson("01")[0];
let result=writeQuizAnswer(q,"0",storage);
assert.equal(result.correct,false);assert.equal(result.saved,true);
result=writeQuizAnswer(q,String(q.correct),storage);
assert.equal(result.correct,true);
assert.deepEqual(readQuizAnswers(storage),{[q.id]:String(q.correct)});
assert.equal(data.get("amp-julia-lab:v1"),'{"01:0":2}');
assert.equal(data.get("amp-julia-lab:draft:v1:01"),"old learner draft");
const numeric=quizForLesson("02")[4];
assert.equal(writeQuizAnswer(numeric,"abc",storage).saved,false);
assert.equal(writeQuizAnswer(numeric,String(numeric.answer),storage).saved,true);
assert.equal(readQuizAnswers(storage)[numeric.id],String(numeric.answer));
data.set(LEARNING_QUIZ_STORAGE_KEY,"not json");assert.deepEqual(readQuizAnswers(storage),{});
data.set(LEARNING_QUIZ_STORAGE_KEY,'{"bad":"10","01-predict":"1","02-numeric":"11","01-numeric":"not-number"}');
assert.deepEqual(readQuizAnswers(storage),{"01-predict":"1","02-numeric":"11"});
const denied={getItem(){throw Error("Denied");},setItem(){throw Error("Denied");}};
assert.deepEqual(readQuizAnswers(denied),{});
assert.equal(writeQuizAnswer(q,"1",denied).saved,false);
console.log("L3 QUIZ SCHEMA PASS 15 authored questions, five kinds, truthful answers, corruption protection and legacy storage");
