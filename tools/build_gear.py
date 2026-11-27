# Builds data/gear.json: gathering tools and clothing for each gathering skill, plus crafting
# clothing and the XP needed per level for each crafting skill.
# Usage (from the repo folder):
#   python tools/build_gear.py C:\nw\nw-buddy\dist\nw-data\live\datatables C:\nw\nw-buddy\dist\nw-data\live\localization\en-us.json data/gear.json
import glob, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from perkmath import fill, multiplier  # noqa: E402

if len(sys.argv) != 4:
    sys.exit("usage: python tools/build_gear.py <datatables_dir> <en-us.json> <out gear.json>")
D, LOC, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
L = {k.lower(): v for k, v in json.load(open(LOC, encoding="utf-8")).items()}


def loc(k):
    return L.get(str(k).lstrip("@").lower()) if k else None


def table(name):
    return json.load(open(os.path.join(D, name), encoding="utf-8"))


SKILLS = {  # skill -> tool class in ItemClass
    "Mining": "PickAxe", "Logging": "LoggingAxe", "Harvesting": "Sickle",
    "Skinning": "SkinningKnife", "Fishing": "FishingPole",
}
# Where an item comes from, by the item file it sits in. Files not listed are left out
# (cosmetic skins, store items, test items, retired items, replacements).
SOURCE = {"crafting": "Crafted", "loot": "Drop", "named": "Named drop", "quest": "Quest reward",
          "faction": "Faction shop", "omega": "Event", "seasonalserver": "Seasonal server",
          "seasons": "Season reward", "common": "Not craftable", "conquerorsitems": "Conqueror shop"}
SLOTS = [("EquippableHead", "Head"), ("EquippableChest", "Chest"), ("EquippableHands", "Hands"),
         ("EquippableLegs", "Legs"), ("EquippableFeet", "Feet"), ("EquippableAmulet", "Amulet"),
         ("EquippableRing", "Ring"), ("EquippableToken", "Earring")]

items = {}
for f in sorted(glob.glob(os.path.join(D, "javelindata_itemdefinitions_master_*.json"))):
    src = os.path.basename(f)[len("javelindata_itemdefinitions_master_"):-5]
    for r in json.load(open(f, encoding="utf-8")):
        if isinstance(r, dict) and r.get("ItemID") and r["ItemID"] not in items:
            items[r["ItemID"]] = (src, r)
stats = {r["WeaponID"]: r for r in table("javelindata_itemdefinitions_weapons.json")}
perks = {}
for t in ("javelindata_perks.json", "javelindata_perks_2025.json"):
    for p in table(t):
        perks.setdefault(p["PerkID"], p)
# Item rows sometimes spell perk ids with different capitals (WoodWorkerYield vs WoodworkerYield)
canon = {k.lower(): k for k in perks}
buckets = {b["PerkBucketID"]: b for b in table("javelindata_perkbuckets.json")}
crafted = set()
for f in glob.glob(os.path.join(D, "javelindata_crafting_*.json")):
    for x in json.load(open(f, encoding="utf-8")):
        if x.get("ItemID"):
            crafted.add(x["ItemID"].lower())


def perk_text(pid, gs):
    """(name, description with numbers filled in for this gear score, first number or None)"""
    p = perks.get(pid)
    if not p:
        return None
    desc, vals = fill(loc(p.get("Description")), multiplier(p.get("ScalingPerGearScore"), gs))
    return [loc(p.get("DisplayName")) or pid, desc, round(vals[0], 2) if vals else None]


def gear_score(r):
    return r.get("GearScoreOverride") or r.get("MaxGearScore") or r.get("MinGearScore") or 0


def item_perks(r):
    return [canon.get(r[f"Perk{n}"].lower(), r[f"Perk{n}"]) for n in range(1, 6) if r.get(f"Perk{n}")]


def random_slots(r):
    """Random perk slots and the perks they can roll."""
    bs = [r[f"PerkBucket{n}"] for n in range(1, 6) if r.get(f"PerkBucket{n}")]
    pool = []
    for b in bs:
        for k in range(1, 40):
            p = (buckets.get(b) or {}).get(f"Perk{k}")
            if p and p in perks and p not in pool:
                pool.append(p)
    return len(bs), [loc(perks[p].get("DisplayName")) or p for p in pool]


def skill_of(pid):
    for s in SKILLS:
        if s.lower() in pid.lower():
            return s
    return "Fishing" if pid.startswith("Fish") else None


