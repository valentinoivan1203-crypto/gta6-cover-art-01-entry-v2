# Neon Nights Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/valentinoivan1203-crypto/gta6-cover-art-01-entry-v2/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/valentinoivan1203-crypto/gta6-cover-art-01-entry-v2/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your photos and a caption into multi-panel GTA-style cover art, exported as a PNG to share. It runs entirely offline in a desktop browser — photos never leave your machine.

## How it works

1. Load up to three photos (your own files, or the built-in Vice City sample photos).
2. Pick a layout — Poster (one hero over two small panels), Grid (2 x 2), or Wide (hero with a side column).
3. Pick a post size — 1080 x 1080, 1080 x 1350, or 1920 x 1080 — and a colour grade — Sunset, Neon, or Noir.
4. Click a panel to select it, drag to pan its photo, scroll or use the slider to zoom, and choose which photo each panel shows.
5. Type your caption and subtitle, pick a lettering style (Solid, Outline, or Glow), and export the PNG.

The cover is drawn on a canvas with the Anton display face (vendored under `app/fonts/` under the SIL Open Font License). The live preview is the same drawing as the export, so what you see is what ships.

## Run it

Serve `app/` with any static server and open `index.html`:

```sh
python3 -m http.server --directory app 8080
```

Then open http://localhost:8080.

## Hand it in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=dehpqxrn&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
