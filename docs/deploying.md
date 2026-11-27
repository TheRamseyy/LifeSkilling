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
