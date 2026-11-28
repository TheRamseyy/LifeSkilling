# Adding a page

Every page is one file in `js/pages/`. The menu lives in `js/app.js`.

1. Copy `js/pages/limits.js` to a new file, for example `js/pages/gear.js`.
2. Change the link name and title on the first line:
   `App.page("gather/gear", {title: "Gathering gear", ...})`
   The link name becomes the address: `#/gather/gear`.
3. If the page needs the game data, add `needsData: true`. The data is then in
   `App.data` when the page draws.
4. Put the page content inside `render`. Always pass text from the data
   through `App.esc(...)` so names cannot break the page.
5. In `index.html`, add `<script src="js/pages/gear.js?v=..."></script>` (same `?v=` tag as the other lines) with the
   other page lines.
6. In `js/app.js`, find the menu entry (for example "Gathering gear by level"),
   remove `soon:1` and add `route:"gather/gear"`.
7. Check it locally, add a changelog line, then publish.

Useful shared helpers: `App.nm(id)` (display name), `App.itemLink(id)`
(link to an item page), `App.nodesFor(id)` (gathering nodes),
`App.fmt(n)` (number with commas), `NWCalc.expand(...)` (calculator maths).
