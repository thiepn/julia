import test from "node:test";
import assert from "node:assert/strict";
import {lessons, stages} from "../src/lessons.js";
import {validateEmbedUrl, checkChoice, countCorrect, readyForChallenge,
  checkPastedOutput, readProgress, writeProgress, readEmbedUrl, writeEmbedUrl, DEFAULT_EMBED_URL} from "../src/checks.js";

test("16 source-grounded lessons with 48 distinct multiple-choice checks", () => {
  assert.equal(lessons.length,16);
  assert.equal(stages.length,3);
  assert.equal(new Set(lessons.map(l=>l.id)).size,16);
  assert.deepEqual(lessons.map(l=>l.id),Array.from({length:16},(_,i)=>String(i+1).padStart(2,"0")));
  for(const l of lessons){
    assert.equal(l.questions.length,3,l.id);
    assert.equal(l.hints.length,3,l.id);
    assert.ok(l.title && l.goal && l.theory && l.source && l.challenge && l.starter && l.checks,l.id);
    for(const q of l.questions) {
      assert.equal(q.choices.length,4,l.id);
      assert.ok(Number.isInteger(q.correct) && q.correct>=0 && q.correct<4,l.id);
      assert.ok(q.q && q.hint,l.id);
      assert.equal(new Set(q.choices).size,4,l.id);
    }
  }
});
test("correct answers and feedback calculations are stable for all lessons",()=>{
  for(const l of lessons){
    l.questions.forEach((q,i)=>{
      assert.ok(checkChoice(l,i,q.correct));
      for(let j=0;j<4;j++)if(j!==q.correct)assert.equal(checkChoice(l,i,j),false);
    });
    assert.equal(countCorrect(l,{}),0);
    assert.equal(readyForChallenge(l,{}),false);
    const two={[l.id+":0"]:l.questions[0].correct,[l.id+":1"]:l.questions[1].correct};
    assert.equal(countCorrect(l,two),2);
    assert.equal(readyForChallenge(l,two),true);
  }
});
test("embed configuration accepts only exact JDoodle embed URLs",()=>{
  assert.equal(validateEmbedUrl("https://www.jdoodle.com/embed/v1/abc_DE-9"),true);
  for(const bad of [
    "","http://www.jdoodle.com/embed/v1/abc",
    "https://jdoodle.com/embed/v1/abc",
    "https://www.jdoodle.com/online-compiler-julia",
    "https://www.jdoodle.com/embed/v1/abc?token=secret",
    "https://www.jdoodle.com.embed.example/embed/v1/abc",
    "javascript:alert(1)",
    "https://www.jdoodle.com@attacker.invalid/embed/v1/abc",
    "https://www.jdoodle.com/embed/v1/../admin"
  ]) assert.equal(validateEmbedUrl(bad),false,bad);
});
test("code-output checking does not give unjustified grading",()=>{
  assert.equal(checkPastedOutput("14"," 14\n").status,"matches");
  assert.equal(checkPastedOutput("[4, 10]"," [4,10] ").status,"matches");
  assert.equal(checkPastedOutput("0.0","1e-14").status,"matches");
  assert.equal(checkPastedOutput("14","16").status,"differs");
  assert.equal(checkPastedOutput("14","").status,"missing");
  assert.equal(checkPastedOutput(null,"plot").status,"visual");
  assert.match(checkPastedOutput("14","14").message,/not proof/i);
});
test("malformed progress is safely ignored; valid data persists",()=>{
  const memory=new Map([["amp-julia-lab:v1","{"]]);
  const storage={getItem:key=>memory.has(key)?memory.get(key):null,setItem:(key,v)=>memory.set(key,v),removeItem:key=>memory.delete(key)};
  assert.deepEqual(readProgress(storage),{});
  const progress={"01:0":2,"01:1":1};
  assert.equal(writeProgress(progress,storage),true);
  assert.deepEqual(readProgress(storage),progress);
  assert.equal(readEmbedUrl(storage),DEFAULT_EMBED_URL);
  assert.equal(validateEmbedUrl(DEFAULT_EMBED_URL),true);
  assert.equal(writeEmbedUrl("https://www.jdoodle.com/embed/v1/test",storage),true);
  assert.equal(readEmbedUrl(storage),"https://www.jdoodle.com/embed/v1/test");
  assert.equal(writeEmbedUrl("javascript:alert(1)",storage),false);
  assert.equal(readEmbedUrl(storage),"https://www.jdoodle.com/embed/v1/test");
  assert.equal(writeEmbedUrl("",storage),true);
  assert.equal(readEmbedUrl(storage),"");
  assert.equal(writeEmbedUrl(null,storage),true);
  assert.equal(readEmbedUrl(storage),DEFAULT_EMBED_URL);
});
