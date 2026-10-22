import assert from "node:assert/strict";
import {executeJulia,JULIA_DIAGNOSTIC_SOURCE} from "../local-runner/server.mjs";
const result=await executeJulia(JULIA_DIAGNOSTIC_SOURCE,{timeoutMs:30000});
assert.equal(result.ok,true,"Real Julia environment check failed: "+result.stderr);
const lines=result.stdout.split(/\r?\n/).filter(Boolean);
assert.equal(lines[0],"JULIA_LAB_DIAGNOSTIC_V1");
for(const key of ["julia_version","platform","architecture","active_project",
 "package_LinearAlgebra","package_Test","package_Plots","package_PrettyTables"]){
 assert.ok(lines.some(x=>x.startsWith(key+"=")),key+" missing: "+result.stdout);
}
assert.match(result.stdout,/julia_version=1\.11\./);
assert.match(result.stdout,/package_LinearAlgebra=available/);
assert.match(result.stdout,/package_Test=available/);
assert.deepEqual(result.figures,[]);
console.log("REAL JULIA DIAGNOSTICS PASS",lines.length,"fields, no package mutations");
