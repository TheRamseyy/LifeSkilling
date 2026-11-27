# Builds data/weapons.json: player weapon types with their stats per tier, the five attributes
# (diminishing returns per point, derived stats, milestone bonuses) and weapon perks.
# Usage (from the repo folder):
#   python tools/build_weapons.py C:\nw\nw-buddy\dist\nw-data\live\datatables C:\nw\nw-buddy\dist\nw-data\live\localization\en-us.json data/weapons.json
import glob, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from perkmath import fill, multiplier  # noqa: E402

if len(sys.argv) != 4:
    sys.exit("usage: python tools/build_weapons.py <datatables_dir> <en-us.json> <out weapons.json>")
D, LOC, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
L = {k.lower(): v for k, v in json.load(open(LOC, encoding="utf-8")).items()}


def loc(k):
    return L.get(str(k).lstrip("@").lower()) if k else None


def table(name):
    return json.load(open(os.path.join(D, name), encoding="utf-8"))


# Item class -> display name, in the order shown
TYPES = [("Sword", "Sword"), ("Rapier", "Rapier"), ("Hatchet", "Hatchet"), ("Flail", "Flail"), ("Dagger", "Daggers"),
         ("Spear", "Spear"), ("GreatSword", "Greatsword"), ("2HAxe", "Great Axe"), ("2HHammer", "War Hammer"),
         ("Bow", "Bow"), ("Musket", "Musket"), ("Blunderbuss", "Blunderbuss"),
         ("FireStaff", "Fire Staff"), ("LifeStaff", "Life Staff"), ("IceMagic", "Ice Gauntlet"), ("VoidGauntlet", "Void Gauntlet"),
         ("RoundShield", "Round Shield"), ("KiteShield", "Kite Shield"), ("TowerShield", "Tower Shield")]
ATTRS = [("Strength", "Str"), ("Dexterity", "Dex"), ("Intelligence", "Int"), ("Focus", "Foc"), ("Constitution", "Con")]

# Weapon stat rows; ids are matched without regard to capitals (2HhammerT5 vs 2HHammerT5)
stats = {r["WeaponID"].lower(): r for r in table("javelindata_itemdefinitions_weapons.json")}
crafting = [r for r in table("javelindata_itemdefinitions_master_crafting.json") if isinstance(r, dict) and r.get("ItemID")]

out = {"types": [], "attrs": {}, "perks": []}
for cls, label in TYPES:
    tiers, best = {}, {}
    # the plain crafted weapon of each tier, e.g. 2hWarhammerT5 or 2hElementalStaff_FireT52; event, replica,
    # dungeon and Artisan versions are left out
    for r in crafting:
        c = r.get("ItemClass") or []
        if cls in c and "Weapon" in c and re.match(r"[12]h.*T\d+$", r["ItemID"], re.I) and not re.search(r"Replica|Dungeon|PVP|Halloween|Winter|Crafted|Cast|Slots|Artisan", r["ItemID"], re.I):
            if not stats.get((r.get("ItemStatsRef") or "").lower()) or (r.get("Tier") or 0) < 2:
                continue
            key = str(r["Tier"]) + ("+" if r["ItemID"].endswith("T52") else "")
            # normal weapons have ids starting 1h/2h; the shortest wins
            rank = len(r["ItemID"])
            if key not in best or rank < best[key][0]:
                best[key] = (rank, r)
    for key, (_, r) in best.items():
        c = r.get("ItemClass") or []
        st = stats[r["ItemStatsRef"].lower()]
        tr = r["Tier"]
        sc = {a: round(st.get("Scaling" + full) or 0, 5) for full, a in ATTRS}
        tiers[key] = {"tr": tr, "id": r["ItemID"], "n": loc(r.get("Name")) or r["ItemID"],
                      "gs": [r.get("MinGearScore") or 0, r.get("MaxGearScore") or 0],
                      "dmg": st.get("BaseDamage") or 0, "crit": st.get("CritChance") or 0, "critx": st.get("CritDamageMultiplier") or 0,
                      "stg": st.get("BaseStaggerDamage") or 0, "blk": st.get("BlockStaminaDamage") or 0, "stab": st.get("BlockStability") or 0,
                      "acc": st.get("BaseAccuracy") or 0, "wt": st.get("WeightOverride") or 0, "sc": sc,
                      # the id says how many hands (2hElementalStaff...); the equip slot does not
                      "two": 1 if r["ItemID"].lower().startswith("2h") else 0}
    if not tiers:
        print("no stats found for", cls)
        continue
    rows = [tiers[k] for k in sorted(tiers, key=lambda k: (int(k.rstrip("+")), k.endswith("+")))]
    sc = rows[-1]["sc"]
    order = [a for a in sorted(sc, key=lambda a: -sc[a]) if sc[a] > 0]
    out["types"].append({"cls": cls, "n": label, "two": rows[-1]["two"], "main": order[:1], "second": order[1:2], "tiers": rows})

# Attributes: value of each point (diminishing returns), running total, derived stats, milestone bonuses
thr = table("weaponabilities/javelindata_ability_attributethreshold.json")
for full, short in ATTRS:
    rows = table("javelindata_attribute%s.json" % full.lower())
    rows.sort(key=lambda x: x["Level"])
    a = {"lv0": rows[0]["Level"], "per": [x.get("ModifierValue") or 0 for x in rows], "sum": [x.get("ModifierValueSum") or 0 for x in rows], "derived": {}, "bonus": []}
    for col in ("Health", "Mana", "Stamina", "HealthRate", "ManaRate", "StaminaRate", "EquipLoad", "Encumbrance", "CastSpeed"):
        vals = [x.get(col) or 0 for x in rows]
        if any(vals):
            a["derived"][col] = vals
    for t in thr:
        m = re.fullmatch(short + r"_Bonus_(\d+)_1", t.get("AbilityID", ""))
        if m:
            text, _ = fill(loc(t.get("Description")))
            if text:
                a["bonus"].append([int(m.group(1)), text.strip()])
    a["bonus"].sort()
    out["attrs"][full] = a

# Weapon perks: perks that can roll on a weapon, with values at gear score 700
GS = 700
weapon_classes = {cls for cls, _ in TYPES} | {"Sword", "Shield", "IceMagic", "2HHammer", "2HAxe"}
perk_rows = []
for t in ("javelindata_perks.json", "javelindata_perks_2025.json"):
    if os.path.exists(os.path.join(D, t)):
        perk_rows += table(t)
seen = set()
names = dict(TYPES)
for p in perk_rows:
    pid = p.get("PerkID")
    if not pid or pid in seen or p.get("PerkType") != "Generated":
        continue
    cls = [c for c in (p.get("ItemClass") or []) if c in weapon_classes]
    if not cls:
        continue
    name = loc(p.get("DisplayName"))
    text, vals = fill(loc(p.get("Description")), multiplier(p.get("ScalingPerGearScore"), GS))
    if not name or not text:
        continue
    seen.add(pid)
    on = sorted({names.get(c, "Shields" if c == "Shield" else c) for c in cls})
    # one row per perk name+text keeps the list readable (tiers I/II/III often share text)
    out["perks"].append({"id": pid, "n": name, "d": text.strip(), "on": on, "scales": 1 if p.get("ScalingPerGearScore") not in (None, "") else 0})
out["perks"].sort(key=lambda x: x["n"])
out["perkGS"] = GS

json.dump(out, open(OUT, "w", encoding="utf-8"), separators=(",", ":"), ensure_ascii=False)
print(len(out["types"]), "weapon types,", len(out["perks"]), "perks,", {k: len(v["bonus"]) for k, v in out["attrs"].items()}, "milestones")
