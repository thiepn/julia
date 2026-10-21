import test from "node:test";
import assert from "node:assert/strict";
import {inspectEmbedMessage, JDOODLE_ORIGIN} from "../src/jdoodle-bridge.js";

const url = "https://www.jdoodle.com/embed/v1/d74ec9cf98a1b5b";
function mockFrame(source={}, src=url){
  return {tagName:"IFRAME",isConnected:true,contentWindow:source,getAttribute:k=>k==="src"?src:null};
}
test("JDoodle diagnostic admits only exact frame origin, source and configured path",()=>{
  const frame=mockFrame();
  const event={origin:JDOODLE_ORIGIN,source:frame.contentWindow,data:{type:"pym:height",code:"private",output:"private"}};
  assert.deepEqual(inspectEmbedMessage(event,frame,url),{
    format:"object",marker:"pym:height",verifiedOrigin:true,executionVerified:false
  });
  assert.equal(inspectEmbedMessage({...event,origin:"https://evil.example"},frame,url),null);
  assert.equal(inspectEmbedMessage({...event,source:{}},frame,url),null);
  assert.equal(inspectEmbedMessage(event,mockFrame(frame.contentWindow,"https://www.jdoodle.com/embed/v1/other-key"),url),null);
  assert.equal(inspectEmbedMessage(event,mockFrame(frame.contentWindow,"https://evil.example/embed/v1/d74ec9cf98a1b5b"),url),null);
  assert.equal(inspectEmbedMessage(event,{...frame,isConnected:false},url),null);
  assert.equal(inspectEmbedMessage(event,frame,""),null);
});
test("real JDoodle onLoad key is recognized only as an unverified lifecycle message",()=>{
  const frame=mockFrame();
  const event={origin:JDOODLE_ORIGIN,source:frame.contentWindow,data:{onLoad:true,output:"SENSITIVE_DATA"}};
  const parsed=inspectEmbedMessage(event,frame,url);
  assert.deepEqual(parsed,{format:"object",marker:"onLoad",verifiedOrigin:true,executionVerified:false});
  assert.equal(JSON.stringify(parsed).includes("SENSITIVE_DATA"),false);
});
test("diagnostic never treats result payloads as proven execution",()=>{
  const frame=mockFrame();
  const event={origin:JDOODLE_ORIGIN,source:frame.contentWindow,
    data:{type:"execution-output",output:"TOP_SECRET_CODE",status:"success"}};
  const result=inspectEmbedMessage(event,frame,url);
  assert.deepEqual(result,{format:"object",marker:"execution-output",verifiedOrigin:true,executionVerified:false});
  assert.equal(JSON.stringify(result).includes("TOP_SECRET"),false);
  assert.equal(inspectEmbedMessage({...event,data:{type:"println(private_data)"}},frame,url).marker,"unspecified");
  assert.equal(inspectEmbedMessage({...event,data:"secret output"},frame,url).marker,"unspecified");
});
