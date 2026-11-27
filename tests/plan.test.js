// Run with:  node --test tests/plan.test.js
// Checks the gathering run planner with real items.
const test = require("node:test");
const assert = require("node:assert");
const C = require("../js/lib/calc.js");
const P = require("../js/lib/plan.js");
const gather = require("../data/gather.json");
const byOut = C.indexRecipes(require("../data/recipes.json"));
const cats = require("../data/cats.json");

function needsFor(list, pick) {
  const c = C.expand(list, { byOut, cats, pick });
  const n = {};
  for (const id of Object.keys(c.raw)) if (!byOut[id]) n[id] = c.raw[id];
  return n;
}
const sword = needsFor([{ id: "Artisan_LongswordT52", qty: 1 }, { id: "DiamondCutT1", qty: 3 }], { Wood: "WoodT1" });

test("every material is covered exactly once, or listed as missing", () => {
  const r = P.plan(sword, gather, {});
  const covered = r.stops.flatMap((s) => s.covers);
  assert.strictEqual(new Set(covered).size, covered.length, "no material planned twice");
  const all = [...covered, ...r.missing.map((m) => m.id)].sort();
  assert.deepStrictEqual(all, Object.keys(sword).sort());
});

test("prefers nodes that drop several needed materials", () => {
  const r = P.plan(sword, gather, {});
  // Iron Vein can drop both Iron Ore and Flawed Diamond, so one stop covers both
  const iron = r.stops.find((s) => s.covers.includes("OreT1"));
  assert.ok(iron.covers.includes("DiamondT1"));
  // far fewer stops than materials
  assert.ok(r.stops.length < Object.keys(sword).length - 3, r.stops.length + " stops");
});

test("materials with no gathering node are listed as missing", () => {
  const r = P.plan(sword, gather, {});
  assert.deepStrictEqual(r.missing.map((m) => [m.id, m.reason]), [["ReagentConverterT5", "none"]]);
});

test("your skill level hides nodes you cannot gather yet", () => {
  const r = P.plan(sword, gather, { Mining: 0 });
  const ori = r.missing.find((m) => m.id === "OreT5");
  assert.deepStrictEqual([ori.reason, ori.skill, ori.level], ["level", "Mining", 150]);
  assert.ok(r.stops.every((s) => s.skill !== "Mining" || s.level === 0));
});

test("stops are grouped by skill, lowest level first", () => {
  const r = P.plan(sword, gather, {});
  const order = ["Mining", "Logging", "Harvesting", "Skinning", "Fishing"];
  for (let i = 1; i < r.stops.length; i++) {
    const a = r.stops[i - 1], b = r.stops[i];
    const d = order.indexOf(a.skill) - order.indexOf(b.skill);
    assert.ok(d < 0 || (d === 0 && a.level <= b.level), a.name + " before " + b.name);
  }
});
