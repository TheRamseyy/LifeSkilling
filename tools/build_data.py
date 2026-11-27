# Builds data/recipes.json, data/names.json and data/cats.json from the extracted game files.
# Usage (from the repo folder):
#   python tools/build_data.py C:\nw\nw-buddy\dist\nw-data\live\datatables C:\nw\nw-buddy\dist\nw-data\live\localization\en-us.json data
# Format of each file: see data/README.md.
import glob, json, os, re, sys

if len(sys.argv) != 4:
    sys.exit("usage: python tools/build_data.py <datatables_dir> <en-us.json> <out_dir>")
D, LOC, OUT = sys.argv[1], sys.argv[2], sys.argv[3]

L = json.load(open(LOC, encoding="utf-8"))
Ll = {k.lower(): v for k, v in L.items()}


def loc(k):
    if not k:
        return None
    k = str(k).lstrip("@")
    return L.get(k) or Ll.get(k.lower())


# Item definitions: id (lower case) -> row, first file wins
items = {}
for f in sorted(glob.glob(os.path.join(D, "javelindata_itemdefinitions_*.json"))):
    x = json.load(open(f, encoding="utf-8"))
    if not isinstance(x, list):
        continue
    for r in x:
        i = r.get("ItemID") or r.get("WeaponID") or r.get("ConsumableID") or r.get("AmmoID") or r.get("BlueprintID")
        if i and i.lower() not in items:
            items[i.lower()] = r


def iname(i):
    r = items.get(str(i).lower())
    return (loc(r.get("Name")) if r else None) or loc(str(i) + "_MasterName") or loc(str(i) + "_Name")


def cname(i):
    return loc(i + "_groupname") or loc(i + "_categoryname") or loc(i + "_MasterName")


# "Any X" categories: category id -> item ids that count
cats_all = {}
for k, r in items.items():
    ic = r.get("IngredientCategories")
    if isinstance(ic, str):
        ic = [c for c in re.split(r"[,|]", ic) if c]
    for c in ic or []:
        cats_all.setdefault(c, []).append(r.get("ItemID") or k)

TYPE = {"Item": "i", "Category_Only": "g", "Currency": "$"}
recipes, names, cats = [], {}, {}


def name(i, fn):
    if i not in names:
        names[i] = fn(i) or i


for f in sorted(glob.glob(os.path.join(D, "javelindata_crafting_*.json"))):
    table = os.path.basename(f)[len("javelindata_crafting_"):-len(".json")]
    for x in json.load(open(f, encoding="utf-8")):
        out = x.get("ItemID")
        g = []
        for n in range(1, 8):
            t, i, q = x.get(f"Type{n}"), x.get(f"Ingredient{n}"), x.get(f"Qty{n}") or 0
            if not t or not i:
                continue
            g.append([TYPE.get(t, t), i, q])
        if not out and not g:
            continue  # section header row, not a recipe
        recipes.append({
            "i": x["RecipeID"],
            "n": loc(x.get("RecipeNameOverride")) or (iname(out) if out else None) or x["RecipeID"],
            "t": x.get("Tradeskill"),
            "l": x.get("RecipeLevel"),
            "s": [x[k] for k in ("StationType1", "StationType2", "StationType3", "StationType4") if x.get(k)],
            "o": [out, x.get("OutputQty") or 1],
            "g": g,
            "c": x.get("CraftingCategory"),
            "gs": x.get("BaseGearScore"),
            "tr": x.get("BaseTier"),
            "p": 1 if x.get("IsProcedural") else 0,
            "f": table,
        })

# Names in three passes, so an id that is both an item and a category keeps its item name
for r in recipes:
    if r["o"][0]:
        name(r["o"][0], iname)
    for t, i, q in r["g"]:
        if t == "i":
            name(i, iname)
        elif t == "$":
            name(i, lambda c: {"Azoth_Currency": "Azoth"}.get(c) or iname(c))
for r in recipes:
    for t, i, q in r["g"]:
        if t == "g":
            name(i, cname)
            cats[i] = cats_all.get(i, [])
for c in cats.values():
    for m in c:
        name(m, iname)

os.makedirs(OUT, exist_ok=True)
for fn, obj in (("recipes.json", recipes), ("names.json", names), ("cats.json", cats)):
    json.dump(obj, open(os.path.join(OUT, fn), "w", encoding="utf-8"), separators=(",", ":"), ensure_ascii=False)
print(len(recipes), "recipes,", len(names), "names,", len(cats), "categories")
