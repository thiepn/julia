import test from "node:test";
import assert from "node:assert/strict";
import {lessons} from "../src/lessons.js";
import {feedbackByLesson, questionFeedback} from "../src/feedback.js";
import {readyForChallenge} from "../src/checks.js";

test("all 48 AMP concept questions have original reason and actionable retry prompts",()=>{
  assert.equal(Object.keys(feedbackByLesson).length,16);
  let questions=0;
  for(const lesson of lessons) {
    const entries=feedbackByLesson[lesson.id];
    assert.equal(entries?.length,3,lesson.id);
    for(let i=0;i<3;i++){
      const entry=entries[i], question=lesson.questions[i];
      assert.equal(entry.length,2,lesson.id+":"+i);
      for(const sentence of entry) {
        assert.ok(sentence.length>=25,lesson.id+":"+i);
        assert.equal(/You did great|Keep going|Congratulations/i.test(sentence),false);
      }
      const correct=questionFeedback(lesson,i,question.correct);
      assert.deepEqual(correct,{correct:true,explanation:entry[0],codingVerified:false});
      for(let j=0;j<question.choices.length;j++)if(j!==question.correct) {
        assert.deepEqual(questionFeedback(lesson,i,j),{correct:false,explanation:entry[1],codingVerified:false});
      }
      questions++;
    }
  }
  assert.equal(questions,48);
});
test("answer feedback rejects bad indices and never changes code mastery",()=>{
  const first=lessons[0];
  assert.equal(questionFeedback(first,4,1),null);
  assert.equal(questionFeedback(first,0,-1),null);
  assert.equal(questionFeedback(first,0,4),null);
  assert.equal(questionFeedback(first,0,1.5),null);
  assert.equal(questionFeedback(null,0,1),null);
  const practice={"01:0":2,"01:1":1};
  assert.equal(readyForChallenge(first,practice),true);
  assert.equal(questionFeedback(first,0,0).codingVerified,false);
});
