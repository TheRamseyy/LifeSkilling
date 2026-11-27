# Data files

All files are made from the game's extracted data tables:
`C:\nw\nw-buddy\dist\nw-data\live\datatables\` and `localization\en-us.json`.

| File | What it holds | How it is built |
|---|---|---|
| `recipes.json` | Every crafting recipe. Keys: `i` recipe id, `n` name, `t` tradeskill, `l` skill level, `s` stations, `o` [output item id, how many], `g` ingredients `[type, id, qty]` (type `i` item, `g` "any X" category, `$` currency), `c` craft category, `gs` gear score, `tr` tier, `p` random (procedural) recipe, `f` source table. | From the `javelindata_crafting_*.json` tables, by `tools/build_data.py`. Section header rows in the tables are skipped. |
| `names.json` | Item and category id to English name. | From item definitions and `en-us.json`, by `tools/build_data.py`. An id that is both an item and a category keeps its item name. |
| `cats.json` | "Any X" category id to the item ids that count. | From the `IngredientCategories` of each item definition, by `tools/build_data.py`. |
| `gather.json` | `n`: gathering nodes `{id: [name, skill, level needed, min respawn s, max respawn s, gather time s, number of different items]}`. `b`: item id (lower case) to the nodes that can drop it. | `python tools/build_gather.py <datatables folder> <en-us.json> data/gather.json` |

Rebuild all four with the commands in [docs/updating-data.md](../docs/updating-data.md).

Loot tables say which items a node can drop, not chances or amounts. Nothing here has map coordinates.
