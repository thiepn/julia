// Phase 09: portable Julia input on the single canonical editor.
// Pure caret manipulation; callers dispatch the original editor's input
// event so existing lesson/variant ownership and storage rules remain intact.
export const JULIA_TOUCH_KEYS=Object.freeze([
  Object.freeze({key:"indent",label:"Tab",prefix:"    ",suffix:"",description:"Insert four spaces"}),
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
  const selection=textarea.value.slice(start,end);
  const replacement=choice.prefix+selection+choice.suffix;
  const candidate=textarea.value.slice(0,start)+replacement+textarea.value.slice(end);
  // Same byte ceiling as the existing saved Julia draft. Never silently
  // replace a local draft with an oversized snippet that would fail storage.
  if(new TextEncoder().encode(candidate).length>50000)return false;
  textarea.setRangeText(replacement,start,end,"end");
  if(choice.suffix){
    const first=start+choice.prefix.length;
    textarea.setSelectionRange(first,first+selection.length);
  }
  textarea.dispatchEvent(new textarea.ownerDocument.defaultView.Event("input",{bubbles:true}));
  textarea.focus({preventScroll:true});
  return true;
}
