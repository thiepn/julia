import test from "node:test";
import assert from "node:assert/strict";
import {localTestVerdict} from "../src/local-test-result.js";
test("only authentic successful Test summary produces verified local-test outcome",()=>{
 assert.equal(localTestVerdict({ok:true,exitCode:0,stdout:"Test Summary: | Pass Total\nSuite | 4 4"}).kind,"passed");
 assert.equal(localTestVerdict({ok:true,exitCode:0,stdout:"plain println"}).kind,"unconfirmed");
 assert.equal(localTestVerdict({ok:false,exitCode:1,stdout:"Test Summary: | Fail Total"}).kind,"failed");
 assert.equal(localTestVerdict({ok:false,timedOut:true,exitCode:null}).kind,"timeout");
 assert.equal(localTestVerdict(null).kind,"invalid");
});
