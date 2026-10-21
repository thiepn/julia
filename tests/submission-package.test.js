import test from "node:test";
import assert from "node:assert/strict";
import {crc32,filenameStem,worksheetFromTask,verifyPdf,makeZip,bundleEntries} from "../src/submission-package.js";
const decoder=new TextDecoder();
const examplePdf=Object.assign(new Blob([("%PDF-1.7\n"+"0".repeat(160)+"\n%%EOF\n")],{type:"application/pdf"}),{name:"code.pdf"});
function unzipStored(bytes){
  const data=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),result=new Map();
  let pos=0;
  while(data.getUint32(pos,true)===0x04034b50){
    assert.equal(data.getUint16(pos+8,true),0);
    const size=data.getUint32(pos+18,true),n=data.getUint16(pos+26,true),extra=data.getUint16(pos+28,true);
    const name=decoder.decode(bytes.subarray(pos+30,pos+30+n));
    const content=bytes.subarray(pos+30+n+extra,pos+30+n+extra+size);
    assert.equal(data.getUint32(pos+14,true),crc32(content),"ZIP CRC mismatch: "+name);
    result.set(name,content);pos+=30+n+extra+size;
  }
  assert.equal(data.getUint32(pos,true),0x02014b50,"Central directory header missing");
  assert.equal(data.getUint32(bytes.length-22,true),0x06054b50,"ZIP EOCD missing");
  assert.equal(data.getUint16(bytes.length-12,true),result.size);
  return result;
}
test("AMP filename rules require name, number and exercise identity without persistence",()=>{
  assert.equal(filenameStem({name:"Muster",number:"123456",task:"2.2b"}),"Muster_123456_Aufgabe-2-2b");
  assert.equal(worksheetFromTask("1.2"),1);
  assert.equal(worksheetFromTask("2.2b"),2);
  for(const v of ["../escape","", "A/../B", "X", "äntest"])
    assert.throws(()=>filenameStem({name:v,number:"123456",task:"2.2b"}));
  for(const v of ["12","123a56","1234567890123"])
    assert.throws(()=>filenameStem({name:"Muster",number:v,task:"2.2b"}));
  assert.throws(()=>filenameStem({name:"Muster",number:"123456",task:"3.7"}));
});
test("AMP PDF pairing rejects false, empty and truncated code PDFs",async()=>{
  await verifyPdf(examplePdf);
  await assert.rejects(verifyPdf(Object.assign(new Blob(["0".repeat(150)]),{name:"code.pdf"})),/header/);
  await assert.rejects(verifyPdf(Object.assign(new Blob(["%PDF-1.7\n"+"0".repeat(150)]),{name:"code.pdf"})),/end-of-file/);
  await assert.rejects(verifyPdf(Object.assign(new Blob(["%PDF-1.7\n"+"0".repeat(150)+"%%EOF"]),{name:"code.txt"})),/\.pdf/);
});
test("self-contained ZIP is standards-aligned, reproducible, CRC-valid and UTF-8 lossless",async()=>{
  const stem="Muster_123456_Aufgabe-2-2b",code='println("ε, α, π")\n# Erklärung\n';
  const pairs=[{stem,code,pdf:examplePdf,results:{
    output:"Julia execution (local; not graded)\nstdout:\nErgebnis = 42\n",
    figures:[{type:"image/png",blob:new Blob([new Uint8Array([137,80,78,71,13,10,26,10,0,1,2])],{type:"image/png"})}]
  }}];
  const items=await bundleEntries(pairs);
  const first=await makeZip(items),second=await makeZip(items);
  assert.deepEqual(first,second,"Deterministic ZIP assembly");
  const unpacked=unzipStored(first);
  assert.equal(unpacked.size,4);
  assert.equal(decoder.decode(unpacked.get(stem+".jl")),code);
  assert.match(decoder.decode(unpacked.get(stem+".pdf")),/%PDF-1\.7/);
  assert.match(decoder.decode(unpacked.get("results/"+stem+"-run.txt")),/Ergebnis/);
  assert.deepEqual(Array.from(unpacked.get("results/"+stem+"-figure-1.png").slice(0,8)),[137,80,78,71,13,10,26,10]);
});
test("ZIP refuses duplicates, traversal, oversized blobs and invalid empty source",async()=>{
  await assert.rejects(makeZip([{path:"../unsafe.jl",content:"x"}]),/Unsafe/);
  await assert.rejects(makeZip([{path:"same.jl",content:"a"},{path:"SAME.JL",content:"b"}]),/duplicate/);
  await assert.rejects(makeZip([{path:"empty.jl",content:""}]),/empty/);
  await assert.rejects(bundleEntries([{stem:"Muster_123456_Aufgabe-1-2",code:"",pdf:examplePdf}]),/Invalid/);
  await assert.rejects(makeZip([{path:"huge.txt",content:new Uint8Array(11*1024*1024)}]),/size/);
});
