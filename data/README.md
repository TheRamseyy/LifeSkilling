# Data files

All files are made from the game's extracted data tables:
`C:\nw\nw-buddy\dist\nw-data\live\datatables\` and `localization\en-us.json`.

| File | What it holds | How it is built |
|---|---|---|
| `recipes.json` | Every crafting recipe. Keys: `i` recipe id, `n` name, `t` tradeskill, `l` skill level, `s` stations, `o` [output item id, how many], `g` ingredients `[type, id, qty]` (type `i` item, `g` "any X" category, `$` currency), `c` craft category, `gs` gear score, `tr` tier, `p` random (procedural) recipe, `f` source table. | From the `javelindata_crafting_*.json` tables. `tools/build_recipes.py` reads them, but it writes a longer format; the short format here was made by a later conversion step that is not in `tools/` yet. |
| `names.json` | Item and category id to English name. | From item definitions and `en-us.json` (same note as above). |
| `cats.json` | "Any X" category id to the item ids that count. | From the `IngredientCategories` of each item definition (same note as above). |
| `gather.json` | `n`: gathering nodes `{id: [name, skill, level needed, min respawn s, max respawn s, gather time s, number of different items]}`. `b`: item id (lower case) to the nodes that can drop it. | `python tools/build_gather.py <datatables folder> <en-us.json> data/gather.json` |

Loot tables say which items a node can drop, not chances or amounts. Nothing here has map coordinates.
