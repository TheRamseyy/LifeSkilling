# Builds data/boosts.json: everything in the game files that raises gathering luck, refining yield,
# tradeskill XP or crafted gear score: food, housing trophies, territory buffs, music, boosters, attribute bonuses.
# Usage (from the repo folder):
#   python tools/build_boosts.py C:\nw\nw-buddy\dist\nw-data\live\datatables C:\nw\nw-buddy\dist\nw-data\live\localization\en-us.json data/boosts.json
import glob, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from perkmath import fill  # noqa: E402

if len(sys.argv) != 4:
    sys.exit("usage: python tools/build_boosts.py <datatables_dir> <en-us.json> <out boosts.json>")
D, LOC, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
L = {k.lower(): v for k, v in json.load(open(LOC, encoding="utf-8")).items()}


def loc(k):
    return L.get(str(k).lstrip("@").lower()) if k else None


def table(name):
    return json.load(open(os.path.join(D, name), encoding="utf-8"))


GATHER = {"Mining", "Logging", "Harvesting", "Skinning", "Fishing"}
REFINE = {"Smelting", "Woodworking", "Leatherworking", "Weaving", "Stonecutting"}

effects = {}
for f in glob.glob(os.path.join(D, "javelindata_statuseffects*.json")):
    for r in json.load(open(f, encoding="utf-8")):
        effects.setdefault(r["StatusID"], r)


def parts(r):
    """What a status effect changes: [(kind, skill, value)]. Luck/yield points / 100 = %, XP fraction * 100 = %."""
    out = []
    for k, v in r.items():
        if not v or not isinstance(v, (int, float)):
            continue
        m = re.match(r"(ROL|MaxGS|EXP)(\w+)$", k)
        if not m:
            continue
        kind, skill = m.groups()
        if kind == "ROL":
            out.append(("luck" if skill in GATHER else "extra" if skill == "Cooking" else "yield", skill, v / 100))
        elif kind == "MaxGS":
            out.append(("gs", skill, v))
        elif kind == "EXP" and (skill in GATHER or skill in REFINE):
            out.append(("xp", skill, round(v * 100, 2)))
    return out


boosts = []


def add(name, src, sid, item=None, note=None):
    r = effects.get(sid)
    if not r or not name:
        return
    for kind, skill, v in parts(r):
        dur = r.get("BaseDuration")
        boosts.append({"n": name, "src": src, "k": kind, "s": skill, "v": v, "dur": dur if dur and dur > 0 else 0,
                       "id": item, **({"note": note} if note else {})})


# Food (consumables): item names come from the item definitions
names = {}
for f in glob.glob(os.path.join(D, "javelindata_itemdefinitions_master_*.json")):
    for r in json.load(open(f, encoding="utf-8")):
        if isinstance(r, dict) and r.get("ItemID"):
            names.setdefault(r["ItemID"], loc(r.get("Name")))
for c in table("javelindata_itemdefinitions_consumables.json"):
    cid = c.get("ConsumableID") or ""
    for v in c.values():
        for sid in re.split(r"[+,]", v) if isinstance(v, str) else []:
            sid = sid.strip()
            if re.match(r"Food(Miner|Harvester|Hunter|Lumberjack|Weaponsmith|Jewelcrafter|Engineer|Arcanist|Armorer)T\d+$", sid):
                add(names.get(cid), "Food", sid, cid)

# Housing trophies
for h in table("javelindata_housingitems.json"):
    if h.get("UIHousingCategory") == "Trophies" and h.get("HousingStatusEffect"):
        add(loc(h.get("Name")), "Trophy", h["HousingStatusEffect"], h.get("HouseItemID"))

# Territory lifestyle buffs (from territory projects); the description gives the in-game figure
for t in table("javelindata_territoryprogression.json"):
    for v in t.values():
        if isinstance(v, str) and v.endswith("LSB") and v in effects:
            r = effects[v]
            desc, _ = fill(re.sub(r"<[^>]+>", "", loc(r.get("Description")) or ""))
            n = len(boosts)
            add(loc(r.get("DisplayName")) or loc(t.get("Title")) or v, "Territory", v, note=desc)

# Music buffs, attribute milestone bonuses, the gathering XP booster
for sid, r in effects.items():
    if sid.startswith("MusicBuff_Gathering"):
        add(loc(r.get("DisplayName")), "Music", sid)
    elif re.match(r"ATB_\w+_Bonus_\d+_2_Effect$", sid):
        m = re.match(r"ATB_(\w+)_Bonus_(\d+)_2_Effect", sid)
        add({"Str": "Strength", "Dex": "Dexterity", "Int": "Intelligence", "Foc": "Focus", "Con": "Constitution"}.get(m.group(1), m.group(1)) + " " + m.group(2), "Attribute", sid)
add(loc(effects.get("Token_Gather_1", {}).get("DisplayName")) or "Gathering XP Booster", "Booster", "Token_Gather_1")

# de-duplicate identical rows (several territories share one buff)
seen, out = set(), []
for b in boosts:
    key = (b["n"], b["src"], b["k"], b["s"], b["v"])
    if key not in seen:
        seen.add(key)
        out.append(b)
out.sort(key=lambda b: (b["s"], b["k"], b["src"], b["v"]))
json.dump({"boosts": out}, open(OUT, "w", encoding="utf-8"), separators=(",", ":"), ensure_ascii=False)
import collections
print(len(out), "boosts", dict(collections.Counter(b["src"] for b in out)))
