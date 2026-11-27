# Updating the game data

Do this after a game patch, once you have extracted the new files to
`C:\nw\nw-buddy\dist\nw-data\live\`.

## Gathering nodes

In PowerShell, in this folder:

```
python tools/build_gather.py C:\nw\nw-buddy\dist\nw-data\live\datatables C:\nw\nw-buddy\dist\nw-data\live\localization\en-us.json data/gather.json
```

It prints how many nodes and items it found.

## Recipes, names and categories

`tools/build_recipes.py` reads the crafting tables, but its output is a longer
format than the one the site uses. The step that turns it into
`data/recipes.json`, `data/names.json` and `data/cats.json` is not in `tools/`
yet. Until it is, ask Claude to rebuild these three files.

## After updating

1. Run the checks: `node --test tests/calc.test.js`. If a number changed
   because the game changed, update the expected number in the test.
2. Open the site locally (see [deploying.md](deploying.md)) and try a few items.
3. Add a line to the changelog in `js/pages/changelog.js`.
4. Publish (see [deploying.md](deploying.md)).
