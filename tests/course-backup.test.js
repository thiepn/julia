import test from "node:test";
import assert from "node:assert/strict";
import {captureCourse,previewCourseRestore,restoreCourse,parseCourseBackup} from "../src/course-backup.js";
class Store{
 constructor(values={}){this.data=new Map(Object.entries(values));this.block=null;}
 get length(){return this.data.size;}
 key(i){return [...this.data.keys()][i]??null;}
 getItem(key){return this.data.has(key)?this.data.get(key):null;}
 setItem(key,value){if(this.block===key)throw Error("quota");this.data.set(key,value);}
 removeItem(key){this.data.delete(key);}
}
const progress="amp-julia-lab:v1";
const key="amp-julia-lab:draft:v1:02",repair="amp-julia-lab:repair:v1:02";
test("only canonical study records enter a versioned course backup",()=>{
 const store=new Store({[progress]:'{"02:0":1}',[key]:'println("test")',
  "amp-julia-lab:jdoodle-embed-v1":"https://www.jdoodle.com/",
  "amp-julia-lab:secret-runner-token":"private",
  [repair]:"function x()\nend"});
 const record=captureCourse(store);
 assert.equal(record.version,1);
 assert.deepEqual(Object.keys(record.entries).sort(),[progress,key,repair].sort());
 const text=JSON.stringify(record);
 assert.ok(!text.includes("jdoodle")&&!text.includes("secret")&&!text.includes("private"));
 const restored=parseCourseBackup(text);
 assert.equal(restored[key],'println("test")');
});
test("preview supports no-overwrite by default and explicit replacement",()=>{
 const source=captureCourse(new Store({[key]:"saved", [progress]:'{"02:1":2}'}));
 const text=JSON.stringify(source);
 const destination=new Store({[key]:"more recent"});
 const preview=previewCourseRestore(text,destination);
 assert.deepEqual(preview.conflicts,[key]);
 assert.deepEqual(preview.missing,[progress]);
 const keep=restoreCourse(text,{storage:destination});
 assert.equal(keep.written,1);
 assert.equal(destination.getItem(key),"more recent");
 assert.equal(destination.getItem(progress),'{"02:1":2}');
 const replacement=restoreCourse(text,{storage:destination,mode:"replace"});
 assert.equal(replacement.written,1);
 assert.equal(destination.getItem(key),"saved");
});
test("invalid records and malicious paths cannot be restored or exported",()=>{
 const store=new Store();
 for(const entries of [
  {"amp-julia-lab:jdoodle-embed-v1":"url"},
  {"amp-julia-lab:secret":"token"},
  {[progress]:'{"03:0":999}'},
  {"amp-julia-lab:draft:v1:99":"x"},
  {"amp-julia-lab:transfer-draft:v1:02:invalid":"x"}
 ]){
  assert.throws(()=>parseCourseBackup(JSON.stringify({schema:"amp-julia-course-backup",version:1,entries})));
 }
 assert.throws(()=>parseCourseBackup('{"schema":"amp-julia-course-backup","version":4,"entries":{}}'));
 assert.throws(()=>parseCourseBackup("not JSON"));
 assert.throws(()=>restoreCourse("{}",{storage:store,mode:"invalid"}));
});
test("failed writes roll back restored values rather than silently losing data",()=>{
 const source=captureCourse(new Store({[key]:"backup",[repair]:"repair backup"}));
 const dest=new Store({[key]:"original"});
 dest.block=repair;
 assert.throws(()=>restoreCourse(JSON.stringify(source),{storage:dest,mode:"replace"}),/Restore failed/);
 assert.equal(dest.getItem(key),"original");
 assert.equal(dest.getItem(repair),null);
});

