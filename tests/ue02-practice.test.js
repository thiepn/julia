import test from "node:test";
import assert from "node:assert/strict";
import {CANCELLATION_EXAMPLE,CONDITION_EXAMPLE,UE02_CASES,cancellationRows,relativeConditionSin} from "../src/ue02-practice.js";
import {PLOT_RECIPES,recipeForLesson} from "../src/plotting-practice.js";
test("sampled cancellation is mathematically relevant to Float64 arithmetic",()=>{
  const rows=cancellationRows();
  assert.equal(rows.length,4);
  assert.equal(rows[3].direct,0);
  assert.ok(rows[3].rationalized>0);
  assert.ok(Math.abs(rows[0].direct-rows[0].rationalized)/rows[0].rationalized<1e-10);
  assert.throws(()=>cancellationRows([-1]));
  assert.match(CANCELLATION_EXAMPLE,/pretty_table\(data; column_labels=/);
  assert.match(CANCELLATION_EXAMPLE,/using PrettyTables/);
});
test("relative conditioning derives from the same expression as its Julia example",()=>{
  assert.ok(Math.abs(relativeConditionSin(1)-Math.cos(1)/Math.sin(1))<1e-12);
  assert.equal(relativeConditionSin(0),Infinity);
  assert.throws(()=>relativeConditionSin(Infinity));
  assert.match(CONDITION_EXAMPLE,/abs\(x \* cos\(x\) \/ fx\)/);
  assert.equal(Object.keys(UE02_CASES).length,2);
});
test("Plots.jl source examples cover plotting, geometry, and matrix actions",()=>{
  assert.deepEqual(Object.keys(PLOT_RECIPES),["04","05","06"]);
  for(const [lesson,recipe] of Object.entries(PLOT_RECIPES)){
    assert.equal(recipeForLesson(lesson),recipe);
    assert.match(recipe.code,/using Plots/);
    assert.match(recipe.code,/savefig\(/);
    assert.ok(recipe.checks.length>35);
  }
  assert.equal(recipeForLesson("02"),null);
  assert.match(PLOT_RECIPES["05"].code,/aspect_ratio=:equal/);
  assert.match(PLOT_RECIPES["06"].code,/mapped = A \* points/);
});
