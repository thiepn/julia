import test from "node:test";
import assert from "node:assert/strict";
import {insertJuliaTouchKey,JULIA_TOUCH_KEYS} from "../src/touch-code.js";

function editor(value,start=value.length,end=start){
  let inputs=0,focused=0;
  const el={value,selectionStart:start,selectionEnd:end,disabled:false,readOnly:false,
    ownerDocument:{defaultView:{Event:class{constructor(type,opts){this.type=type;this.bubbles=opts.bubbles;}}}},
    setRangeText(replacement,a,b){
      this.value=this.value.slice(0,a)+replacement+this.value.slice(b);
      this.selectionStart=this.selectionEnd=a+replacement.length;
    },
    setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b;},
    dispatchEvent(event){assert.equal(event.type,"input");assert.equal(event.bubbles,true);inputs++;},
    focus(opts){assert.equal(opts.preventScroll,true);focused++;},
    get effects(){return {inputs,focused};}
  };
  return el;
}
test("Phase 09 keys cover Julia coding punctuation with distinct accessible labels",()=>{
  assert.equal(JULIA_TOUCH_KEYS.length,8);
  assert.equal(new Set(JULIA_TOUCH_KEYS.map(item=>item.key)).size,8);
  assert.ok(JULIA_TOUCH_KEYS.every(x=>x.description&&x.label&&x.prefix));
});
test("wrap a selected Julia argument, keeping its selection and one canonical input event",()=>{
  const el=editor("f(x+1)",2,5);
  assert.equal(insertJuliaTouchKey(el,"brackets"),true);
  assert.equal(el.value,"f([x+1])");
  assert.deepEqual([el.selectionStart,el.selectionEnd],[3,6]);
  assert.deepEqual(el.effects,{inputs:1,focused:1});
});
test("create an empty paired expression with the caret between brackets",()=>{
  const el=editor("y = ",4,4);
  assert.equal(insertJuliaTouchKey(el,"parens"),true);
  assert.equal(el.value,"y = ()");
  assert.deepEqual([el.selectionStart,el.selectionEnd],[5,5]);
});
test("indent and type-annotation insert at the original caret without deleting nearby source",()=>{
  const el=editor("function f(x)\nend",14,14);
  assert.equal(insertJuliaTouchKey(el,"indent"),true);
  assert.equal(insertJuliaTouchKey(el,"double-colon"),true);
  assert.equal(el.value,"function f(x)\n    ::end");
  assert.equal(el.effects.inputs,2);
});
test("fail closed for unknown keys, disabled and read-only editors and 50 kB drafts",()=>{
  const el=editor("code");
  assert.equal(insertJuliaTouchKey(el,"unknown"),false);
  assert.equal(el.effects.inputs,0);
  el.disabled=true;
  assert.equal(insertJuliaTouchKey(el,"end"),false);
  el.disabled=false;el.readOnly=true;
  assert.equal(insertJuliaTouchKey(el,"end"),false);
  el.readOnly=false;el.value="ä".repeat(25000);el.selectionStart=el.selectionEnd=25000;
  assert.equal(insertJuliaTouchKey(el,"colon"),false);
  assert.equal(el.value.length,25000);
  assert.equal(el.effects.inputs,0);
});