const learningSamples={
 "amp-julia-learn:quiz-v1":{"01-predict":"0"},
 "amp-julia-learn:fundamentals-v1":{"types-1":"0"},
 "amp-julia-learn:algorithms-v1":{"contracts-1":"0"},
 "amp-julia-learn:assessments-v1":{"quadrature-step-1":"0"},
 "amp-julia-learn:transfer-v1":{"nonuniform-step-1":"0"},
 "amp-julia-learn:variants-v1":{"quartic-estimate":"0"}
};
test("L11: v1 backup includes all six independent L3–L9 answer banks",()=>{
 const records=Object.fromEntries(Object.entries(learningSamples).map(([k,v])=>[k,JSON.stringify(v)]));
 const store=new Store({...records,[key]:"old canonical draft",
   "amp-julia-lab:secret-runner-token":"PRIVATE CANARY",
   "amp-julia-learn:private-note-v1":"PRIVATE NOTE"});
 const original=new Map(store.data);
 const backup=captureCourse(store);
 assert.equal(backup.version,1);
 assert.equal(backup.schema,"amp-julia-course-backup");
 assert.deepEqual(Object.keys(backup.entries).sort(),[...Object.keys(records),key].sort());
 const body=JSON.stringify(backup);
 assert.ok(!body.includes("PRIVATE CANARY")&&!body.includes("PRIVATE NOTE"));
 const recovered=parseCourseBackup(body);
 assert.deepEqual(recovered,backup.entries);
 assert.deepEqual(store.data,original,"capture is read-only");
 const destination=new Store();
 const result=restoreCourse(body,{storage:destination});
 assert.equal(result.written,7);
 for(const [k,v] of Object.entries(records))assert.equal(destination.getItem(k),v);
 assert.equal(destination.getItem(key),"old canonical draft");
 const older=JSON.stringify({schema:"amp-julia-course-backup",version:1,entries:{[key]:"historical draft"}});
 assert.equal(restoreCourse(older,{storage:new Store()}).written,1,"old v1 remains readable");
});
test("L11: new answer records reject unknown or invalid values",()=>{
 const cases=[
  {"amp-julia-learn:variants-v1":'{"unknown-question":"0"}'},
  {"amp-julia-learn:quiz-v1":'{"01-predict":"invalid"}'},
  {"amp-julia-learn:fundamentals-v1":'{"types-1":0}'},
  {"amp-julia-learn:algorithms-v1":'["0"]'},
  {"amp-julia-learn:transfer-v1":"bad-json"},
  {"amp-julia-learn:assessments-v1":'{"quadrature-step-1":"0","__proto__":"0"}'},
  {"amp-julia-learn:other-v1":'{"x":"0"}'}
 ];
 for(const entries of cases){
  const data={schema:"amp-julia-course-backup",version:1,entries};
  assert.throws(()=>parseCourseBackup(JSON.stringify(data)));
  if(Object.hasOwn(entries,"amp-julia-learn:other-v1")){
   assert.deepEqual(captureCourse(new Store(entries)).entries,{},"unknown local keys are ignored during export");
  }else{
   assert.throws(()=>captureCourse(new Store(entries)),"invalid recognized records must fail closed");
  }
 }
});
test("L11: new answers respect keep/replace and atomic rollback",()=>{
 const k="amp-julia-learn:variants-v1";
 const originalJSON=JSON.stringify(learningSamples[k]);
 const backup=JSON.stringify(captureCourse(new Store({[k]:originalJSON,[key]:"from backup"})));
 const destination=new Store({[k]:'{"quartic-estimate":"1"}',[key]:"current draft"});
 const preview=previewCourseRestore(backup,destination);
 assert.deepEqual(preview.conflicts.sort(),[k,key].sort());
 const keep=restoreCourse(backup,{storage:destination,mode:"keep"});
 assert.equal(keep.written,0);
 assert.equal(destination.getItem(k),'{"quartic-estimate":"1"}');
 assert.equal(destination.getItem(key),"current draft");
 destination.block=key;
 assert.throws(()=>restoreCourse(backup,{storage:destination,mode:"replace"}),/Restore failed/);
 assert.equal(destination.getItem(k),'{"quartic-estimate":"1"}',"L9 answer rolled back");
 assert.equal(destination.getItem(key),"current draft");
 destination.block=null;
 assert.equal(restoreCourse(backup,{storage:destination,mode:"replace"}).written,2);
 assert.equal(destination.getItem(k),originalJSON);
 assert.equal(destination.getItem(key),"from backup");
});
