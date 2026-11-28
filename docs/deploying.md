# Publishing changes

The live site is GitHub Pages, published from the `main` branch, top folder:
https://theramseyy.github.io/LifeSkilling/

## Try it on your PC first

The page loads its data with the browser, which does not work by
double-clicking `index.html`. In PowerShell, in this folder:

```
python -m http.server 8765
```

Then open http://localhost:8765/ . Press Ctrl+C in PowerShell to stop.

## Publish

```
git add -A
git commit -m "Say in plain words what changed"
git push origin main
```

The live site updates about a minute later. If you still see the old
version, reload with Ctrl+F5.

## Make sure people see the new version

Browsers keep old copies of the CSS, JavaScript and data files. Every file link in `index.html` ends in `?v=` and a version tag, and `<html data-v="...">` holds the same tag for the data files. After a change, replace the old tag everywhere in `index.html` with a new one (for example today's date plus a letter, such as `20261128c`). Browsers then fetch the new files.
