import {MAX_DRAFT_LENGTH} from "./workspace.js";
const PREFIX="amp-julia-lab:repair:v1:";
function key(id){return typeof id==="string"&&/^(0[1-9]|1[0-6])$/.test(id)?PREFIX+id:null;}
export function readRepair(id, example, storage=globalThis.localStorage){
  try{const k=key(id);if(!k)return example;const value=storage.getItem(k);return value===null?example:value;}
  catch{return example;}
}
export function writeRepair(id, code, storage=globalThis.localStorage){
  const k=key(id);if(!k||typeof code!=="string"||code.length>MAX_DRAFT_LENGTH)return false;
  try{storage.setItem(k,code);return true;}catch{return false;}
}
export function clearRepair(id, storage=globalThis.localStorage){
  const k=key(id);if(!k)return false;
  try{storage.removeItem(k);return true;}catch{return false;}
}
// Text comparison only. Different code may be equally correct; no execution occurs.
export function compareRepairText(input,reference){
  if(typeof input!=="string"||typeof reference!=="string")return {matches:false};
  const normalized=t=>t.replace(/\r\n/g,"\n").split("\n").map(s=>s.trimEnd()).join("\n").trim();
  return {matches:normalized(input)===normalized(reference)};
}
