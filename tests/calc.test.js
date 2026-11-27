// Run with:  node --test tests/calc.test.js
// Checks the calculator logic against real items from the game data.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const C = require("../js/lib/calc.js");
const D = (f) => require(path.join(__dirname, "..", "data", f));

const recipes = D("recipes.json"), cats = D("cats.json"), gather = D("gather.json");
const byOut = C.indexRecipes(recipes);

test("Artisan's Longsword + 3 Cut Flawed Diamonds", () => {
  const c = C.expand([{ id: "Artisan_LongswordT52", qty: 1 }, { id: "DiamondCutT1", qty: 3 }], { byOut, cats });
  assert.strictEqual(c.raw.DiamondT1, 3);
  assert.strictEqual(c.raw.AlchemyLifeT1, 6);
  assert.strictEqual(c.raw.OreT1, 12000);
  assert.strictEqual(c.crafts.IngotT53.times, 10);
  assert.strictEqual(c.crafts.IngotT2.times, 3000);
  assert.strictEqual(c.cat.Wood, 7520, "charcoal takes any wood");
  assert.strictEqual(c.order.length, 27);
  // every craft comes after the crafts that feed it
  assert.ok(c.order.indexOf("IngotT2") < c.order.indexOf("IngotT53"));
  assert.strictEqual(c.order[c.order.length - 2], "Artisan_LongswordT52");
});

test("picking an 'any' item adds it to the raw totals", () => {
  const c = C.expand([{ id: "Artisan_LongswordT52", qty: 1 }], { byOut, cats, pick: { Wood: "WoodT1" } });
  assert.strictEqual(c.cat.Wood, undefined);
  assert.strictEqual(c.catUsed.Wood, 7520);
  assert.strictEqual(c.raw.WoodT1, 1600 + 7520);
});

test("a pick that is not in the category is ignored", () => {
  const c = C.expand([{ id: "Artisan_LongswordT52", qty: 1 }], { byOut, cats, pick: { Wood: "OreT1" } });
  assert.strictEqual(c.cat.Wood, 7520);
});

test("marking an item as bought stops the breakdown there", () => {
  const c = C.expand([{ id: "Artisan_LongswordT52", qty: 1 }], { byOut, cats, buy: { IngotT53: 1 } });
  assert.strictEqual(c.raw.IngotT53, 10);
  assert.strictEqual(c.crafts.IngotT53, undefined);
});

test("stations and gathering", () => {
  assert.strictEqual(C.stationLabel("blacksmith2"), "Forge T2");
  assert.strictEqual(C.station("camp1_standing").name, "Camp");
  assert.ok(C.nodesFor("DiamondT1", gather).length > 0);
});

test("recipe loops do not run forever", () => {
  const loop = C.indexRecipes([
    { o: ["A", 1], g: [["i", "B", 2]], f: "misc" },
    { o: ["B", 1], g: [["i", "A", 1]], f: "misc" },
  ]);
  const c = C.expand([{ id: "A", qty: 1 }], { byOut: loop });
  assert.strictEqual(c.raw.A, 2);
});
