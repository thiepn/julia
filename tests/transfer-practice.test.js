import test from "node:test";
import assert from "node:assert/strict";
import {lessons} from "../src/lessons.js";
import {transferCases,transferForLesson} from "../src/transfer-cases.js";
import {readTransferDraft,writeTransferDraft,clearTransferDraft} from "../src/transfer-drafts.js";
import {readDraft,writeDraft,MAX_DRAFT_LENGTH} from "../src/workspace.js";
const createStorage=()=>{
  const map=new Map();
  return {map,getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
};
test("32 transfer tasks align exactly with 16 canonical course lessons",()=>{
  assert.equal(lessons.length,16);
  assert.deepEqual(Object.keys(transferCases).sort(),lessons.map(l=>l.id).sort());
  for(const l of lessons){
    const a=transferForLesson(l.id,"a"),b=transferForLesson(l.id,"b");
    assert.equal(a.id,l.id+"-a");
    assert.equal(b.id,l.id+"-b");
    assert.notEqual(a.task,b.task);
    for(const p of [a,b]){
      assert.ok(p.title.length>4);
      assert.ok(p.task.length>55);
      assert.ok(p.starter.length>5);
      assert.ok(p.checks.length>3);
      assert.ok(p.plan.length>15);
      assert.ok(p.verify.length>15);
      assert.notEqual(p.task,l.challenge);
      assert.ok(!/^\s*println\(\d+\)\s*$/.test(p.starter));
    }
  }
});
test("lesson and transfer drafts persist independently, including intentional empty source",()=>{
  const store=createStorage();
  const lesson=lessons[0];
  assert.equal(writeDraft(lesson.id,"println(:original)",store),true);
  assert.equal(readTransferDraft(lesson.id,"a","starter a",store),"starter a");
  assert.equal(readTransferDraft(lesson.id,"b","starter b",store),"starter b");
  assert.equal(writeTransferDraft(lesson.id,"a","println(:independent_a)",store),true);
  assert.equal(writeTransferDraft(lesson.id,"b","",store),true);
  assert.equal(readDraft(lesson.id,"unused",store),"println(:original)");
  assert.equal(readTransferDraft(lesson.id,"a","unused",store),"println(:independent_a)");
  assert.equal(readTransferDraft(lesson.id,"b","nonempty starter",store),"");
  assert.ok([...store.map.keys()].some(k=>k.includes("transfer-draft:v1:01:a")));
  assert.equal(clearTransferDraft(lesson.id,"a",store),true);
  assert.equal(readTransferDraft(lesson.id,"a","starter a",store),"starter a");
  assert.equal(readTransferDraft(lesson.id,"b","unused",store),"");
  assert.equal(readDraft(lesson.id,"unused",store),"println(:original)");
});
test("switching across lessons never reads another lesson's transfer draft",()=>{
  const store=createStorage();
  assert.equal(writeTransferDraft("01","a","one",store),true);
  assert.equal(writeTransferDraft("02","a","two",store),true);
  assert.equal(writeTransferDraft("01","b","three",store),true);
  assert.equal(readTransferDraft("02","a","",store),"two");
  assert.equal(readTransferDraft("01","b","",store),"three");
  assert.equal(readTransferDraft("01","a","",store),"one");
  assert.equal(clearTransferDraft("02","a",store),true);
  assert.equal(readTransferDraft("01","a","",store),"one");
});
test("reject invalid lesson, variant, object keys, sizes, and unavailable storage",()=>{
  const store=createStorage();
  for(const [lesson,variant] of [["17","a"],["00","a"],["01","original"],["01","c"],["constructor","a"],["__proto__","a"],["01","__proto__"]]){
    assert.equal(transferForLesson(lesson,variant),null);
    assert.equal(writeTransferDraft(lesson,variant,"x",store),false);
    assert.equal(clearTransferDraft(lesson,variant,store),false);
  }
  assert.equal(writeTransferDraft("01","a","x".repeat(MAX_DRAFT_LENGTH+1),store),false);
  assert.equal(writeTransferDraft("01","a",null,store),false);
  const denied={getItem(){throw Error("denied")},setItem(){throw Error("denied")},removeItem(){throw Error("denied")}};
  assert.equal(readTransferDraft("01","a","starter",denied),"starter");
  assert.equal(writeTransferDraft("01","a","x",denied),false);
  assert.equal(clearTransferDraft("01","a",denied),false);
});
