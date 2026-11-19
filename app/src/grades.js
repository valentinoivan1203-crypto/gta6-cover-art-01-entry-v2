// The three colour grades. Each one is a photo filter (applied when the
// photo is drawn), a warm-to-cool tint washed over every panel, and the
// lettering colours: fill, outline, glow and the frame that rims the cover.
export const COVER_GRADES = {
  sunset: {
    label: 'Sunset',
    background: '#1c0b26',
    photoFilter: 'saturate(1.35) sepia(0.22) hue-rotate(-8deg) brightness(1.06)',
    tintTop: 'rgba(255, 140, 60, 0.10)',
    tintBottom: 'rgba(214, 48, 120, 0.30)',
    captionFill: '#fff7e8',
    captionStroke: '#3d0b2e',
    captionGlow: 'rgba(255, 120, 40, 0.55)',
    frame: '#ffd166',
    scrim: 'rgba(26, 8, 32, 0.62)',
  },
  neon: {
    label: 'Neon',
    background: '#0a0028',
    photoFilter: 'saturate(1.65) contrast(1.1) hue-rotate(6deg) brightness(0.98)',
    tintTop: 'rgba(0, 229, 255, 0.12)',
    tintBottom: 'rgba(255, 46, 166, 0.28)',
    captionFill: '#ffffff',
    captionStroke: '#12002e',
    captionGlow: 'rgba(255, 46, 166, 0.9)',
    frame: '#00e5ff',
    scrim: 'rgba(10, 0, 40, 0.62)',
  },
  noir: {
    label: 'Noir',
    background: '#0a0a0a',
    photoFilter: 'grayscale(1) contrast(1.28) brightness(1.03)',
    tintTop: 'rgba(255, 255, 255, 0.05)',
    tintBottom: 'rgba(0, 0, 0, 0.32)',
    captionFill: '#f5f5f5',
    captionStroke: '#000000',
    captionGlow: 'rgba(0, 0, 0, 0.6)',
    frame: '#e8e8e8',
    scrim: 'rgba(0, 0, 0, 0.66)',
  },
};

/** The grade record for a grade id. */
export function gradeFor(gradeId) {
  return COVER_GRADES[gradeId];
}
