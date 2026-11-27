// Run with:  node --test tests/boosts.test.js
// Checks data/boosts.json (built by tools/build_boosts.py) against known game values.
const test = require("node:test");
const assert = require("node:assert");
const B = require("../data/boosts.json").boosts;
const find = (src, skill, k, v) => B.find((b) => b.src === src && b.s === skill && b.k === k && b.v === v);

test("housing trophies: +5/10/15% mining luck, +3/4/5 weaponsmithing gear score", () => {
  for (const v of [5, 10, 15]) assert.ok(find("Trophy", "Mining", "luck", v), "mining " + v);
  for (const v of [3, 4, 5]) assert.ok(find("Trophy", "Weaponsmithing", "gs", v), "weaponsmithing " + v);
});

test("food that exists in game: mining luck food at +20% and +25% for 40 minutes", () => {
  const f = B.filter((b) => b.src === "Food" && b.s === "Mining").map((b) => [b.v, b.dur]);
  assert.deepStrictEqual(f, [[20, 2400], [25, 2400]]);
});

test("gathering XP booster doubles gathering XP for 2 hours", () => {
  const b = find("Booster", "Logging", "xp", 100);
  assert.ok(b);
  assert.strictEqual(b.dur, 7200);
});

test("Strength 350 gives +10% mining luck", () => {
  assert.ok(find("Attribute", "Mining", "luck", 10));
});
