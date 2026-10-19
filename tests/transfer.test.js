import test from "node:test";
import assert from "node:assert/strict";
import {exportJuliaScript, validateJuliaImport, MAX_IMPORT_BYTES, JULIA_SCRIPT_MIME} from "../src/transfer.js";
import {MAX_DRAFT_LENGTH} from "../src/workspace.js";

test("Julia download preserves typed code and uses deterministic lesson filename",()=>{
  const code="using LinearAlgebra\nx = [2, 4]\nprintln(sum(x))\n";
  assert.deepEqual(exportJuliaScript("03",code),{
    filename:"amp-julia-lab-lesson-03.jl",content:code,mime:JULIA_SCRIPT_MIME
  });
  assert.equal(exportJuliaScript("16","").content,"");
  assert.throws(()=>exportJuliaScript("../01","bad"),/Unknown lesson/);
  assert.throws(()=>exportJuliaScript("17","bad"),/Unknown lesson/);
  assert.throws(()=>exportJuliaScript("01","x".repeat(MAX_DRAFT_LENGTH+1)),/exceeds/);
});
test("Julia file import treats source as inert text and bounds file size",()=>{
  assert.deepEqual(validateJuliaImport("notes.jl","println(5)"),{
    ok:true,code:"println(5)",message:"Julia source is ready to import. It has not been executed or graded."
  });
  assert.equal(validateJuliaImport("sample.JL","").ok,true);
  assert.equal(validateJuliaImport("notes.txt","println(5)").ok,false);
  assert.equal(validateJuliaImport("code.jl","x".repeat(MAX_DRAFT_LENGTH+1)).ok,false);
  assert.equal(validateJuliaImport("code.jl",42).ok,false);
  assert.equal(MAX_IMPORT_BYTES,MAX_DRAFT_LENGTH*4+3);
});
