"""Build data/drops.json: where each gathering tool, gathering clothing piece and bag can drop.

Follows each item up through the loot buckets and loot tables to the creatures and chests that use them, keeping
the conditions on the way (content level range from bucket tags such as MinContLevel:19-38, enemy level and
player level thresholds from table conditions, and creature tags such as Beast). Creatures are then checked
against those conditions using their spawn levels and zones from NW Buddy's spawn pull.

Levels in the loot data count from 0 (19 means level 20); the output uses in-game levels.

Usage (from the repo folder, after `nwbt.exe pull slices` and build_gear.py):
  python tools/build_drops.py <datatables folder> <en-us.json> <pull folder>/generated data/drops.json

Output: {itemId: {"n": name, "s": [skills or "Bag"], "slot": slot, "tr": tier, "gs": gear score,
  "r": [route, ...]}} where a route is
  {"k": kind, "lv": [min, max] content level or null, "el": lowest enemy level, "pl": lowest player level,
   "tag": [creature tags needed], "c": [[creature, family, lowest, highest level], ...] (most common first),
   "nc": number of creature kinds, "z": [[zone, spawn points], ...], "ch": [chest names], "nch": number}
"""
import collections
import glob
import json
import os
import re
import sys

D, LOC, GEN, OUT = sys.argv[1:5]
L = {k.lower(): v for k, v in json.load(open(LOC, encoding="utf-8")).items()}


def loc(k):
    return L.get(str(k).lstrip("@").lower()) if k else None


def rows(pattern):
    out = []
    for f in sorted(glob.glob(os.path.join(D, pattern))):
        d = json.load(open(f, encoding="utf-8"))
        out += d if isinstance(d, list) else []
    return out


# --- loot tables: children with their threshold for the table's condition
tables = {}
for f in ("javelindata_loottables.json", "javelindata_loottables_fishing.json", "javelindata_loottables_seasons.json",
          "javelindata_loottables_omega.json"):
    for r in rows(f):
        if r.get("LootTableID"):
            tables[r["LootTableID"]] = r
parents = collections.defaultdict(list)  # child ("[LTID]x", "[LBID]x" or item id) -> [(table, condition, threshold)]
for tid, r in tables.items():
    if tid.endswith(("_Qty", "_Probs")):
        continue
    probs = tables.get(tid + "_Probs") or {}
    cond = (r.get("Conditions") or [None])[0]
    for k, v in r.items():
        m = re.fullmatch(r"Item(\d+)", k)
        if m and v:
            th = probs.get(k)
            parents[str(v)].append((tid, cond, int(th) if str(th or "").lstrip("-").isdigit() else None))

# --- loot buckets: item -> [(bucket, tags)]
in_bucket = collections.defaultdict(list)
first, *rest = rows("javelindata_lootbuckets.json") or [{}]
cols = {k[len("LootBucket"):]: v for k, v in first.items() if k.startswith("LootBucket") and v}
for r in [first] + rest:
    for c, b in cols.items():
        it = r.get("Item" + c)
        if it:
            in_bucket[str(it).lower()].append(("[LBID]" + b, r.get("Tags" + c) or []))

# --- who uses a loot table
creatures = collections.defaultdict(list)  # table -> [vitals rows]
for v in rows("vitalstables/*.json"):
    if v.get("LootTableId") and v.get("CanDropLoot", True) is not False:
        creatures[v["LootTableId"]].append(v)
chests = collections.defaultdict(set)
for g in rows("javelindata_gatherables*.json"):
    if g.get("FinalLootTable"):
        chests[g["FinalLootTable"]].add(loc(g.get("DisplayName")) or g.get("GatherableID"))

# creature spawns: levels, zones and names (named creatures get their name from their spawn's category)
zone_name = {str(t["TerritoryID"]): loc(t.get("NameLocalizationKey")) for t in rows("javelindata_territorydefinitions.json")
             if t.get("IsTerritory") and loc(t.get("NameLocalizationKey"))}
# expeditions and other instanced maps: map id nw_dungeon_everfall_00 <-> achievement id DungeonEverfall00MaxRank
mode_name = {}
for g in rows("javelindata_gamemodes.json"):
    a, n = str(g.get("AchievementIdForCompletingMaxRank") or g.get("GameModeId") or ""), loc(g.get("DisplayName"))
    if n:
        mode_name[re.sub(r"maxrank$", "", a.lower())] = n


def map_name(m):
    k = re.sub(r"^nw_", "", m.lower()).replace("_", "")
    # exact match, else the longest named mode the map id starts with ("dungeon" alone is too generic)
    best = max((kk for kk in mode_name if len(kk) > 8 and k.startswith(kk)), key=len, default=None)
    return mode_name.get(k) or (mode_name[best] if best else None)


spawns = collections.defaultdict(list)  # vitalsID (lower) -> [(level, zone, name or None)]
for f in ("vitals_metadata1.json", "vitals_metadata2.json"):
    p = os.path.join(GEN, f)
    if not os.path.exists(p):
        continue
    for v in json.load(open(p, encoding="utf-8")):
        for m, ss in (v.get("spawns") or {}).items():
            open_world = m == "newworld_vitaeeterna"
            mz = None if open_world else map_name(m)
            if not open_world and not mz:
                continue  # test maps and modes without a name
            for s in ss:
                if "quest" in (s.get("e") or []):
                    continue
                z = next((zone_name[str(t)] for t in s.get("t") or [] if str(t) in zone_name), None) if open_world else mz
                nm = next((loc("vc_" + c) for c in s.get("c") or [] if loc("vc_" + c)), None)
                for lv in s.get("l") or []:
                    spawns[v["vitalsID"].lower()].append((lv, z, nm))


