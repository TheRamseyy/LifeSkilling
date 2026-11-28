// Where gathering gear drops (data/drops.json from tools/build_drops.py), checked against nwdb.
const test = require("node:test");
const assert = require("node:assert");
const D = require("../data/drops.json");

test("Miner Hat T3 drops from creatures of level 20-39 (nwdb: content level 20-39)", () => {
  const r = D.ClothingHead_MinerT3.r.find((x) => x.k === "Creatures");
  assert.deepStrictEqual(r.lv, [20, 39]);
  assert.ok(r.nc > 100);
  assert.ok(r.z.some((z) => z[0] === "Weaver's Fen"));
});

test("Miner Goggles T5 drop at level 50 and up (nwdb: content level 50+)", () => {
  const r = D.ClothingHead_MinerT5.r.find((x) => x.k === "Creatures");
  assert.deepStrictEqual(r.lv, [50, 999]);
});

test("every route has a kind and something to show", () => {
  for (const v of Object.values(D)) for (const r of v.r) assert.ok(r.k && (r.nc || r.ch.length || r.k !== "Creatures"));
});
