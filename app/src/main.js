// Boots Neon Nights Cover Studio: builds the state, wires the editor, loads
// the Anton display font and the three sample photos, then either runs a
// fixed screenshot scene (?shot=) or leaves the live editor ready to use.
import { createCoverState } from './state.js';
import { wireCoverEditor } from './editor.js';
import { runShot } from './shots.js';

/** Loads the three sample photos into the editor's slots. */
export async function loadSamplePhotos(editor) {
  await Promise.all([1, 2, 3].map((n) => editor.loadSlotSample(n - 1, `sample-${n}`)));
}

async function bootstrapCoverStudio() {
  const state = createCoverState();
  const canvas = document.getElementById('cover');
  const editor = wireCoverEditor(state, canvas);
  window.__coverStudio = { state, editor };
  try { await document.fonts.load('100px Anton'); } catch (e) { /* fall back to sans */ }
  try { await loadSamplePhotos(editor); } catch (e) { /* samples are optional */ }
  editor.redraw();
  const query = new URLSearchParams(location.search);
  const shot = query.get('shot');
  if (shot) {
    await runShot(shot, query, editor, state);
  } else {
    window.__shotReady = true;
  }
}

bootstrapCoverStudio();
