# Aeternum Crafting (for Project Azoth)

A small website that answers: **"I want to craft X. What do I need from the very start, where do I get each material, and what skills and gear do I need?"**

Open it here: https://theramseyy.github.io/LifeSkilling/

Everything comes from game files extracted by hand. It is not checked against Project Azoth, so treat it as "from game files".

## What it does now

- **Crafting calculator**: add items, see every raw material, where to gather it, the crafting steps in order, skills and stations needed, and a breakdown tree.
- **Gathering gear**: for Mining, Logging, Harvesting, Skinning and Fishing, the best tool and clothing, what to use at each skill level, and every tool and clothing piece with its perks.
- **Level a crafting skill**: for any of the 12 crafting skills, what to craft at each stage, how many times, fees, a shopping list, and the clothing that helps. Fastest or cheapest route.
- **Costs**: enter prices and see what each crafted item costs to make, crafting fees, and whether buying or crafting is cheaper.
- **Run planner**: from your craft list, the fewest kinds of node to visit for every material, grouped by skill and level, with your own gathering levels taken into account.
- **Item pages**: search any item or material at the top (or press `/`).
- **Data pages**: About the data, Known limits, Changelog.

Your craft list, prices and choices are saved in your own browser only.

## How to change something

| I want to… | Read |
|---|---|
| Update the game data after a patch | [docs/updating-data.md](docs/updating-data.md) |
| Add a new page | [docs/adding-a-page.md](docs/adding-a-page.md) |
| Publish changes to the live site | [docs/deploying.md](docs/deploying.md) |

## What is where

| Folder | What is in it |
|---|---|
| `index.html` | The page frame only (header, menu). |
| `css/` | Colours (`tokens.css`), page frame (`layout.css`), building blocks (`components.css`). |
| `js/core/` | Shared parts: data loading, page links, search, saving. |
| `js/pages/` | One file per page. |
| `js/lib/` | The calculator maths, run planner and levelling routes, with no page code, so they can be tested. |
| `data/` | The game data as JSON. See [data/README.md](data/README.md). |
| `tools/` | Python scripts that build the data from the game files. |
| `tests/` | Checks of the calculator maths with real items. |
| `docs/` | Plain-English how-to notes. |

## Check the maths

With [Node.js](https://nodejs.org) installed, in this folder run:

```
node --test tests/calc.test.js tests/gear.test.js tests/plan.test.js tests/level.test.js
```

All lines should say `pass`.
