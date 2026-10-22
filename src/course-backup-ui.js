import {captureCourse,previewCourseRestore,restoreCourse} from "./course-backup.js";
export function initCourseBackup({doc=document,download,isEmbedActive=()=>true,disableEmbed=()=>{}}={}){
 if(typeof download!=="function")throw Error("Backup requires the canonical local download.");
 const el=id=>doc.getElementById(id),status=el("course-backup-status"),input=el("course-backup-file");
 const preview=el("course-backup-preview"),choice=el("course-backup-mode"),approval=el("course-backup-approval");
 const blocked=isEmbedActive();
 let text=null;
 const show=msg=>{status.textContent=msg;};
 for(const id of ["course-backup-export","course-backup-file","course-backup-mode","course-backup-approval","course-backup-restore"]){
   el(id).disabled=blocked;
 }
 el("course-backup-disable-embed").hidden=!blocked;
 el("course-backup-disable-embed").addEventListener("click",disableEmbed);
 if(blocked)show("Disable JDoodle and reload before exporting or restoring private course data.");
 el("course-backup-export").addEventListener("click",()=>{
   try{
     const snapshot=captureCourse();
     download({filename:"AMP-Julia-course-backup-v1.json",
       mime:"application/json;charset=utf-8",content:JSON.stringify(snapshot,null,2)+"\n"});
     show(Object.keys(snapshot.entries).length+" course records exported to a local JSON file. No remote upload.");
   }catch(e){show("Backup not created: "+String(e.message||e));}
 });
 input.addEventListener("change",async()=>{
   const file=input.files?.[0];text=null;preview.textContent="";approval.checked=false;
   el("course-backup-restore").disabled=true;
   if(!file)return;
   if(file.size>2_000_000){show("Backup file exceeds 2 MB.");return;}
   try{
     const source=await file.text();
     if(input.files?.[0]!==file)return;
     const p=previewCourseRestore(source);
     text=source;
     preview.textContent=p.total+" canonical records; "+p.missing.length+" new, "+
       p.conflicts.length+" conflict(s), "+p.identical.length+" unchanged.";
     el("course-backup-restore").disabled=blocked;
     show("Review the counts and choose what to do with existing local records.");
   }catch(e){show("Cannot import this backup: "+String(e.message||e));}
 });
 el("course-backup-restore").addEventListener("click",()=>{
   if(!text){show("Select a valid course backup first.");return;}
   const mode=choice.value;
   if(mode==="replace"&&!approval.checked){show("Confirm replacing conflicting local drafts and answers.");return;}
   try{
     const result=restoreCourse(text,{mode});
     show(result.written+" records restored; "+result.skipped+" left unchanged. Reloading to read restored progress.");
     // Existing app keeps progress in memory: reload to avoid overwriting newer imported data.
     doc.defaultView.location.reload();
   }catch(e){show("Restore failed: "+String(e.message||e));}
 });
 return {blocked};
}
