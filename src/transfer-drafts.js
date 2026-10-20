import {MAX_DRAFT_LENGTH} from "./workspace.js";
import {transferForLesson} from "./transfer-cases.js";
// Per-transfer code belongs to its own browser-local key; canonical lesson drafts are untouched.
const PREFIX="amp-julia-lab:transfer-draft:v1:";
function key(lesson,variant){
  return transferForLesson(lesson,variant)?PREFIX+lesson+":"+variant:null;
}
export function readTransferDraft(lesson,variant,starter="",storage=globalThis.localStorage){
  const k=key(lesson,variant);
  if(!k)return starter;
  try{
    const result=storage.getItem(k);
    return result===null?starter:result;
  }catch{return starter;}
}
export function writeTransferDraft(lesson,variant,code,storage=globalThis.localStorage){
  const k=key(lesson,variant);
  if(!k||typeof code!=="string"||code.length>MAX_DRAFT_LENGTH)return false;
  try{storage.setItem(k,code);return true;}catch{return false;}
}
export function clearTransferDraft(lesson,variant,storage=globalThis.localStorage){
  const k=key(lesson,variant);
  if(!k)return false;
  try{storage.removeItem(k);return true;}catch{return false;}
}
