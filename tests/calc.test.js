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

test("craft cost per item, including the crafting fee", () => {
  // Iron Ingot: 4 Iron Ore + 1 coin fee
  const c = C.craftCost("IngotT2", { byOut, cats, prices: { OreT1: 0.5 } });
  assert.strictEqual(c.each, 4 * 0.5 + 1);
  // Cut Flawed Diamond needs Life Motes too: without their price there is no total, and it says what is missing
  const d = C.craftCost("DiamondCutT1", { byOut, cats, prices: { DiamondT1: 10 } });
  assert.strictEqual(d.each, null);
  assert.deepStrictEqual(d.missing, ["AlchemyLifeT1"]);
});

test("a bought ingredient uses its price instead of being crafted", () => {
  const c = C.craftCost("IngotT3", { byOut, cats, prices: { IngotT2: 3, FluxT5: 20, CharcoalT1: 1 }, buy: { IngotT2: 1, FluxT5: 1, CharcoalT1: 1 } });
  const r = byOut.IngotT3[0];
  assert.strictEqual(c.each, (3 * 3 + 20 + 2 * 1 + r.fee) / r.o[1]);
});

test("cheapest route: standard item for 'any' when nothing is priced", () => {
  const r = C.bestRoute([{ id: "CharcoalT1", qty: 10 }], { byOut, cats });
  assert.strictEqual(r.pick.Wood, cats.Wood[0]);
  assert.deepStrictEqual(r.auto, { buy: [], pick: [], reagent: [] });
});

test("cheapest route: picks the cheapest priced 'any' item and keeps your own choice", () => {
  const prices = { WoodT1: 1, WoodT2: 0.1 };
  assert.strictEqual(C.bestRoute([{ id: "CharcoalT1", qty: 10 }], { byOut, cats, prices }).pick.Wood, "WoodT2");
  assert.strictEqual(C.bestRoute([{ id: "CharcoalT1", qty: 10 }], { byOut, cats, prices, pick: { Wood: "WoodT1" } }).pick.Wood, "WoodT1");
});

test("cheapest route: buys an ingredient whose market price is below its craft cost", () => {
  // Iron Ingot costs 4 x 1 + 1 fee = 5 to craft; at a market price of 2 it is cheaper to buy
  const r = C.bestRoute([{ id: "IngotT3", qty: 1 }], { byOut, cats, prices: { OreT1: 1, IngotT2: 2 } });
  assert.ok(r.buy.IngotT2);
  assert.deepStrictEqual(r.auto.buy, ["IngotT2"]);
});

test("refining reagents count as bought unless you choose to craft them", () => {
  const list = [{ id: "IngotT3", qty: 10 }];
  const a = C.bestRoute(list, { byOut, cats });
  assert.ok(a.buy.FluxT5 && a.auto.reagent.includes("FluxT5"));
  const b = C.bestRoute(list, { byOut, cats, craft: { FluxT5: 1 } });
  assert.ok(!b.buy.FluxT5);
});
