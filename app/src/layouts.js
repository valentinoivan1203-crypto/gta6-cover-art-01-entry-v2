// The three cover layouts. Each panel is a rectangle in fractions of the
// cover (x, y from the top-left corner) plus the photo slot it shows first:
// Poster is one hero over two small panels, Grid is a 2 x 2, Wide is a hero
// with a side column. The caption is drawn over the foot of the cover, so
// every layout runs its panels almost to the bottom edge.
export const COVER_LAYOUTS = {
  poster: {
    label: 'Poster',
    panels: [
      { slot: 0, rect: { x: 0.03, y: 0.03, w: 0.94, h: 0.6 } },
      { slot: 1, rect: { x: 0.03, y: 0.66, w: 0.455, h: 0.31 } },
      { slot: 2, rect: { x: 0.515, y: 0.66, w: 0.455, h: 0.31 } },
    ],
  },
  grid: {
    label: 'Grid',
    panels: [
      { slot: 0, rect: { x: 0.03, y: 0.03, w: 0.455, h: 0.455 } },
      { slot: 1, rect: { x: 0.515, y: 0.03, w: 0.455, h: 0.455 } },
      { slot: 2, rect: { x: 0.03, y: 0.515, w: 0.455, h: 0.455 } },
      { slot: 0, rect: { x: 0.515, y: 0.515, w: 0.455, h: 0.455 } },
    ],
  },
  wide: {
    label: 'Wide',
    panels: [
      { slot: 0, rect: { x: 0.03, y: 0.03, w: 0.6, h: 0.94 } },
      { slot: 1, rect: { x: 0.66, y: 0.03, w: 0.31, h: 0.455 } },
      { slot: 2, rect: { x: 0.66, y: 0.515, w: 0.31, h: 0.455 } },
    ],
  },
};

/** The panel list (rects plus first slot) for a layout id. */
export function panelsForLayout(layoutId) {
  return COVER_LAYOUTS[layoutId].panels;
}

/** A panel's rect in pixels for a cover of the given size. */
export function panelRectPixels(panel, width, height) {
  return {
    x: panel.rect.x * width,
    y: panel.rect.y * height,
    w: panel.rect.w * width,
    h: panel.rect.h * height,
  };
}

/** The index of the panel holding the point (canvas pixels), or -1. */
export function panelAtPoint(layoutId, width, height, px, py) {
  const panels = panelsForLayout(layoutId);
  for (let i = 0; i < panels.length; i += 1) {
    const r = panelRectPixels(panels[i], width, height);
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}
