// Static browser ZIP packaging for AMP submissions. No backend and no new dependency.
const enc = new TextEncoder();
const MAX_PDF = 10 * 1024 * 1024;
const MAX_ARCHIVE = 45 * 1024 * 1024;
const MAX_FILES = 40;
const CRC_TABLE = Uint32Array.from({length:256},(_,n)=>{
  let c=n;
  for(let i=0;i<8;i++) c=(c&1)?0xedb88320^(c>>>1):c>>>1;
  return c>>>0;
});
export function crc32(bytes){
  let crc=0xffffffff;
  for(const value of bytes) crc=CRC_TABLE[(crc^value)&255]^(crc>>>8);
  return (crc^0xffffffff)>>>0;
}
export function filenameStem({name,number,task}){
  if(typeof name!=="string"||!/^[A-Za-z][A-Za-z0-9_-]{1,39}$/.test(name.trim()))
    throw Error("Enter a filename name (2–40 Latin letters, numbers, _ or -; start with a letter).");
  if(typeof number!=="string"||!/^[0-9]{5,12}$/.test(number.trim()))
    throw Error("Enter a 5–12 digit matriculation number.");
  if(typeof task!=="string"||!/^(1|2)\.[1-9][0-9]?([a-z])?$/i.test(task.trim()))
    throw Error("Enter an Übung 1 or 2 task, e.g. 1.2 or 2.2b.");
  const t=task.trim().toLowerCase().replace(".","-");
  return name.trim()+"_"+number.trim()+"_Aufgabe-"+t;
}
export function worksheetFromTask(task){
  if(typeof task!=="string"||!/^[12]\./.test(task))throw Error("Unknown worksheet.");
  return Number(task[0]);
}
export async function verifyPdf(file){
  if(!file||typeof file.slice!=="function"||!Number.isFinite(file.size)||file.size<100||file.size>MAX_PDF)
    throw Error("Select a PDF between 100 bytes and 10 MB.");
  if(typeof file.name!=="string"||!/\.pdf$/i.test(file.name))
    throw Error("Select the saved .pdf code document.");
  const header=new Uint8Array(await file.slice(0,8).arrayBuffer());
  if(new TextDecoder().decode(header).slice(0,5)!=="%PDF-")
    throw Error("Selected file does not contain a PDF header.");
  const end=new TextDecoder("latin1").decode(await file.slice(-2048).arrayBuffer());
  if(!/%%EOF(?:\s|$)/.test(end))
    throw Error("Selected PDF is missing an end-of-file marker.");
  return file;
}
function pathOk(path){
  return typeof path==="string"&&path.length<=240&&path.split("/").every(part=>
    /^[A-Za-z0-9][A-Za-z0-9_.-]{0,119}$/.test(part)&&part!==".."&&part!==".");
}
async function bytesOf(content){
  if(content instanceof Uint8Array)return content;
  if(typeof content==="string")return enc.encode(content);
  if(content&&typeof content.arrayBuffer==="function")return new Uint8Array(await content.arrayBuffer());
  throw Error("Unsupported bundle content.");
}
export async function makeZip(files){
  if(!Array.isArray(files)||files.length===0||files.length>MAX_FILES)throw Error("ZIP requires 1–40 files.");
  const items=[],seen=new Set();
  let total=22;
  for(const file of files){
    if(!pathOk(file?.path)||seen.has(file.path.toLowerCase()))throw Error("Unsafe or duplicate ZIP filename.");
    seen.add(file.path.toLowerCase());
    const pathBytes=enc.encode(file.path),data=await bytesOf(file.content);
    if(data.length===0||data.length>MAX_PDF)throw Error("Individual ZIP file exceeds size limit or is empty.");
    const crc=crc32(data);
    total+=30+pathBytes.length+data.length+46+pathBytes.length;
    if(total>MAX_ARCHIVE)throw Error("Submission ZIP exceeds 45 MB.");
    items.push({pathBytes,data,crc});
  }
  const out=new Uint8Array(total),view=new DataView(out.buffer);
  let offset=0;
  const w16=(p,v)=>view.setUint16(p,v,true),w32=(p,v)=>view.setUint32(p,v>>>0,true);
  const centers=[];
  for(const item of items){
    const start=offset,n=item.pathBytes.length,len=item.data.length;
    w32(offset,0x04034b50);w16(offset+4,20);w16(offset+6,0x0800);
    w16(offset+8,0);w16(offset+10,0);w16(offset+12,0);
    w32(offset+14,item.crc);w32(offset+18,len);w32(offset+22,len);
    w16(offset+26,n);w16(offset+28,0);
    out.set(item.pathBytes,offset+30);
    out.set(item.data,offset+30+n);
    offset+=30+n+len;
    centers.push({...item,start});
  }
  const centralStart=offset;
  for(const item of centers){
    const n=item.pathBytes.length,len=item.data.length;
    w32(offset,0x02014b50);w16(offset+4,20);w16(offset+6,20);
    w16(offset+8,0x0800);w16(offset+10,0);w16(offset+12,0);w16(offset+14,0);
    w32(offset+16,item.crc);w32(offset+20,len);w32(offset+24,len);
    w16(offset+28,n);w16(offset+30,0);w16(offset+32,0);
    w16(offset+34,0);w16(offset+36,0);w32(offset+38,0);w32(offset+42,item.start);
    out.set(item.pathBytes,offset+46);
    offset+=46+n;
  }
  const centralSize=offset-centralStart;
  w32(offset,0x06054b50);w16(offset+4,0);w16(offset+6,0);
  w16(offset+8,centers.length);w16(offset+10,centers.length);
  w32(offset+12,centralSize);w32(offset+16,centralStart);w16(offset+20,0);
  if(offset+22!==out.length)throw Error("ZIP length mismatch.");
  return out;
}
export async function bundleEntries(pairs){
  if(!Array.isArray(pairs)||pairs.length===0||pairs.length>8)
    throw Error("Add between 1 and 8 code/PDF pairs.");
  const files=[];
  for(const pair of pairs){
    if(typeof pair?.stem!=="string"||!pathOk(pair.stem)||typeof pair.code!=="string"||!pair.code.trim())
      throw Error("Invalid staged Julia source.");
    await verifyPdf(pair.pdf);
    files.push({path:pair.stem+".jl",content:pair.code});
    files.push({path:pair.stem+".pdf",content:pair.pdf});
    if(pair.results){
      if(typeof pair.results.output==="string"&&pair.results.output.trim()){
        files.push({path:"results/"+pair.stem+"-run.txt",content:pair.results.output});
      }
      const figures=pair.results.figures||[];
      if(figures.length>3)throw Error("Too many output figures.");
      for(let index=0;index<figures.length;index++){
        const fig=figures[index];
        const extension=fig.type==="image/png"?"png":fig.type==="image/svg+xml"?"svg":null;
        if(!extension)throw Error("Unsupported figure in output.");
        files.push({path:"results/"+pair.stem+"-figure-"+(index+1)+"."+extension,content:fig.blob});
      }
    }
  }
  return files;
}
