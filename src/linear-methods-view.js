import {METHOD_CASES,analyzeMethods,methodsJuliaSource} from "./linear-methods.js";
const by=id=>document.getElementById(id);
const fmt=x=>x===null||!Number.isFinite(x)?"—":Math.abs(x)<1e-12&&x!==0?x.toExponential(3):String(Number(x.toPrecision(8)));
function cell(tr,text,tag="td"){
 const element=document.createElement(tag);element.textContent=text;tr.append(element);
}
function update(){
 const id=by("linear-method-case").value,data=analyzeMethods(id);
 const body=by("linear-method-data");body.replaceChildren();
 data.rows.forEach((row,i)=>{const tr=document.createElement("tr");cell(tr,String(i+1),"th");cell(tr,fmt(row.x));cell(tr,fmt(row.y));body.append(tr);});
 const output=by("linear-method-results");output.replaceChildren();
 for(const [name,result] of [["Householder QR",data.qr],["Normal equations",data.normal]]){
   const tr=document.createElement("tr");
   cell(tr,name,"th");
   if(result){
     cell(tr,"["+result.coefficients.map(fmt).join(", ")+"]");
     cell(tr,fmt(result.residual));
     cell(tr,fmt(result.normalOrthogonality));
   }else{
     cell(tr,"No unique binary64 solve");cell(tr,"—");cell(tr,"—");
   }
   output.append(tr);
 }
 by("linear-method-rank").textContent=data.qrRank===2?"Two numerically independent columns":"Rank-deficient at comparison tolerance";
 by("linear-method-caution").textContent=data.caution;
 by("linear-method-julia").textContent=methodsJuliaSource(id);
 by("linear-method-status").textContent="";
}
export function initLinearMethods(){
 const select=by("linear-method-case");
 select.replaceChildren();
 for(const [id,entry] of Object.entries(METHOD_CASES)){
   const option=document.createElement("option");option.value=id;option.textContent=entry.label;select.append(option);
 }
 select.addEventListener("change",update);
 by("linear-method-copy").addEventListener("click",async()=>{
   try{
     await navigator.clipboard.writeText(methodsJuliaSource(select.value));
     by("linear-method-status").textContent="Julia comparison copied.";
   }catch{by("linear-method-status").textContent="Clipboard unavailable. Select and copy the displayed Julia source.";}
 });
 update();
}
export function showLinearMethods(lesson){
 by("linear-methods").hidden=lesson!=="15";
}
