// Wires the editor page to the cover state: photo slots, layout/size/grade
// pickers, caption fields, panel select/pan/zoom on the preview canvas and
// the PNG export. Everything the page does goes through redraw(), so the
// preview always shows exactly what an export would write.
import { drawCoverOn, drawEditorOverlay, exportCoverBlob, maxPanFor } from './cover.js';
import { panelAtPoint, panelRectPixels, panelsForLayout } from './layouts.js';
import { panelCountFor, sizeFor } from './state.js';

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function $(id) {
  return document.getElementById(id);
}

/** Wires every control on the page; returns the editor's API. */
export function wireCoverEditor(state, canvas) {
  const status = $('status');
  let drag = null;

  function say(message) {
    status.textContent = message;
  }

  function redraw() {
    drawCoverOn(canvas, state);
    drawEditorOverlay(canvas.getContext('2d'), canvas.width, canvas.height, state);
    syncPanelControls();
    syncThumbs();
  }

  /** Redraws the preview canvas with the cover alone, no editor overlay. */
  function drawCoverOnly() {
    drawCoverOn(canvas, state);
    syncPanelControls();
    syncThumbs();
  }

  function syncThumbs() {
    for (let i = 0; i < 3; i += 1) {
      const thumb = $(`thumb-${i}`);
      if (thumb && state.slots[i]) thumb.src = state.slots[i].src;
    }
  }

  function syncPanelControls() {
    const count = panelCountFor(state.layout);
    if (state.selectedPanel >= count) state.selectedPanel = 0;
    $('selected-panel').textContent = `Panel ${state.selectedPanel + 1} of ${count}`;
    const panel = state.panels[state.selectedPanel];
    const zoom = $('zoom');
    zoom.value = String(panel.scale);
    $('zoom-value').textContent = `${panel.scale.toFixed(2)}x`;
    document.querySelectorAll('[data-panel-slot]').forEach((button) => {
      const slot = Number(button.dataset.panelSlot);
      button.classList.toggle('active', slot === panel.slot);
      button.setAttribute('aria-pressed', String(slot === panel.slot));
    });
  }

  function clampPanelPan(i) {
    const panels = panelsForLayout(state.layout);
    const rect = panelRectPixels(panels[i], canvas.width, canvas.height);
    const photo = state.slots[state.panels[i].slot];
    const { maxDx, maxDy } = maxPanFor(state.panels[i], photo, rect);
    state.panels[i].dx = Math.max(-maxDx, Math.min(maxDx, state.panels[i].dx));
    state.panels[i].dy = Math.max(-maxDy, Math.min(maxDy, state.panels[i].dy));
  }

  function selectPanel(i) {
    state.selectedPanel = i;
    redraw();
  }

  function canvasPoint(event) {
    const box = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * canvas.width,
      y: ((event.clientY - box.top) / box.height) * canvas.height,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    const point = canvasPoint(event);
    const hit = panelAtPoint(state.layout, canvas.width, canvas.height, point.x, point.y);
    if (hit < 0) return;
    selectPanel(hit);
    drag = { panel: hit, startX: event.clientX, startY: event.clientY, moved: false };
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const panels = panelsForLayout(state.layout);
    const rect = panelRectPixels(panels[drag.panel], canvas.width, canvas.height);
    const box = canvas.getBoundingClientRect();
    const scaleX = canvas.width / box.width;
    const scaleY = canvas.height / box.height;
    const dxPx = (event.clientX - drag.startX) * scaleX;
    const dyPx = (event.clientY - drag.startY) * scaleY;
    if (Math.abs(dxPx) + Math.abs(dyPx) > 2) drag.moved = true;
    const panel = state.panels[drag.panel];
    panel.dx += (dxPx / rect.w);
    panel.dy += (dyPx / rect.h);
    drag.startX = event.clientX;
    drag.startY = event.clientY;
    clampPanelPan(drag.panel);
    redraw();
  });

  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('pointercancel', () => { drag = null; });

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const point = canvasPoint(event);
    const hit = panelAtPoint(state.layout, canvas.width, canvas.height, point.x, point.y);
    const target = hit >= 0 ? hit : state.selectedPanel;
    zoomPanel(target, Math.exp(-event.deltaY * 0.0012));
  }, { passive: false });

  function zoomPanel(i, factor) {
    const panel = state.panels[i];
    panel.scale = Math.max(1, Math.min(4, panel.scale * factor));
    clampPanelPan(i);
    state.selectedPanel = i;
    redraw();
  }

  function wireGroup(groupId, attr, apply) {
    document.querySelectorAll(`#${groupId} [data-${attr}]`).forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelectorAll(`#${groupId} [data-${attr}]`).forEach((other) => {
          other.classList.remove('active');
          other.setAttribute('aria-pressed', 'false');
        });
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
        apply(button.dataset[attr]);
        redraw();
      });
    });
  }

  wireGroup('layout-group', 'layout', (value) => { state.layout = value; });
  wireGroup('size-group', 'size', (value) => { state.size = value; });
  wireGroup('grade-group', 'grade', (value) => { state.grade = value; });
  wireGroup('style-group', 'captionStyle', (value) => { state.captionStyle = value; });

  document.querySelectorAll('[data-panel-slot]').forEach((button) => {
    button.addEventListener('click', () => {
      state.panels[state.selectedPanel].slot = Number(button.dataset.panelSlot);
      redraw();
      say(`Panel ${state.selectedPanel + 1} now shows Photo ${state.panels[state.selectedPanel].slot + 1}.`);
    });
  });

  $('zoom').addEventListener('input', (event) => {
    state.panels[state.selectedPanel].scale = Number(event.target.value);
    clampPanelPan(state.selectedPanel);
    redraw();
  });

  $('caption').addEventListener('input', (event) => { state.caption = event.target.value; redraw(); });
  $('subtitle').addEventListener('input', (event) => { state.subtitle = event.target.value; redraw(); });

  async function loadSlotFromFile(slot, file) {
    const url = URL.createObjectURL(file);
    state.slots[slot] = await loadImage(url);
    state.slots[slot].src = url;
    redraw();
    say(`Photo ${slot + 1} loaded from ${file.name}.`);
  }

  async function loadSlotSample(slot, sample) {
    const url = `samples/${sample}.jpg`;
    const image = await loadImage(url);
    image.src = url;
    state.slots[slot] = image;
    redraw();
    say(`Photo ${slot + 1} set to sample ${sample}.`);
  }

  for (let i = 0; i < 3; i += 1) {
    $(`upload-${i}`).addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) loadSlotFromFile(i, file).catch(() => say(`Photo ${i + 1} could not be read.`));
    });
    $(`sample-${i}`).addEventListener('click', () => {
      loadSlotSample(i, `sample-${i + 1}`).catch(() => say(`Sample ${i + 1} could not be loaded.`));
    });
  }

  $('load-samples').addEventListener('click', async () => {
    try {
      await Promise.all([0, 1, 2].map((i) => loadSlotSample(i, `sample-${i + 1}`)));
      say('All three sample photos loaded.');
    } catch (e) {
      say('A sample photo could not be loaded.');
    }
  });

  async function exportCoverPng() {
    const blob = await exportCoverBlob(state);
    const { width, height } = sizeFor(state);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-nights-cover-${width}x${height}.png`;
    a.click();
    say(`Saved neon-nights-cover-${width}x${height}.png`);
    return blob;
  }

  $('export').addEventListener('click', () => {
    exportCoverPng().catch(() => say('Export failed.'));
  });

  return {
    redraw,
    drawCoverOnly,
    selectPanel,
    zoomPanel,
    loadSlotFromFile,
    loadSlotSample,
    exportCoverPng,
    setLayout(layout) { state.layout = layout; redraw(); },
    setSize(size) { state.size = size; redraw(); },
    setGrade(grade) { state.grade = grade; redraw(); },
    setCaption(text) { state.caption = text; $('caption').value = text; redraw(); },
    setSubtitle(text) { state.subtitle = text; $('subtitle').value = text; redraw(); },
    setCaptionStyle(style) { state.captionStyle = style; redraw(); },
    say,
  };
}
