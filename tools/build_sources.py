# Builds data/sources.json: where each item comes from, besides crafting and gathering nodes.
# Shops (faction and other token shops), salvage, quest rewards, and loot (traced from the loot tables
# up to the creatures and chests that use them, plus loot-bucket tags such as creature family or zone).
# Usage (from the repo folder):
#   python tools/build_sources.py C:\nw\nw-buddy\dist\nw-data\live\datatables C:\nw\nw-buddy\dist\nw-data\live\localization\en-us.json data/sources.json
import collections, glob, json, os, re, sys

if len(sys.argv) != 4:
    sys.exit("usage: python tools/build_sources.py <datatables_dir> <en-us.json> <out sources.json>")
D, LOC, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
L = {k.lower(): v for k, v in json.load(open(LOC, encoding="utf-8")).items()}


def loc(k):
    return L.get(str(k).lstrip("@").lower()) if k else None


def rows(pattern):
    out = []
    for f in sorted(glob.glob(os.path.join(D, pattern))):
        x = json.load(open(f, encoding="utf-8"))
        if isinstance(x, list):
            out += [r for r in x if isinstance(r, dict)]
    return out


def pretty(s):
    s = re.sub(r"^(\[LTID\]|\[LBID\])", "", str(s))
    return re.sub(r"([a-z])([A-Z0-9])", r"\1 \2", s.replace("_", " ")).strip()


src = collections.defaultdict(lambda: collections.defaultdict(list))

# --- Shops: item currency conversion (faction shops and other token shops)
CUR = {"MarauderTokens": "Marauder faction tokens", "SyndicateTokens": "Syndicate faction tokens", "CovenantTokens": "Covenant faction tokens"}
for r in rows("javelindata_itemcurrencyconversion.json"):
    if not r.get("Bought") or not r.get("ItemID"):
        continue
    cur = r.get("CategoricalProgressionId") or ""
    cost = r.get("BuyCategoricalProgressionCost") or r.get("BuyCurrencyCost") or r.get("BuyCurrencyItemCost") or 0
    rank = r.get("RequiredCategoricalProgressionRank") or 0
    rank_of = r.get("RankCheckCategoricalProgressionId") or ""
    label = CUR.get(cur) or loc("CategoricalProgression_" + cur) or pretty(cur)
    row = [label, cost, (rank_of + " rank " + str(rank)) if rank else ""]
    if row not in src[r["ItemID"]]["shop"]:
        src[r["ItemID"]]["shop"].append(row)

# --- Item names
items = {}
for r in rows("javelindata_itemdefinitions_master_*.json"):
    if r.get("ItemID") and r["ItemID"] not in items:
        items[r["ItemID"]] = r
name = lambda i: loc((items.get(i) or {}).get("Name")) or pretty(i)

# --- Loot tables and loot buckets
tables = {}
for f in ("javelindata_loottables.json", "javelindata_loottables_fishing.json", "javelindata_loottables_seasons.json",
          "javelindata_loottables_omega.json", "javelindata_loottables_salvage.json"):
    for r in rows(f):
        tid = r.get("LootTableID")
        if not tid:
            continue
        refs = [v for k, v in r.items() if re.fullmatch(r"Item\d+", k) and v]
        t = tables.setdefault(tid, {"items": set(), "kids": set(), "file": f})
        for v in refs:
            v = str(v)
            if v.startswith("[LTID]") or v.startswith("[LBID]"):
                t["kids"].add(v)
            else:
                t["items"].add(v)
# loot buckets: first row names the bucket of each column; later rows list items with tags
bucket_items = collections.defaultdict(set)
bucket_tags = collections.defaultdict(lambda: collections.Counter())
first, *rest = rows("javelindata_lootbuckets.json") or [{}]
names_by_col = {k[len("LootBucket"):]: v for k, v in first.items() if k.startswith("LootBucket") and v}
for r in [first] + rest:
    for col, b in names_by_col.items():
        it = r.get("Item" + col)
        if it:
            bucket_items["[LBID]" + b].add(it)
            for tag in r.get("Tags" + col) or []:
                if not tag.startswith(("MinContLevel", "Level:", "MinPOI")):
                    bucket_tags[it][tag] += 1

parents = collections.defaultdict(set)  # node -> tables that contain it ("[LTID]x" / "[LBID]x" / item id)
for tid, t in tables.items():
    for i in t["items"]:
        parents[i].add(tid)
    for k in t["kids"]:
        parents[k].add(tid)
