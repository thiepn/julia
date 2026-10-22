// Portable snapshot of CANONICAL AMP browser data. No embed settings, runner tokens or identity.
import {transferForLesson} from "./transfer-cases.js";
import {missionForLesson} from "./numerical-missions.js";
import {integrationForLesson} from "./integration-task.js";
import {TRACE_CASES} from "./program-trace-model.js";
import {MAX_DRAFT_LENGTH} from "./workspace.js";
const COURSE_PREFIX="amp-julia-lab:";
const MAX_BACKUP=2_000_000;
const LESSON=/^(0[1-9]|1[0-6])$/;
function allowedKey(key){
 if(key===COURSE_PREFIX+"v1")return true;
 let m=/^amp-julia-lab:(?:draft|repair):v1:(0[1-9]|1[0-6])$/.exec(key);
 if(m)return true;
 m=/^amp-julia-lab:trace:v1:([a-z_]+)$/.exec(key);
 if(m)return Object.hasOwn(TRACE_CASES,m[1]);
 m=/^amp-julia-lab:transfer-draft:v1:(0[1-9]|1[0-6]):(a|b|mission|integration)$/.exec(key);
 if(!m)return false;
 const [,_key,variant]=m;
 return Boolean(variant==="mission"?missionForLesson(_key):
   variant==="integration"?integrationForLesson(_key):transferForLesson(_key,variant));
}
function validValue(key,value){
 if(typeof value!=="string"||value.length>MAX_DRAFT_LENGTH)return false;
 if(key===COURSE_PREFIX+"v1"){
   try{
     const p=JSON.parse(value);
     return !!p&&typeof p==="object"&&!Array.isArray(p)&&
       Object.keys(p).length<=48&&Object.entries(p).every(([id,selected])=>
       /^(0[1-9]|1[0-6]):[0-2]$/.test(id)&&Number.isInteger(selected)&&selected>=0&&selected<=3);
   }catch{return false;}
 }
 if(key.startsWith(COURSE_PREFIX+"trace:v1:")){
   try{const pos=JSON.parse(value);return Number.isInteger(pos)&&pos>=0&&pos<=20;}
   catch{return false;}
 }
 return true;
}
export function captureCourse(storage=globalThis.localStorage){
 const values={};
 for(let i=0;i<storage.length;i++){
   const key=storage.key(i);
   if(allowedKey(key)){
     const value=storage.getItem(key);
     if(!validValue(key,value))throw Error("Canonical course value is invalid: "+key);
     values[key]=value;
   }
 }
 const record={schema:"amp-julia-course-backup",version:1,entries:Object.fromEntries(Object.entries(values).sort(([a],[b])=>a.localeCompare(b)))};
 if(JSON.stringify(record).length>MAX_BACKUP)throw Error("Course backup exceeds 2 MB.");
 return record;
}
export function parseCourseBackup(text){
 if(typeof text!=="string"||text.length>MAX_BACKUP)throw Error("Backup is too large.");
 let value;
 try{value=JSON.parse(text);}catch{throw Error("Backup is not valid JSON.");}
 if(!value||typeof value!=="object"||Array.isArray(value)||
    value.schema!=="amp-julia-course-backup"||value.version!==1||
    !value.entries||typeof value.entries!=="object"||Array.isArray(value.entries))
   throw Error("Unsupported course backup format.");
 const entries=value.entries;
 if(Object.keys(entries).length>100||!Object.entries(entries).every(([k,v])=>allowedKey(k)&&validValue(k,v)))
   throw Error("Backup contains an unknown or invalid course record.");
 return Object.fromEntries(Object.entries(entries).sort(([a],[b])=>a.localeCompare(b)));
}
export function previewCourseRestore(text,storage=globalThis.localStorage){
 const entries=parseCourseBackup(text),conflicts=[],missing=[],identical=[];
 for(const [key,value] of Object.entries(entries)){
   const current=storage.getItem(key);
   if(current===null)missing.push(key);
   else if(current===value)identical.push(key);
   else conflicts.push(key);
 }
 return {total:Object.keys(entries).length,missing,conflicts,identical};
}
export function restoreCourse(text,{storage=globalThis.localStorage,mode="keep"}={}){
 if(!["keep","replace"].includes(mode))throw Error("Choose keep existing or replace conflicts.");
 const entries=parseCourseBackup(text),preview=previewCourseRestore(text,storage);
 const writes=Object.entries(entries).filter(([key,value])=>
   storage.getItem(key)===null||(mode==="replace"&&storage.getItem(key)!==value));
 const original=new Map();
 try{
   for(const [key,value] of writes){
     original.set(key,storage.getItem(key));
     storage.setItem(key,value);
   }
 }catch(err){
   let rollbackFailure=false;
   for(const [key,previous] of original){
     try{if(previous===null)storage.removeItem(key);else storage.setItem(key,previous);}
     catch{rollbackFailure=true;}
   }
   throw Error(rollbackFailure?"Restore failed and rollback was incomplete; review your local data.":"Restore failed; original values were restored.");
 }
 return {written:writes.length,skipped:preview.total-writes.length,conflicts:preview.conflicts.length,mode};
}
