# Project: Aeternum crafting and gathering tools (for Project Azoth)

Owner: Ramsey (non-coder, Windows PC). Static website hosted on GitHub Pages. No build step, no framework: plain HTML, CSS and JavaScript, data in JSON files fetched at load. Explain changes in plain language and keep steps short.

## Goal
A personal tool, shared with a few friends, that answers: "I want to craft X. What do I need from the very start, where do I get each material, and what skills and gear do I need?" It sits alongside a friend's build planner (PvP/PvE builds), so do not duplicate that. Own data only: everything comes from game files Ramsey extracted himself, never from NW Buddy or nwdb.

## Data (in /site, all derived from extracted datatables)
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
site/index.html is a working single-page calculator (search item, quantity, raw materials with "where to get it", crafting steps, requirements, flexible materials, breakdown tree, optional prices). Logic: recursive expansion, crafts = ceil(qty / yield), shared materials summed, cycle and depth guard.

## First task: redesign the calculator (nothing else yet)
1. Breakdown tree: much better. Collapsible, shows quantity and number of crafts per node, raw materials visually distinct, easy to scan on a phone. Consider a clear top-down tree with expand/collapse all.
2. Requirements: group by tradeskill with the level needed, and show stations needed per step.
3. Stations: show which station each craft happens at, grouped.
4. Flexible materials ("Any X"): let the user pick which item they will use, show the list nicely, and carry the choice into the totals and gathering info.
5. Turn it into a small multi-page site with a sidebar or top nav so later pages (gathering gear by level, weapon attributes, gathering-run planner) can be added. Dark, game-like look, readable on mobile, good contrast, keyboard friendly.
6. Keep localStorage for the craft list; keep everything working offline from static files.

Later (not now): gathering gear and tradeskill clothing with recommended gear per level band, weapon attributes, a gathering-run planner, and a map test.

## Working rules
- Test the calculator logic with real items (e.g. Artisan_LongswordT52, DiamondCutT1) after changes.
- Escape all text put into the page. No secrets in the repo.
- Commit in small steps with plain-English messages.