# Crafting clothing: perk -> crafting skill it helps
CRAFT_PERK = {"Arcanist": "Arcana", "Armorer": "Armoring", "Cook": "Cooking", "Engineer": "Engineering",
              "Jeweler": "Jewelcrafting", "Weaponsmith": "Weaponsmithing", "StonecutterYield": "Stonecutting",
              "LeatherworkerYield": "Leatherworking", "SmelterYield": "Smelting", "WeaverYield": "Weaving",
              "WoodworkerYield": "Woodworking"}
CRAFT_SKILLS = ["Arcana", "Armoring", "Cooking", "Engineering", "Furnishing", "Jewelcrafting", "Leatherworking",
                "Smelting", "Stonecutting", "Weaponsmithing", "Weaving", "Woodworking"]


def craft_skill_of(pid):
    m = re.match(r"PerkID_Armor_([A-Za-z]+?)(_Faction)?$", pid)
    return CRAFT_PERK.get(m.group(1)) if m else None


out = {"skills": {}, "levels": {}, "crafting": {}}
for s in CRAFT_SKILLS:
    t = "javelindata_tradeskill%s.json" % s.lower()
    rows = table(t) if os.path.exists(os.path.join(D, t)) else []
    cost = {x["Level"]: x.get("InfluenceCost") or 0 for x in rows}
    # xp[n] = crafting XP needed to go from level n to level n+1
    out["crafting"][s] = {"xp": [cost.get(n + 1, 0) for n in range(250)], "wear": []}
for s in SKILLS:
    out["skills"][s] = {"tools": [], "wear": []}

for iid, (src, r) in items.items():
    if src not in SOURCE:
        continue
    cls = r.get("ItemClass") or []
    name = loc(r.get("Name"))
    if not name:
        continue
    gs = gear_score(r)
    source = "Crafted" if iid.lower() in crafted else SOURCE[src]
    base = {"id": iid, "n": name, "tr": r.get("Tier") or 0, "gs": gs, "lv": r.get("RequiredLevel") or 0, "src": source,
            "bop": 1 if r.get("BindOnPickup") else 0}
    if "EquippableTool" in cls:
        skill = next((s for s, c in SKILLS.items() if c in cls), None)
        st = stats.get(r.get("ItemStatsRef") or "")
        if not skill or not st or not r.get("Tier"):
            continue
        slots, pool = random_slots(r)
        base.update(sp=st.get("GatheringEfficiency") or 0,
                    pk=[[p] + perk_text(p, gs) for p in item_perks(r) if p in perks],
                    rs=slots, pool=pool)
        out["skills"][skill]["tools"].append(base)
        continue
    slot = next((label for c, label in SLOTS if c in cls), None)
    allp = item_perks(r) + [canon.get(r[f"PerkSlot{n}"].lower(), r[f"PerkSlot{n}"]) for n in range(1, 6) if r.get(f"PerkSlot{n}")]
    cp = [p for p in dict.fromkeys(allp) if p in perks and craft_skill_of(p)]
    if slot and cp:
        for cs in sorted({craft_skill_of(p) for p in cp}):
            out["crafting"][cs]["wear"].append(dict(base, slot=slot, pk=[[p] + perk_text(p, gs) for p in cp if craft_skill_of(p) == cs]))
    mine = [p for p in item_perks(r) if p in perks and skill_of(p)]
    if not slot or not mine:
        continue
    for skill in sorted({skill_of(p) for p in mine}):
        w = dict(base, slot=slot, pk=[[p] + perk_text(p, gs) for p in item_perks(r) if p in perks and skill_of(p) == skill])
        out["skills"][skill]["wear"].append(w)

# Gathering speed bonus from skill level (every 50 levels)
for s in SKILLS:
    t = "javelindata_tradeskill%s.json" % s.lower()
    if os.path.exists(os.path.join(D, t)):
        out["levels"][s] = {str(x["Level"]): x.get("GatheringEfficiency") or 0 for x in table(t) if x["Level"] % 50 == 0 and x["Level"] <= 250}

for s in out["crafting"].values():
    s["wear"].sort(key=lambda x: (x["slot"], -(x["pk"][0][3] or 0), -x["gs"], x["n"]))
for s in out["skills"].values():
    s["tools"].sort(key=lambda x: (-x["sp"], -x["gs"], x["n"]))
    s["wear"].sort(key=lambda x: (x["slot"], -(x["pk"][0][3] or 0), -x["gs"], x["n"]))
json.dump(out, open(OUT, "w", encoding="utf-8"), separators=(",", ":"), ensure_ascii=False)
print({k: (len(v["tools"]), len(v["wear"])) for k, v in out["skills"].items()})
print({k: len(v["wear"]) for k, v in out["crafting"].items()})
