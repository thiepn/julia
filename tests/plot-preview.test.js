import test from "node:test";
import assert from "node:assert/strict";
import {checkPlotFile,hasPngSignature,validateSvgText} from "../src/plot-preview.js";
test("accept local figures and reject invalid size, extension and type",()=>{
  for(const [name,type] of [["output.PNG","image/png"],["output.svg","image/svg+xml"]])
    assert.equal(checkPlotFile({name,type,size:128}).ok,true);
  for(const candidate of [
    {name:"x.html",type:"text/html",size:100},
    {name:"x.svg",type:"text/html",size:100},
    {name:"x.png",type:"image/png",size:0},
    {name:"x.png",type:"image/png",size:6*1024*1024}
  ]) assert.equal(checkPlotFile(candidate).ok,false);
});
test("PNG magic number and SVG XML declarations are checked",()=>{
  assert.equal(hasPngSignature(Uint8Array.from([137,80,78,71,13,10,26,10])),true);
  assert.equal(hasPngSignature(Uint8Array.from([137,80,78,71,13,10,26,9])),false);
  assert.equal(validateSvgText('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),true);
  assert.equal(validateSvgText('<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg/>'),false);
  assert.equal(validateSvgText('<html></html>'),false);
});
