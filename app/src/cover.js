// Draws the cover: every panel's photo (cover-fit, panned and zoomed, in
// the grade's colours), the grade tint, the caption lettering over a scrim
// at the foot, a vignette and the grade's frame. The same draw runs the live
// preview and the exported PNG, so what the editor shows is what ships.
import { panelsForLayout, panelRectPixels } from './layouts.js';
import { gradeFor } from './grades.js';
import { sizeFor } from './state.js';

/** Draws the whole cover onto `ctx` at the given pixel size. */
export function drawCover(ctx, width, height, state) {
  const grade = gradeFor(state.grade);
  ctx.save();
  ctx.fillStyle = grade.background;
  ctx.fillRect(0, 0, width, height);
  const panels = panelsForLayout(state.layout);
  panels.forEach((panel, i) => {
    const rect = panelRectPixels(panel, width, height);
    const record = state.panels[i];
    const photo = state.slots[record.slot];
    drawPanelPhoto(ctx, photo, rect, record, grade, width, i === 0);
  });
  drawVignette(ctx, width, height);
  drawCaptionScrim(ctx, width, height, grade);
  drawCaptionLettering(ctx, width, height, state, grade);
  ctx.strokeStyle = grade.frame;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = Math.max(2, width * 0.004);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, width - ctx.lineWidth, height - ctx.lineWidth);
  ctx.restore();
}

/** Sizes `canvas` to the state's export size and draws the cover on it. */
export function drawCoverOn(canvas, state) {
  const { width, height } = sizeFor(state);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  drawCover(canvas.getContext('2d'), width, height, state);
}

/** Renders the cover at export size and resolves to a PNG blob. */
export function exportCoverBlob(state) {
  const { width, height } = sizeFor(state);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas.getContext('2d'), width, height, state);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

/** How far a panel's photo may be panned, in fractions of its rect. */
export function maxPanFor(panel, photo, rect) {
  if (!photo) return { maxDx: 0, maxDy: 0 };
  const base = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight);
  const drawnW = photo.naturalWidth * base * panel.scale;
  const drawnH = photo.naturalHeight * base * panel.scale;
  return {
    maxDx: Math.max(0, (drawnW - rect.w) / 2 / rect.w),
    maxDy: Math.max(0, (drawnH - rect.h) / 2 / rect.h),
  };
}

/** One panel: the photo cover-fit inside its rect, then the grade tint. */
function drawPanelPhoto(ctx, photo, rect, panel, grade, width, isHero) {
  const radius = Math.max(2, Math.min(rect.w, rect.h) * 0.02);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, radius);
  ctx.clip();
  if (photo) {
    const base = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight);
    const drawnW = photo.naturalWidth * base * panel.scale;
    const drawnH = photo.naturalHeight * base * panel.scale;
    const x = rect.x + (rect.w - drawnW) / 2 + panel.dx * rect.w;
    const y = rect.y + (rect.h - drawnH) / 2 + panel.dy * rect.h;
    ctx.filter = grade.photoFilter;
    ctx.drawImage(photo, x, y, drawnW, drawnH);
    ctx.filter = 'none';
  } else {
    ctx.fillStyle = '#241a30';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  const tint = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  tint.addColorStop(0, grade.tintTop);
  tint.addColorStop(1, grade.tintBottom);
  ctx.fillStyle = tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, radius);
  ctx.strokeStyle = isHero ? grade.frame : 'rgba(255, 255, 255, 0.28)';
  ctx.globalAlpha = isHero ? 0.95 : 1;
  ctx.lineWidth = Math.max(1.5, width * (isHero ? 0.0025 : 0.001));
  ctx.stroke();
  ctx.restore();
}