def pretty(s):
    return re.sub(r"([a-z])([A-Z0-9])", r"\1 \2", s.replace("_", " "))


def kind_of(tid):
    t = tid.lower()
    if "fish" in t:
        return "Fishing"
    if re.search(r"dungeon|expedition|mutat|raid|catacomb", t):
        return "Expeditions and raids"
    if re.search(r"event|season|holiday|winter|summer|halloween|spring|medley|turkey|omega", t):
        return "Events"
    if re.search(r"chest|cache|container|crate|supply", t):
        return "Chests and containers"
    return None


def routes_for(item):
    """Every loot table above the item, with the conditions collected on the way up."""
    start = []
    for b, tags in in_bucket.get(item.lower(), []):
        c = {"tag": []}
        for t in tags:
            m = re.fullmatch(r"(MinContLevel|Level|EnemyLevel):(\d+)(?:-(\d+))?", t)
            if m:  # "49" means level 50 and up; "19-38" means levels 20 to 39
                lo, hi = int(m.group(2)) + 1, int(m.group(3)) + 1 if m.group(3) else 999
                if m.group(1) == "MinContLevel":
                    c["lv"] = [lo, hi]
                elif m.group(1) == "EnemyLevel":
                    c["el"] = lo
                else:
                    c["pl"] = lo
            elif not re.match(r"(MinContLevel|Level|MinPOI|MaxContLevel|HWM|DawnLevel)", t, re.I):
                c["tag"].append(t)
        start.append((b, c))
    for tid, cond, th in parents.get(item, []):
        start.append(("[LTID]" + tid, {"tag": []}))
    found, seen = [], set()
    stack = list(start)
    while stack:
        node, c = stack.pop()
        key = (node, json.dumps(c, sort_keys=True))
        if key in seen or len(seen) > 20000:
            continue
        seen.add(key)
        if node.startswith("[LTID]"):
            found.append((node[6:], c))
        for tid, cond, th in parents.get(node, []):
            c2 = dict(c)
            if cond == "EnemyLevel" and th is not None:
                c2["el"] = max(c2.get("el", 0), th + 1)
            elif cond == "Level" and th is not None:
                c2["pl"] = max(c2.get("pl", 0), th + 1)
            stack.append(("[LTID]" + tid, c2))
    return found


def route_out(kind, c):
    return {"k": kind, "lv": c.get("lv"), "el": c.get("el", 1), "pl": c.get("pl", 1), "tag": sorted(set(c["tag"])),
            "c": [], "nc": 0, "z": [], "ch": [], "nch": 0}


gear = json.load(open(os.path.join(os.path.dirname(OUT), "gear.json"), encoding="utf-8"))
items = {}
for skill, s in gear["skills"].items():
    for x in s["tools"]:
        items.setdefault(x["id"], dict(x, s=[], slot="Tool"))["s"].append(skill)
    for x in s["wear"]:
        items.setdefault(x["id"], dict(x, s=[]))["s"].append(skill)
for x in gear.get("bags", []):
    items.setdefault(x["id"], dict(x, s=["Bag"], slot="Bag"))

out = {}
for iid, x in items.items():
    merged = {}
    for tid, c in routes_for(iid):
        users = creatures.get(tid, [])
        kind = "Creatures" if users else ("Chests and containers" if chests.get(tid) else kind_of(tid))
        if not kind:
            continue
        key = (kind, json.dumps({k: c.get(k) for k in ("lv", "el", "pl")}), tuple(sorted(set(c["tag"]))))
        r = merged.setdefault(key, route_out(kind, c))
        r.setdefault("_cre", {})
        # chests by name; other loot by the name of its top-level table (sub-tables would only repeat it)
        r.setdefault("_ch", set()).update(chests.get(tid, ()) or ([] if users or parents.get("[LTID]" + tid) else [pretty(tid)]))
        lo, hi = (c.get("lv") or [1, 999])
        lo = max(lo, c.get("el", 1))
        for v in users:
            tags = set(v.get("LootTags") or [])
            if c["tag"] and not set(c["tag"]) <= tags:
                continue
            base = loc(v.get("DisplayName")) or v["VitalsID"]
            for lv, z, nm in spawns.get(v["VitalsID"].lower(), []):
                if not lo <= lv <= hi:
                    continue
                e = r["_cre"].setdefault(nm or base, {"f": v.get("Family") or "", "lv": [], "z": collections.Counter()})
                e["lv"].append(lv)
                if z:
                    e["z"][z] += 1
    routes = []
    for r in merged.values():
        cre = r.pop("_cre", {})
        ch = r.pop("_ch", set())
        if r["k"] == "Creatures" and not cre:
            continue
        zones = collections.Counter()
        for e in cre.values():
            zones.update(e["z"])
        top = sorted(cre.items(), key=lambda kv: -len(kv[1]["lv"]))
        r["c"] = [[n, e["f"], min(e["lv"]), max(e["lv"])] for n, e in top[:12]]
        r["nc"] = len(cre)
        r["z"] = [[z, n] for z, n in zones.most_common(8)]
        r["ch"] = sorted(ch)[:10]
        r["nch"] = len(ch)
        routes.append(r)
    if routes:
        routes.sort(key=lambda r: (r["k"] != "Creatures", -(r["nc"] + r["nch"])))
        out[iid] = {"n": x["n"], "s": x["s"], "slot": x.get("slot"), "tr": x["tr"], "gs": x["gs"], "r": routes}

json.dump(out, open(OUT, "w", encoding="utf-8"), separators=(",", ":"), ensure_ascii=False)
print(len(out), "of", len(items), "gathering items can drop;",
      collections.Counter(r["k"] for v in out.values() for r in v["r"]))
