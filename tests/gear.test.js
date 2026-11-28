// Run with:  node --test tests/gear.test.js
// Checks data/gear.json (built by tools/build_gear.py) against known items.
const test = require("node:test");
const assert = require("node:assert");
const G = require("../data/gear.json");

const find = (skill, list, id) => G.skills[skill][list].find((x) => x.id === id);
const perk = (item, id) => item.pk.find((p) => p[0] === id);

test("every gathering skill has tools and clothing", () => {
  for (const s of ["Mining", "Logging", "Harvesting", "Skinning", "Fishing"]) {
    assert.ok(G.skills[s].tools.length > 5, s + " tools");
    assert.ok(G.skills[s].wear.length > 5, s + " clothing");
  }
});

test("Artisan's Pick: speed and perk values at gear score 700", () => {
  const t = find("Mining", "tools", "Artisan_MiningPickT52");
  assert.strictEqual(t.sp, 9);
  assert.strictEqual(t.gs, 700);
  assert.strictEqual(t.src, "Crafted");
  assert.strictEqual(perk(t, "PerkID_Tools_MiningYield")[3], 20.91); // 10% x (1 + 600 x 0.001818)
});

test("perk scaling that stops at a gear score", () => {
  // armour luck: 2% x (1 + 0.003 per GS from 100 to 550, then nothing) = 4.7%
  const shirt = G.skills.Mining.wear.find((w) => w.n === "Miner Shirt" && w.gs === 700);
  assert.strictEqual(perk(shirt, "PerkID_Armor_MiningLuck")[3], 4.7);
});

test("crafted tools list their random perk pool", () => {
  const t = find("Mining", "tools", "2hPickT52");
  assert.strictEqual(t.rs, 5);
  assert.ok(t.pool.includes("Mining Yield"));
});

test("tools are sorted fastest first", () => {
  const sp = G.skills.Logging.tools.map((t) => t.sp);
  assert.deepStrictEqual(sp, [...sp].sort((a, b) => b - a));
});

test("bags: carry weight matches nwdb and crafted bags can roll gathering perks", () => {
  const bag = (id) => G.bags.find((b) => b.id === id);
  assert.strictEqual(bag("BagAT5").wt, 360); // nwdb: +360 at gear score 600
  assert.strictEqual(bag("Artisan_BagAT52").wt, 300); // nwdb: +300 at gear score 700
  assert.ok(bag("BagBT5").pool.includes("Prospector's Burden"));
  const p = G.bagPerks.find((x) => x[0] === "PerkID_Bags_MiningOre");
  assert.strictEqual(p[4], 20); // 20% lighter ore at gear score 700
});