/** Darkens the corners so the panels read as one poster. */
function drawVignette(ctx, width, height) {
  const glow = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.42,
    width / 2, height / 2, Math.max(width, height) * 0.75,
  );
  glow.addColorStop(0, 'rgba(0, 0, 0, 0)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0.32)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

/** The dark wash behind the caption so the lettering stays readable. */
function drawCaptionScrim(ctx, width, height, grade) {
  const scrim = ctx.createLinearGradient(0, height * 0.66, 0, height);
  scrim.addColorStop(0, 'rgba(0, 0, 0, 0)');
  scrim.addColorStop(1, grade.scrim);
  ctx.fillStyle = scrim;
  ctx.fillRect(0, height * 0.66, width, height * 0.34);
}

/** The subtitle and the big Anton caption, fitted to the cover's width. */
function drawCaptionLettering(ctx, width, height, state, grade) {
  const subtitle = state.subtitle.trim().toUpperCase();
  const caption = state.caption.trim().toUpperCase();
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (subtitle) {
    const subSize = height * 0.028;
    ctx.font = `${subSize}px Anton, sans-serif`;
    try { ctx.letterSpacing = `${subSize * 0.45}px`; } catch (e) { /* older canvas */ }
    ctx.fillStyle = grade.captionFill;
    ctx.globalAlpha = 0.92;
    ctx.fillText(subtitle, width / 2, height * 0.845);
    ctx.globalAlpha = 1;
    try { ctx.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
  }
  if (!caption) { ctx.restore(); return; }
  let size = height * 0.1;
  ctx.font = `${size}px Anton, sans-serif`;
  while (ctx.measureText(caption).width > width * 0.92 && size > 12) {
    size -= 2;
    ctx.font = `${size}px Anton, sans-serif`;
  }
  const baseline = height * 0.95;
  ctx.lineJoin = 'round';
  if (state.captionStyle === 'outline') {
    ctx.lineWidth = size * 0.16;
    ctx.strokeStyle = grade.captionStroke;
    ctx.strokeText(caption, width / 2, baseline);
    ctx.lineWidth = size * 0.085;
    ctx.strokeStyle = grade.captionFill;
    ctx.strokeText(caption, width / 2, baseline);
  } else if (state.captionStyle === 'glow') {
    ctx.shadowColor = grade.captionGlow;
    ctx.shadowBlur = size * 0.45;
    ctx.lineWidth = size * 0.03;
    ctx.strokeStyle = grade.captionStroke;
    ctx.strokeText(caption, width / 2, baseline);
    ctx.fillStyle = grade.captionFill;
    ctx.fillText(caption, width / 2, baseline);
  } else {
    ctx.shadowColor = grade.captionGlow;
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.02;
    ctx.lineWidth = size * 0.07;
    ctx.strokeStyle = grade.captionStroke;
    ctx.strokeText(caption, width / 2, baseline);
    ctx.fillStyle = grade.captionFill;
    ctx.fillText(caption, width / 2, baseline);
  }
  ctx.restore();
}

/** Editor-only overlay on the preview: selection ring and slot chips. */
export function drawEditorOverlay(ctx, width, height, state) {
  const panels = panelsForLayout(state.layout);
  ctx.save();
  ctx.font = `bold ${Math.max(14, height * 0.02)}px sans-serif`;
  panels.forEach((panel, i) => {
    const rect = panelRectPixels(panel, width, height);
    const chip = `Photo ${state.panels[i].slot + 1}`;
    const pad = height * 0.012;
    const chipW = ctx.measureText(chip).width + pad * 2;
    const chipH = height * 0.032;
    ctx.fillStyle = 'rgba(10, 6, 18, 0.75)';
    ctx.beginPath();
    ctx.roundRect(rect.x + pad, rect.y + pad, chipW, chipH, chipH / 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(chip, rect.x + pad * 2, rect.y + pad + chipH / 2);
  });
  const selected = panelRectPixels(panels[state.selectedPanel], width, height);
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = Math.max(3, width * 0.004);
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = Math.max(8, width * 0.012);
  ctx.beginPath();
  ctx.roundRect(selected.x, selected.y, selected.w, selected.h, Math.max(2, Math.min(selected.w, selected.h) * 0.02));
  ctx.stroke();
  ctx.restore();
}
