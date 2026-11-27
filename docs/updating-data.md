# Updating the game data

Do this after a game patch, once you have extracted the new files to
`C:\nw\nw-buddy\dist\nw-data\live\`.

## Rebuild the data

In PowerShell, in this folder, run these three lines:

```
python tools/build_data.py C:\nw\nw-buddy\dist\nw-data\live\datatables C:\nw\nw-buddy\dist\nw-data\live\localization\en-us.json data
```

```
python tools/build_gather.py C:\nw\nw-buddy\dist\nw-data\live\datatables C:\nw\nw-buddy\dist\nw-data\live\localization\en-us.json data/gather.json
```

```
python tools/build_gear.py C:\nw\nw-buddy\dist\nw-data\live\datatables C:\nw\nw-buddy\dist\nw-data\live\localization\en-us.json data/gear.json
```

The first makes `recipes.json`, `names.json` and `cats.json`. The second makes
`gather.json`. The third makes `gear.json` (gathering tools and clothing). Each prints how many things it found.

## After updating

1. Run the checks: `node --test tests/calc.test.js tests/gear.test.js tests/plan.test.js tests/level.test.js`. If a number changed
   because the game changed, update the expected number in the test.
2. Open the site locally (see [deploying.md](deploying.md)) and try a few items.
3. Add a line to the changelog in `js/pages/changelog.js`.
4. Publish (see [deploying.md](deploying.md)).