for b, its in bucket_items.items():
    for i in its:
        parents[i].add(b)

# who uses a loot table: creatures (by family) and chests or containers (by name)
users = collections.defaultdict(lambda: collections.defaultdict(set))
for v in rows("vitalstables/*.json"):
    tid = v.get("LootTableId")
    if tid and v.get("CanDropLoot", True) is not False:
        users[tid]["Creatures"].add(v.get("Family") or "Creature")
for g in rows("javelindata_gatherables*.json"):
    tid = g.get("FinalLootTable")
    if tid:
        kind = "Chests and containers" if g.get("IsLootContainer") else "Found in the world"
        users[tid][kind].add(loc(g.get("DisplayName")) or pretty(g.get("GatherableID")))


def climb(start, limit=4000):
    """All loot tables above an item (through nested tables and buckets)."""
    seen, stack = set(), [start]
    while stack and len(seen) < limit:
        n = stack.pop()
        for p in parents.get(n, ()):
            key = "[LTID]" + p if not p.startswith("[LBID]") else p
            for k in (p, key):
                if k not in seen:
                    seen.add(k)
                    stack.append(k)
    return {s[6:] if s.startswith("[LTID]") else s for s in seen}


def kind_of(tid):
    t = tid.lower()
    if "salvage" in t:
        return None  # shown separately
    if "fish" in t:
        return "Fishing"
    if re.search(r"dungeon|expedition|mutat|raid|catacomb", t):
        return "Expeditions and raids"
    if re.search(r"chest|cache|container|crate|supply", t):
        return "Chests and containers"
    if re.search(r"event|season|holiday|winter|summer|halloween|spring|medley|turkey", t):
        return "Events"
    if re.search(r"creature|named|elite|boss|loot", t):
        return "Creatures"
    return "Other loot"


for item in list(parents.keys()):
    if item.startswith("["):
        continue
    ups = climb(item)
    if not ups:
        continue
    found = collections.defaultdict(set)
    for tid in ups:
        for kind, who in users.get(tid, {}).items():
            found[kind] |= who
    roots = [u for u in ups if not u.startswith("[LBID]") and not parents.get("[LTID]" + u)]
    for r in roots:
        k = kind_of(r)
        if k and k not in found:
            found[k].add(pretty(r))
    for kind, who in found.items():
        src[item]["loot"].append([kind, sorted(who)[:8], len(who)])
    tags = [t for t, _ in bucket_tags[item].most_common(6)]
    if tags:
        src[item]["tags"] = tags

# --- Salvage: which items salvage into a table that can give this item
salv_tables = {tid for tid, t in tables.items() if t["file"].endswith("salvage.json")}
salvage_from = collections.defaultdict(set)
for iid, r in items.items():
    for k in ("SalvageResources", "RepairRecipe", "CraftingRecipe", "SalvageLootTable"):
        v = r.get(k)
        if isinstance(v, str) and v.startswith("[LTID]") and v[6:] in salv_tables:
            for i in tables[v[6:]]["items"]:
                if i != iid:
                    salvage_from[i].add(iid)
for i, frm in salvage_from.items():
    src[i]["salvage"] = [sorted({name(x) for x in frm})[:8], len(frm)]

# --- Quest rewards
quests = collections.Counter()
for q in rows("questgameevents/*.json"):
    if q.get("ItemReward"):
        quests[q["ItemReward"]] += 1
for i, n in quests.items():
    src[i]["quest"] = n

# keep only items the site shows (recipe items and their categories), with short lists
known = set(json.load(open(os.path.join(os.path.dirname(OUT), "names.json"), encoding="utf-8")))
out = {}
for i, s in src.items():
    if i not in known or not s:
        continue
    s = dict(s)
    if "loot" in s:
        s["loot"] = [[k, w[:6], n] for k, w, n in sorted(s["loot"], key=lambda x: -x[2])[:6]]
    if "shop" in s:
        s["shop"] = sorted(s["shop"], key=lambda x: (x[1], x[0]))[:6]
    out[i] = s
json.dump(out, open(OUT, "w", encoding="utf-8"), separators=(",", ":"), ensure_ascii=False)
print(len(out), "items with sources;", collections.Counter(k for s in out.values() for k in s))
