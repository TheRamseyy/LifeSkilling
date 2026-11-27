// Run with:  node --test tests/level.test.js
// Checks the crafting levelling routes with real recipes.
const test = require("node:test");
const assert = require("node:assert");
const C = require("../js/lib/calc.js");
const L = require("../js/lib/level.js");
const recipes = require("../data/recipes.json");
const opt = (skill, mode, extra) => Object.assign({
  recipes, byOut: C.indexRecipes(recipes), cats: require("../data/cats.json"), gather: require("../data/gather.json"),
  xp: require("../data/gear.json").crafting[skill].xp, skill, from: 0, to: 250, mode,
}, extra);

test("every stage only uses recipes you have unlocked", () => {
  for (const mode of ["fast", "cheap"]) {
    const r = L.route(opt("Smelting", mode));
    for (const s of r.steps) if (s.r) assert.ok(s.r.l <= s.from, s.r.n + " at " + s.from);
  }
});

test("crafts give enough XP for each stage", () => {
  const r = L.route(opt("Weaponsmithing", "fast"));
  const xp = opt("Weaponsmithing").xp;
  for (const s of r.steps) {
    let need = 0;
    for (let n = s.from; n < s.to; n++) need += xp[n];
    assert.strictEqual(s.xp, need);
    assert.ok(s.crafts * s.r.x >= need && (s.crafts - 1) * s.r.x < need, s.r.n);
  }
});

test("smelting starts on Charcoal and moves to a 46 XP ingot at 50", () => {
  const r = L.route(opt("Smelting", "fast"));
  assert.strictEqual(r.steps[0].r.i, "CharcoalT1");
  assert.strictEqual(r.steps[1].from, 50);
  assert.strictEqual(r.steps[1].r.x, 46);
});

test("wood inside Charcoal is counted, with or without a chosen wood", () => {
  const a = L.route(opt("Smelting", "fast", { from: 0, to: 10 })), b = L.route(opt("Smelting", "fast", { from: 0, to: 10, pick: { Wood: "WoodT1" } }));
  assert.ok(a.steps[0].raw.WoodT1 > 0);
  assert.deepStrictEqual(a.steps[0].raw, b.steps[0].raw);
});

test("refining reagents are treated as bought, not broken down", () => {
  const r = L.route(opt("Smelting", "fast"));
  const ingot = r.steps[1];
  assert.ok(ingot.raw.FluxT5 > 0);
  assert.strictEqual(ingot.raw.ReagentConverterT5, undefined);
});

test("cheapest never drops to a tiny-XP grind", () => {
  const r = L.route(opt("Weaponsmithing", "cheap"));
  assert.ok(r.total.crafts < 100000, r.total.crafts + " crafts");
});

test("a partial range only counts the levels asked for", () => {
  const r = L.route(opt("Smelting", "fast", { from: 60, to: 80 }));
  assert.strictEqual(r.steps[0].from, 60);
  assert.strictEqual(r.steps[r.steps.length - 1].to, 80);
});

test("an XP bonus cuts the crafts needed", () => {
  const base = L.route(opt("Smelting", "fast")), dbl = L.route(opt("Smelting", "fast", { bonus: 1 }));
  assert.ok(dbl.total.crafts <= Math.ceil(base.total.crafts / 2) + dbl.steps.length);
  assert.ok(dbl.total.crafts >= Math.floor(base.total.crafts / 2));
  assert.strictEqual(dbl.total.xp, base.total.xp, "XP needed does not change");
});
