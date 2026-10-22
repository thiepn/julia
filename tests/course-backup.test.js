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
