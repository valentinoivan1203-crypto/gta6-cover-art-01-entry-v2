// The cover's editable state: layout, size, grade, lettering, the three photo
// slots and one pan/zoom record per panel. Panels are numbered in layout
// order; layouts with three panels simply leave the fourth record unused.
export const COVER_SIZES = {
  square: { label: 'Square 1080 x 1080', width: 1080, height: 1080 },
  portrait: { label: 'Portrait 1080 x 1350', width: 1080, height: 1350 },
  wide: { label: 'Wide 1920 x 1080', width: 1920, height: 1080 },
};

export const LAYOUT_IDS = ['poster', 'grid', 'wide'];
export const GRADE_IDS = ['sunset', 'neon', 'noir'];
export const CAPTION_STYLES = ['solid', 'outline', 'glow'];
export const SLOT_COUNT = 3;

/** A fresh cover state: the wide poster, sunset grade, sample-ready slots. */
export function createCoverState() {
  return {
    layout: 'poster',
    size: 'wide',
    grade: 'sunset',
    caption: 'NEON NIGHTS',
    subtitle: 'VICE CITY',
    captionStyle: 'solid',
    slots: [null, null, null],
    panels: [
      { slot: 0, scale: 1, dx: 0, dy: 0 },
      { slot: 1, scale: 1, dx: 0, dy: 0 },
      { slot: 2, scale: 1, dx: 0, dy: 0 },
      { slot: 0, scale: 1, dx: 0, dy: 0 },
    ],
    selectedPanel: 0,
  };
}

/** How many panels the named layout shows. */
export function panelCountFor(layoutId) {
  return layoutId === 'grid' ? 4 : 3;
}

/** The export size for the state's chosen size id. */
export function sizeFor(state) {
  return COVER_SIZES[state.size];
}
