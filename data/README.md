# Data files

All files are made from the game's extracted data tables:
`C:\nw\nw-buddy\dist\nw-data\live\datatables\` and `localization\en-us.json`.

| File | What it holds | How it is built |
|---|---|---|
| `recipes.json` | Every crafting recipe. Keys: `i` recipe id, `n` name, `t` tradeskill, `l` skill level, `s` stations, `o` [output item id, how many], `g` ingredients `[type, id, qty]` (type `i` item, `g` "any X" category, `$` currency), `c` craft category, `gs` gear score, `tr` tier, `p` random (procedural) recipe, `f` source table, `x` crafting XP per craft, `fee` crafting fee in coin (before town tax), `k` 1 if known by default (0 means you need to learn it first). | From the `javelindata_crafting_*.json` tables, by `tools/build_data.py`. Section header rows in the tables are skipped. |
| `names.json` | Item and category id to English name. | From item definitions and `en-us.json`, by `tools/build_data.py`. An id that is both an item and a category keeps its item name. |
| `cats.json` | "Any X" category id to the item ids that count. | From the `IngredientCategories` of each item definition, by `tools/build_data.py`. |
| `gear.json` | `skills.<Skill>.tools` and `.wear`: each item `{id, n name, tr tier, gs gear score, lv character level, src source, bop binds on pickup (cannot be traded), pk [[perk id, name, text, value]], sp gathering speed, rs random perk slots, pool perks they can roll, slot}`. `levels.<Skill>`: gathering speed bonus every 50 skill levels. | `python tools/build_gear.py <datatables folder> <en-us.json> data/gear.json`. Perk values use the game's own scaling formula at each item's gear score. Cosmetic skins, store, test and retired items are left out. |
| `weapons.json` | `types`: each weapon type with `n` name, `main`/`second` attributes and `tiers` (the plain crafted weapon of each tier: base damage, crit, stagger, block, accuracy, weight, attribute scaling `sc`, gear score range, `two` for two-handed). `attrs`: per attribute, value of each point (`per`), running total (`sum`), derived stats such as health, and milestone bonuses (`bonus`). `perks`: weapon perks with text worked out at gear score `perkGS`. | `python tools/build_weapons.py <datatables folder> <en-us.json> data/weapons.json`. Stat ids are matched without regard to capitals. |
| `gather.json` | `n`: gathering nodes `{id: [name, skill, level needed, min respawn s, max respawn s, gather time s, number of different items]}`. `b`: item id (lower case) to the nodes that can drop it. | `python tools/build_gather.py <datatables folder> <en-us.json> data/gather.json` |

Rebuild all six with the commands in [docs/updating-data.md](../docs/updating-data.md).

Loot tables say which items a node can drop, not chances or amounts. Nothing here has map coordinates.
