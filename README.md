# Leonida Nights — GTA VI Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/valentinoivan1203-crypto/gta6-cover-art-01-entry-v2/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/valentinoivan1203-crypto/gta6-cover-art-01-entry-v2/reward.svg)](https://make.fun/c/gta6-cover-art-01)

Turn your photos into Vice City key art in the style of a GTA VI poster —
multi-panel collage, huge caption lettering, sunset and neon grades — and
export it as a PNG to share. An original design: no Rockstar Games logo,
artwork or font is used. Type is Anton (SIL Open Font License), shipped
under `app/fonts/`.

## How it works

1. **Photos** — three built-in Vice City samples are loaded, or upload up to
   three of your own. Photos are read on your machine and never uploaded.
2. **Key Art preset** — one click composes the hero photo, two small panels,
   the sunburst, the palm silhouettes and the giant `LEONIDA NIGHTS` title
   with the `VI` badge.
3. **Make it yours** — click a panel to select it, drag to pan the photo,
   scroll or use the slider to zoom, pick which photo each panel shows, or
   fill every panel with one photo. Change the layout (Key Art, Poster,
   Grid, Wide, Diagonal), the size (1080×1080, 1080×1350, 1920×1080), the
   colour grade (Sunset, Neon, Noir, Vice, Gold Hour), the lettering
   (Solid, Outline, Glow, Comic halftone), the caption text, size and
   position, and the effects (sunburst rays, halftone dots, palms, badge).
4. **Export PNG** — the preview is the export drawing, so what you see is
   the PNG you get, at the size you picked.

## Run it

Serve `app/` with any static server and open `index.html` in desktop
Chrome. It works offline: every script, image and font is a file under
`app/`, and nothing loads over the network.

```
cd app && python3 -m http.server 8080
```

## Files

- `app/index.html` — the editor page
- `app/style.css` — the editor styling
- `app/app.js` — the cover engine: layouts, grades, lettering, palms,
  sunburst, halftone, pan/zoom cropping and PNG export
- `app/samples/` — three built-in sample photos
- `app/fonts/` — Anton (SIL Open Font License)
- `screenshots/` — the exported covers and the editor at work
