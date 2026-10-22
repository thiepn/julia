import test from "node:test";
import assert from "node:assert/strict";
import {createSemesterRehearsal,SEMESTER_AREAS} from "../src/semester-rehearsal.js";
import {lessons} from "../src/lessons.js";
import {PROOF_SCAFFOLDS} from "../src/completion-proofs.js";
import {completionTrack} from "../src/completion-tracks.js";

test("mixed rehearsal covers precisely the three official AMP areas with one proof and coding task each",()=>{
  assert.equal(SEMESTER_AREAS.length,3);
  const tasks=createSemesterRehearsal(31);
  assert.equal(tasks.length,6);
  assert.deepEqual([...new Set(tasks.map(t=>t.area))],SEMESTER_AREAS.map(t=>t.id));
  for(const area of SEMESTER_AREAS){
    assert.equal(tasks.filter(t=>t.area===area.id&&t.kind==="proof").length,1);
    assert.equal(tasks.filter(t=>t.area===area.id&&t.kind==="coding").length,1);
  }
});
test("rehearsal references original lesson tasks and preserves their identity",()=>{
  const lessonIds=new Set(lessons.map(l=>l.id));
  for(let seed=0;seed<80;seed++){
    const tasks=createSemesterRehearsal(seed);
    assert.equal(new Set(tasks.map(t=>t.id)).size,6);
    for(const task of tasks){
      assert.ok(lessonIds.has(task.lesson),task.id);
      assert.ok(task.title&&task.topic&&task.prompt&&task.context&&task.steps.length&&task.followup);
      if(task.kind==="proof"){
        const original=PROOF_SCAFFOLDS.find(p=>p.id===task.id);
        assert.ok(original);
        assert.equal(task.prompt,original.target);
        assert.deepEqual(task.steps,original.steps);
      }else{
        const original=completionTrack(task.id);
        assert.ok(original);
        assert.equal(task.prompt,original.question);
        assert.deepEqual(task.steps,original.steps);
      }
    }
  }
});
test("seeded sets are reproducible, variable, and reject invalid values",()=>{
  assert.deepEqual(createSemesterRehearsal(77),createSemesterRehearsal(77));
  const distinct=new Set(Array.from({length:25},(_,i)=>createSemesterRehearsal(i).map(t=>t.id).join("|")));
  assert.ok(distinct.size>=4);
  for(const bad of [-1,1.5,Number.NaN,Number.POSITIVE_INFINITY])assert.throws(()=>createSemesterRehearsal(bad),RangeError);
});
