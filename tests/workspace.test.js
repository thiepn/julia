import test from "node:test";
import assert from "node:assert/strict";
import {MAX_DRAFT_LENGTH, readDraft, writeDraft, clearDraft} from "../src/workspace.js";

function memory(){
  const map = new Map();
  return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
}
test("per-lesson saved code is isolated and empty drafts are meaningful",()=>{
  const storage=memory();
  assert.equal(readDraft("01","starter",storage),"starter");
  assert.equal(writeDraft("01","print(1)",storage),true);
  assert.equal(writeDraft("02","",storage),true);
  assert.equal(readDraft("01","starter",storage),"print(1)");
  assert.equal(readDraft("02","other starter",storage),"");
  assert.equal(clearDraft("01",storage),true);
  assert.equal(readDraft("01","starter",storage),"starter");
  assert.equal(readDraft("02","other starter",storage),"");
});
test("storage or invalid input never becomes a false saved state",()=>{
  const storage=memory();
  assert.equal(writeDraft("../../../01","evil",storage),false);
  assert.equal(writeDraft("01",42,storage),false);
  assert.equal(writeDraft("01","x".repeat(MAX_DRAFT_LENGTH+1),storage),false);
  assert.equal(readDraft("invalid","safe",storage),"safe");
  assert.equal(clearDraft("invalid",storage),false);
});
test("storage permission failures do not cause loss of current editable content",()=>{
  const denied={getItem(){throw new Error("denied")},setItem(){throw new Error("denied")},removeItem(){throw new Error("denied")}};
  assert.equal(readDraft("01","starter",denied),"starter");
  assert.equal(writeDraft("01","real code",denied),false);
  assert.equal(clearDraft("01",denied),false);
});
