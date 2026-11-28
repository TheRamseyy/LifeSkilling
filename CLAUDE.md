# Project: Aeternum crafting and gathering tools (for Project Azoth)

Owner: Ramsey (non-coder, Windows PC). Static website hosted on GitHub Pages. No build step, no framework: plain HTML, CSS and JavaScript, data in JSON files fetched at load. Explain changes in plain language and keep steps short.

## Goal
A personal tool, shared with a few friends, that answers: "I want to craft X. What do I need from the very start, where do I get each material, and what skills and gear do I need?" It sits alongside a friend's build planner (PvP/PvE builds), so do not duplicate that. Game numbers come from the game files Ramsey extracted. NW Buddy, nwdb, gaming.tools and other community sites may be used (Ramsey's OK, Nov 2026) to find where items come from and to check how mechanics work; credit them on the About page.

## Data (in /data, all derived from extracted datatables; see data/README.md)
- recipes.json: array of recipes. Keys: i recipe id, n name, t tradeskill, l skill level, s stations[], o [outputItemId, qty], g ingredients [[type, id, qty]] where type is "i" item, "g" flexible category ("any X"), "$" currency; c craft category, gs gear score, tr tier, p procedural flag, f source table.
- names.json: id to display name. cats.json: category id to item ids that count.
- gather.json: n = nodes {gatherableId: [name, skill, requiredLevel, minRespawnSec, maxRespawnSec, gatherTimeSec, distinctItemCount]}; b = item id (lowercase) to gatherable ids that can drop it.
- Source datatables: C:\nw\nw-buddy\dist\nw-data\live\datatables\ and localization\en-us.json (re-run tools/ scripts if the game data changes).

## Known limits (be honest about these in the UI)
- Loot tables list items but not drop chances or quantities. Show "can drop", never amounts.
- No map coordinates in the datatables. Maps are a later experiment.
- Where several recipes make one item, the standard (non-procedural) one is used. ~300 category names still show as raw ids.
- Azoth may differ from the official game. Mark data as "from game files", not verified.

## Current state
One app: index.html is the shell; css/, js/core (data loader, router, search, storage), js/pages (one file per page), js/lib/calc.js (calculator logic, no DOM, tested by tests/calc.test.js). Hash routes like #/craft/calculator and #/item/<id>. Calculator: search item, quantity, raw materials with "where to get it", crafting steps, skills by tradeskill, stations grouped, flexible-material picks, collapsible breakdown tree, optional prices. Logic: recursive expansion, crafts = ceil(qty / yield), shared materials summed, cycle and depth guard. Phase 1 is done. Phase 2 is done: #/gather/gear/<skill> (js/pages/gear.js) from data/gear.json built by tools/build_gear.py, tested by tests/gear.test.js. Phase 3 is done: #/gather/runs (js/pages/runs.js) uses js/lib/plan.js (greedy set cover over node kinds; ties: lower level, faster respawn, faster gather), tested by tests/plan.test.js. Phase 4 is done: #/craft/levelling/<skill> (js/pages/levelling.js) uses js/lib/level.js (25-level stages; fastest = most XP per craft, cheapest = cost or raw units per XP among recipes worth >= 25% of the best XP), tested by tests/level.test.js; recipes.json has x (XP per craft), fee and k (known by default); gear.json has crafting.<Skill>.xp and .wear. Calculator shows craft cost per item (NWCalc.craftCost), buy vs craft, fees and a copy button. The 3D recipe map was replaced by js/core/flow.js (left-to-right recipe flow). Phase 5 is done, reworked to gathering tools at Ramsey's request: #/gear/tools (js/pages/tools.js, compare tools), #/gear/attributes (gathering and crafting effects of attributes; tools do not scale with attributes), #/gear/perks (tool perks from gear.json toolPerks); attribute data from data/weapons.json built by tools/build_weapons.py, tested by tests/weapons.test.js; #/gear/weapons forwards to tools; tools/perkmath.py is shared by the build scripts. Section colours (css/tokens.css --c-*), per-skill colours (App.SKILL_COL) and a WebGL sky (js/core/sky.js). App.unsure(tip) marks anything not fully confirmed. Crafting XP per craft = recipe base XP x total ingredient count (matches gaming.tools guides). Where to get items: data/sources.json from tools/build_sources.py (shops, salvage, quests, loot traced to chests, world objects and creatures), shown by App.sourceDetail/App.sourceShort. The calculator follows NWCalc.bestRoute (cheapest 'any' item by your prices else the standard one; buy when market price < craft cost) and shows 'any X' as App.anyPicker drop-downs. The crafting plan (js/core/flow.js, App.Flow) shows the breakdown as numbered steps top to bottom with no lines: gather and buy grouped by source, then one block per step with a card per craft and 'needs' chips that light up their source. Refining reagents (NWCalc.REAGENT) count as bought unless the user presses 'Craft it' (state.craft), which avoids the Flux/Sandpaper loop. Boosts (food, trophies, territory, music, boosters, attribute bonuses) come from data/boosts.json built by tools/build_boosts.py (tests/boosts.test.js) and show via App.boostTable on the gear and levelling pages; levelling has an optional custom XP bonus only (Project Azoth will not run the official double XP). Game data is Season 10 (Nighthaven, NW Buddy 10.0.4); use only Season 10 or newer sources, never older guides. Bump the ?v= tag in index.html after each change.

