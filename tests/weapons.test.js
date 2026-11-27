// Run with:  node --test tests/weapons.test.js
// Checks data/weapons.json (built by tools/build_weapons.py) against known values from the game files.
const test = require("node:test");
const assert = require("node:assert");
const W = require("../data/weapons.json");
const type = (n) => W.types.find((t) => t.n === n);
const top = (t) => t.tiers[t.tiers.length - 1];

test("all player weapon types are there, with plain crafted examples", () => {
  assert.strictEqual(W.types.length, 19);
  for (const t of W.types) {
    assert.ok(t.tiers.length >= 3, t.n);
    for (const r of t.tiers) assert.ok(!/Replica|Artisan|Goldcursed/.test(r.n), t.n + ": " + r.n);
  }
});

test("war hammer found despite the different capitals in its stat id", () => {
  const h = type("War Hammer");
  assert.strictEqual(top(h).dmg, 93);
  assert.strictEqual(top(h).two, 1);
});

test("staffs are two-handed, gauntlets one-handed", () => {
  assert.strictEqual(top(type("Fire Staff")).two, 1);
  assert.strictEqual(top(type("Life Staff")).two, 1);
  assert.strictEqual(top(type("Ice Gauntlet")).two, 0);
});

test("sword scaling and main attributes", () => {
  const s = type("Sword");
  assert.deepStrictEqual(top(s).sc, { Str: 0.0085, Dex: 0.0065, Int: 0, Foc: 0, Con: 0 });
  assert.deepStrictEqual([s.main, s.second], [["Str"], ["Dex"]]);
});

test("attributes: diminishing returns and eight milestone bonuses each", () => {
  for (const a of Object.values(W.attrs)) {
    assert.strictEqual(a.bonus.length, 8);
    assert.ok(a.per[0] > a.per[a.per.length - 1]);
  }
  assert.strictEqual(W.attrs.Strength.bonus[0][0], 25);
});

test("weapon perks have filled-in numbers", () => {
  assert.ok(W.perks.length > 100);
  assert.ok(!W.perks.some((p) => /\{\[/.test(p.d)), "no unfilled {[...]} blocks");
});
