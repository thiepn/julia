// Phase 09: portable Julia input on the single canonical editor.
// Pure caret manipulation; callers dispatch the original editor's input
// event so existing lesson/variant ownership and storage rules remain intact.
export const JULIA_TOUCH_KEYS=Object.freeze([
  Object.freeze({key:"indent",label:"Tab",prefix:"    ",suffix:"",description:"Indent selected Julia lines by four spaces"}),
  Object.freeze({key:"outdent",label:"⇤",prefix:"",suffix:"",description:"Remove up to four leading spaces from selected Julia lines"}),
  Object.freeze({key:"parens",label:"( )",prefix:"(",suffix:")",description:"Wrap selection in parentheses"}),
  Object.freeze({key:"brackets",label:"[ ]",prefix:"[",suffix:"]",description:"Wrap selection in square brackets"}),
  Object.freeze({key:"colon",label:":",prefix:":",suffix:"",description:"Insert colon"}),
  Object.freeze({key:"double-colon",label:"::",prefix:"::",suffix:"",description:"Insert type annotation"}),
  Object.freeze({key:"underscore",label:"_",prefix:"_",suffix:"",description:"Insert underscore"}),
  Object.freeze({key:"equals",label:"=",prefix:"=",suffix:"",description:"Insert equals sign"}),
  Object.freeze({key:"end",label:"end",prefix:"end",suffix:"",description:"Insert Julia end keyword"})
]);
const KEYS=new Map(JULIA_TOUCH_KEYS.map(item=>[item.key,item]));
export function insertJuliaTouchKey(textarea,key){
  const choice=KEYS.get(key);
  if(!choice||!textarea||textarea.readOnly||textarea.disabled)return false;
  const start=textarea.selectionStart,end=textarea.selectionEnd;
  if(!Number.isInteger(start)||!Number.isInteger(end)||end<start)return false;
  const value=textarea.value;
  let replaceFrom=start,replaceTo=end,replacement,selectionFrom,selectionTo;
  // Multiline indentation is a single undoable, canonical textarea edit.
  // Never use a second draft, paste buffer, or mirrored editor.
  if(key==="outdent"||(key==="indent"&&end>start)){
    replaceFrom=value.lastIndexOf("\n",start-1)+1;
    const endPosition=end>start&&value[end-1]==="\n"?end-1:end;
    const followingBreak=value.indexOf("\n",endPosition);
    replaceTo=followingBreak<0?value.length:followingBreak;
    const original=value.slice(replaceFrom,replaceTo);
    const lines=original.split("\n");
    replacement=lines.map(line=>{
      if(key==="indent")return "    "+line;
      if(line.startsWith("\t"))return line.slice(1);
      const spaces=/^ {1,4}/.exec(line)?.[0].length||0;
      return line.slice(spaces);
    }).join("\n");
    if(original===replacement)return false;
    if(start===end&&key==="outdent"){
      const removed=original.length-replacement.length;
      selectionFrom=selectionTo=Math.max(replaceFrom,start-removed);
    }else{
      // Select the complete edited block for another Tab/Outdent action.
      selectionFrom=replaceFrom;
      selectionTo=replaceFrom+replacement.length;
    }
  }else{
    const selection=value.slice(start,end);
    replacement=choice.prefix+selection+choice.suffix;
    selectionFrom=selectionTo=start+choice.prefix.length;
    if(choice.suffix)selectionTo=selectionFrom+selection.length;
    else selectionFrom=selectionTo=start+replacement.length;
  }
  const candidate=value.slice(0,replaceFrom)+replacement+value.slice(replaceTo);
  // Same byte ceiling as the existing saved Julia draft; oversized edits
  // must not mutate the editor, trigger a failed save, or discard source.
  if(new TextEncoder().encode(candidate).length>50000)return false;
  textarea.setRangeText(replacement,replaceFrom,replaceTo,"end");
  textarea.setSelectionRange(selectionFrom,selectionTo);
  textarea.dispatchEvent(new textarea.ownerDocument.defaultView.Event("input",{bubbles:true}));
  textarea.focus({preventScroll:true});
  return true;
}
