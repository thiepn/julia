import test from "node:test";
import assert from "node:assert/strict";
import {lessons} from "../src/lessons.js";
import {repairs, repairForLesson} from "../src/repair-cases.js";
import {readRepair, writeRepair, clearRepair, compareRepairText} from "../src/repair-workspace.js";
import {MAX_DRAFT_LENGTH} from "../src/workspace.js";

function memory(){
  const data=new Map();
  return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
}
test("16 distinct AMP debug exercises align exactly to original lesson identities",()=>{
  assert.equal(repairs.length,lessons.length);
  assert.deepEqual(repairs.map(r=>r.id),lessons.map(l=>l.id));
  for(const r of repairs){
    assert.equal(repairForLesson(r.id),r);
    assert.ok(r.title && r.objective && r.expected && r.cause);
    assert.ok(r.hints.length===2 && r.hints.every(h=>h.length>=25));
    assert.ok(r.broken.length>=30 && r.reference.length>=30);
    assert.notEqual(r.broken,r.reference,r.id);
    assert.equal(compareRepairText(r.reference,r.reference).matches,true);
    assert.equal(compareRepairText(r.broken,r.reference).matches,false,r.id);
  }
});
test("repair drafts persist across lessons without touching canonical quiz or challenge keys",()=>{
  const storage=memory();
  const first=repairs[0],second=repairs[1];
  assert.equal(readRepair(first.id,first.broken,storage),first.broken);
  assert.equal(writeRepair(first.id,"println(123)",storage),true);
  assert.equal(writeRepair(second.id,"",storage),true);
  assert.equal(readRepair(first.id,first.broken,storage),"println(123)");
  assert.equal(readRepair(second.id,second.broken,storage),"");
  assert.equal(clearRepair(first.id,storage),true);
  assert.equal(readRepair(first.id,first.broken,storage),first.broken);
  assert.equal(readRepair(second.id,second.broken,storage),"");
});
test("repair comparison is only textual and never an execution verdict",()=>{
  assert.deepEqual(compareRepairText("x=1\r\nprintln(x) \r\n","x=1\nprintln(x)"),{matches:true});
  assert.deepEqual(compareRepairText("x=1\nprintln(x+0)","x=1\nprintln(x)"),{matches:false});
  assert.deepEqual(compareRepairText(null,"x=1"),{matches:false});
});
test("unavailable storage and oversized text are fail-closed",()=>{
  const unavailable={getItem(){throw Error("denied")},setItem(){throw Error("denied")},removeItem(){throw Error("denied")}};
  const example=repairs[0];
  assert.equal(readRepair(example.id,example.broken,unavailable),example.broken);
  assert.equal(writeRepair(example.id,example.reference,unavailable),false);
  assert.equal(clearRepair(example.id,unavailable),false);
  const storage=memory();
  assert.equal(writeRepair("17","println(1)",storage),false);
  assert.equal(writeRepair("../01","println(1)",storage),false);
  assert.equal(writeRepair("01","x".repeat(MAX_DRAFT_LENGTH+1),storage),false);
  assert.equal(readRepair("17","sentinel",storage),"sentinel");
});

test("plot repair keeps original conceptual contrast and writes an inspectable local figure",()=>{
  const plot=repairForLesson("04");
  assert.match(plot.broken,/plot\(x, x; label=/);
  assert.match(plot.reference,/plot!\(x, x; label=/);
  for(const code of [plot.broken,plot.reference]){
    assert.match(code,/savefig\("repair-curves\.png"\)/);
    assert.match(code,/Plots\.current\(\)\.series_list/);
    assert.match(code,/series=/);
  }
});