## First task: redesign the calculator (nothing else yet)
1. Breakdown tree: much better. Collapsible, shows quantity and number of crafts per node, raw materials visually distinct, easy to scan on a phone. Consider a clear top-down tree with expand/collapse all.
2. Requirements: group by tradeskill with the level needed, and show stations needed per step.
3. Stations: show which station each craft happens at, grouped.
4. Flexible materials ("Any X"): let the user pick which item they will use, show the list nicely, and carry the choice into the totals and gathering info.
5. Organise it as ONE app with a clear structure, not a pile of separate pages. A grouped side menu (top strip on phones) like a game wiki, with sections by what the user came to do:
   - Craft: Calculator (this task), Craft list, Prices
   - Gather: Materials and nodes, Gathering gear by level, Run planner (later)
   - Gear: Weapons and attributes (later)
   - Data: About the data, Known limits, Changelog
   Only Calculator and Data pages are built now; later sections appear as greyed "coming soon" entries so the layout is settled. A global search box finds any craftable item or material and jumps to it. Pages share one header, one data loader and one set of components, and the app remembers the last page and the craft list. Use hash routing (#/craft/calculator) so every page has a shareable link and works on GitHub Pages.
5b. Organise the repo too:
   - index.html (shell only)
   - css/ (tokens, layout, components)
   - js/ (core: data loader, router, search, storage; pages/: one file per page; lib/: calculator logic with no DOM code so it can be tested)
   - data/ (all JSON; each file has a short note in data/README.md on how it is built)
   - tools/ (the Python build scripts)
   - docs/ (plain-English notes: how to update data, how to add a page, how to deploy)
   - tests/ (a few Node tests of the calculator logic with real items)
   - README.md written for a non-coder: what this is, how to update it, how to publish it.
6. Keep localStorage for the craft list; keep everything working offline from static files.

## Roadmap (do in this order, one phase per task; do not start a phase until asked)
Phase 1 (now): the calculator redesign and organised app above.
Phase 2: Gathering gear.
  - Gathering tools and tradeskill clothing for each gathering skill (Mining, Logging, Harvesting, Skinning, Fishing): which items exist, their stats and perks.
  - Recommended gear for each level band (e.g. level 1 to 50, then further bands), and a "best in slot" per skill. Derive from item definitions and perks in the datatables.
Phase 3: Gathering run planner.
  - Given a craft list, the best way to maximise a gathering run: which nodes to target, grouped by skill and level, using respawn time, gather time and which nodes drop several needed materials at once. Show "can drop", never exact amounts or chances (the data has none).
  - Order materials so one trip covers as many as possible.
Phase 4: Crafting min-max.
  - Best way to level crafting skills: what to craft at each level band, cheapest or fastest route, using recipe skill levels and tradeskill XP tables. Include crafting-bonus gear and perks for each tradeskill.
  - Costs: keep the optional price entry, add total and per-item cost, and cost to buy versus cost to craft. Compare what the friend's vault site includes for crafting costs and match it where useful.
Phase 5: Weapons and attributes.
  - Weapon stats, attribute scaling and perks from the weapon and attribute tables, searchable and comparable. Keep it focused on facts from the game files, since the friend's planner already covers PvP and PvE builds.
Phase 6: Map test.
  - See whether node spawn coordinates can be pulled from the world files with the NW Buddy tool (nwbt). If it works, add a simple map showing where each material can be found. If it does not, say so plainly and stop.

Reference sites (look at their layout for ideas, never copy their code or text): the friend's vault at https://project-azoth-vault.pages.dev/ (loads in a browser only) and a community vault artifact at https://claude.ai/artifact/GYa3dTxCxnZikjHytK1wHK with a grouped side menu, global search, cards, a paper-doll gear screen and a skill tree.

## Working rules
- Test the calculator logic with real items (e.g. Artisan_LongswordT52, DiamondCutT1) after changes.
- Escape all text put into the page. No secrets in the repo.
- Commit in small steps with plain-English messages.
- Online sources (NW Buddy, nwdb, gaming.tools, wikis, news) may be used to check mechanics and where items come from, credited on the About page; game numbers come from the game files.
- Mark anything not fully confirmed by the game files or testing with App.unsure("why") (shows "not 100%").
