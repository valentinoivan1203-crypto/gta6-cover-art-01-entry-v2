"use strict";
/* Leonida Nights — GTA VI Cover Studio.
   One drawCover(ctx, W, H, state) renders both the live preview and the
   exported PNG, so what the editor shows is exactly what the PNG holds.
   Original work only: no Rockstar logo, artwork or font. Type is Anton
   (SIL Open Font License), shipped under app/fonts/. */

const SIZES = {
  "1080x1080": [1080, 1080],
  "1080x1350": [1080, 1350],
  "1920x1080": [1920, 1080],
};
const LAYOUT_NAMES = {
  keyart: "Key Art",
  poster: "Poster",
  grid: "Grid",
  wide: "Wide",
  diagonal: "Diagonal",
};

/* Colour grades: sky gradient stops, photo tint, glow colour, title ink,
   subtitle ink and the title-band scrim colour. */
const GRADES = {
  sunset: {
    sky: ["#ff9a3d", "#ff2d78", "#7b2ff7"], tint: "#ff5a3c", tintAlpha: 0.16,
    glow: "#ff7a18", title: "#ffffff", sub: "#ffd76a", band: "rgba(22,4,34,0.84)",
  },
  neon: {
    sky: ["#00f0ff", "#7b2ff7", "#ff00a8"], tint: "#00e5ff", tintAlpha: 0.14,
    glow: "#00f0ff", title: "#ffffff", sub: "#00f0ff", band: "rgba(4,8,34,0.86)",
  },
  noir: {
    sky: ["#4a4a4a", "#161616", "#000000"], tint: "#9a9a9a", tintAlpha: 0.10,
    glow: "#ffffff", title: "#ffffff", sub: "#d8d8d8", band: "rgba(0,0,0,0.86)",
  },
  vice: {
    sky: ["#ff5fa2", "#ff2d78", "#00e5c7"], tint: "#ff5fa2", tintAlpha: 0.15,
    glow: "#ff5fa2", title: "#ffffff", sub: "#00e5c7", band: "rgba(26,4,30,0.84)",
  },
  gold: {
    sky: ["#fff2b0", "#ff9a3d", "#c96a12"], tint: "#ffb63d", tintAlpha: 0.15,
    glow: "#ffd76a", title: "#fff8e0", sub: "#ffd76a", band: "rgba(42,20,2,0.84)",
  },
};

const state = {
  layout: "keyart",
  size: "1920x1080",
  grade: "sunset",
  lettering: "comic",
  title: "LEONIDA NIGHTS",
  subtitle: "VICE CITY",
  titleSize: 1,
  titlePos: "bottom",
  sunburst: true,
  halftone: true,
  palms: true,
  badge: true,
  fillAll: false,
  fillPhoto: 0,
  selectedPanel: 0,
  photos: [], // {img, name} per slot, 3 slots
  panels: [], // {photo, zoom, ox, oy} per layout panel
};

function makePanel(photo) {
  return { photo: photo, zoom: 1, ox: 0, oy: 0 };
}

/* Panel geometry for each layout, in fractions of the cover.
   A panel is a rect, or a polygon (diagonal) with a bounding box. */
function layoutPanels(layout) {
  if (layout === "keyart") {
    return [
      { kind: "rect", x: 0, y: 0, w: 1, h: 0.6 },
      { kind: "rect", x: 0, y: 0.6, w: 0.5, h: 0.2 },
      { kind: "rect", x: 0.5, y: 0.6, w: 0.5, h: 0.2 },
    ];
  }
  if (layout === "poster") {
    return [{ kind: "rect", x: 0, y: 0, w: 1, h: 1 }];
  }
  if (layout === "grid") {
    return [
      { kind: "rect", x: 0, y: 0, w: 0.5, h: 0.39 },
      { kind: "rect", x: 0.5, y: 0, w: 0.5, h: 0.39 },
      { kind: "rect", x: 0, y: 0.39, w: 0.5, h: 0.39 },
      { kind: "rect", x: 0.5, y: 0.39, w: 0.5, h: 0.39 },
    ];
  }
  if (layout === "wide") {
    return [{ kind: "rect", x: 0, y: 0, w: 1, h: 0.72 }];
  }
  /* diagonal: two panels split by a diagonal seam, title band below. */
  return [
    {
      kind: "poly", x: 0, y: 0, w: 1, h: 0.8,
      points: [[0, 0], [1, 0], [1, 0.34], [0, 0.72]],
    },
    {
      kind: "poly", x: 0, y: 0, w: 1, h: 0.8,
      points: [[0, 0.72], [1, 0.34], [1, 0.8], [0, 0.8]],
    },
  ];
}

function titleBandRect(layout, pos, W, H) {
  const bandH = layout === "poster" || layout === "wide" ? 0.28 : 0.2;
  if (pos === "top") return { x: 0, y: 0, w: W, h: H * bandH };
  if (pos === "center") return { x: 0, y: H * 0.38, w: W, h: H * 0.24 };
  if (layout === "keyart" || layout === "grid" || layout === "diagonal") {
    return { x: 0, y: H * 0.8, w: W, h: H * 0.2 };
  }
  return { x: 0, y: H * (1 - bandH), w: W, h: H * bandH };
}

function applyLayout(layout) {
  state.layout = layout;
  const geom = layoutPanels(layout);
  const next = [];
  for (let i = 0; i < geom.length; i++) {
    if (state.panels[i]) next.push(state.panels[i]);
    else next.push(makePanel(i % 3));
  }
  state.panels = next;
  if (state.selectedPanel >= next.length) state.selectedPanel = 0;
}

function photoForPanel(i) {
  if (state.fillAll) return state.fillPhoto;
  return state.panels[i] ? state.panels[i].photo : 0;
}

/* Draw one photo cover-fit into a rect, with the panel's zoom and pan.
   Offsets are in panel-width/height fractions and clamped so the photo
   always covers the panel. */
function coverDraw(ctx, img, px, py, pw, ph, zoom, ox, oy) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const base = Math.max(pw / iw, ph / ih);
  const dw = iw * base * zoom;
  const dh = ih * base * zoom;
  const maxOx = Math.max(0, (dw - pw) / 2 / pw);
  const maxOy = Math.max(0, (dh - ph) / 2 / ph);
  const cx = px + pw / 2 + Math.max(-maxOx, Math.min(maxOx, ox)) * pw;
  const cy = py + ph / 2 + Math.max(-maxOy, Math.min(maxOy, oy)) * ph;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
}

function clipPanel(ctx, panel, W, H) {
  ctx.beginPath();
  if (panel.kind === "poly") {
    panel.points.forEach(function (p, i) {
      const x = p[0] * W, y = p[1] * H;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
  } else {
    ctx.rect(panel.x * W, panel.y * H, panel.w * W, panel.h * H);
  }
  ctx.clip();
}

function strokePanel(ctx, panel, W, H, width, color) {
  ctx.beginPath();
  if (panel.kind === "poly") {
    panel.points.forEach(function (p, i) {
      const x = p[0] * W, y = p[1] * H;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
  } else {
    ctx.rect(panel.x * W, panel.y * H, panel.w * W, panel.h * H);
  }
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

/* ---- effects ---- */

let halftonePattern = null;
function halftonePatternFor(ctx) {
  if (halftonePattern) return halftonePattern;
  const tile = document.createElement("canvas");
  tile.width = 12; tile.height = 12;
  const t = tile.getContext("2d");
  t.clearRect(0, 0, 12, 12);
  t.fillStyle = "#000000";
  t.beginPath(); t.arc(6, 6, 2.1, 0, Math.PI * 2); t.fill();
  halftonePattern = ctx.createPattern(tile, "repeat");
  return halftonePattern;
}

function drawHalftone(ctx, W, H) {
  ctx.save();
  ctx.globalAlpha = 0.09;
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = halftonePatternFor(ctx);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawSunburst(ctx, W, H, cx, cy, color) {
  const rays = 28;
  const R = Math.max(W, H) * 1.1;
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < rays; i++) {
    if (i % 2) continue;
    const a0 = (i / rays) * Math.PI * 2;
    const a1 = ((i + 1) / rays) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R, a0, a1);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.13;
    ctx.fill();
  }
  ctx.restore();
}

/* One stylised palm silhouette: a leaning trunk and fanning blades. */
function drawPalm(ctx, x, y, s, lean, flip) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -1 : 1, 1);
  ctx.fillStyle = "rgba(10,5,20,0.94)";
  const topX = lean * s, topY = -s;
  /* trunk: one filled, tapering shape along a curve */
  const baseW = s * 0.075, tipW = s * 0.028;
  const midX = lean * s * 0.45, midY = -s * 0.55;
  ctx.beginPath();
  ctx.moveTo(-baseW / 2, 0);
  ctx.quadraticCurveTo(midX - baseW * 0.7, midY, topX - tipW / 2, topY);
  ctx.lineTo(topX + tipW / 2, topY);
  ctx.quadraticCurveTo(midX + baseW * 0.7, midY, baseW / 2, 0);
  ctx.closePath();
  ctx.fill();
  /* fronds: two rows of wide, drooping blades fanning from the crown */
  const rows = [
    { count: 9, len: 0.78, spread: 175, droop: 0.34, wdt: 0.062 },
    { count: 5, len: 0.52, spread: 120, droop: 0.22, wdt: 0.05 },
  ];
  rows.forEach(function (row) {
    for (let i = 0; i < row.count; i++) {
      const ang = (-90 - row.spread / 2 + (i / (row.count - 1)) * row.spread) * Math.PI / 180;
      const len = s * row.len * (0.85 + 0.3 * Math.sin(i * 1.7));
      const tipX = topX + Math.cos(ang) * len;
      const tipY = topY + Math.sin(ang) * len * 0.6 + len * row.droop;
      const midFx = topX + Math.cos(ang) * len * 0.55;
      const midFy = topY + Math.sin(ang) * len * 0.55 - len * 0.06;
      const wdt = s * row.wdt;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.quadraticCurveTo(midFx + wdt, midFy + wdt * 0.7, tipX, tipY);
      ctx.quadraticCurveTo(midFx - wdt * 0.5, midFy - wdt * 0.5, topX, topY);
      ctx.closePath();
      ctx.fill();
    }
  });
  ctx.restore();
}

/* ---- title block ---- */

/* Render the title + subtitle to an offscreen canvas in the chosen
   lettering style, sized to fit maxW. Returns the canvas. */
function renderTitleBlock(text, sub, maxW, maxH, grade, style) {
  const pad = 8;
  const off = document.createElement("canvas");
  const octx = off.getContext("2d");
  let px = Math.round(maxH * 0.62);
  octx.font = px + 'px Anton, sans-serif';
  const measure = function () { return octx.measureText(text).width; };
  while (px > 24 && measure() > maxW) {
    px = Math.round(px * 0.94);
    octx.font = px + 'px Anton, sans-serif';
  }
  const subPx = Math.max(14, Math.round(px * 0.3));
  off.width = Math.ceil(Math.max(measure(), subPx * sub.length * 0.62)) + pad * 2;
  off.height = Math.ceil(px * 1.25 + subPx * 1.6) + pad * 2;
  const c = off.getContext("2d");
  c.textBaseline = "alphabetic";
  c.textAlign = "left";
  const ink = grade.title;

  function drawText(fontPx, str, y) {
    c.font = fontPx + 'px Anton, sans-serif';
    c.save();
    c.translate(pad, y);
    if (style === "comic") {
      c.fillStyle = "#ffe14d";
      c.strokeStyle = "#14060a";
      c.lineWidth = Math.max(2, fontPx * 0.09);
      c.lineJoin = "round";
      c.strokeText(str, 0, 0);
      c.fillText(str, 0, 0);
      /* halftone dots clipped inside the letters */
      c.globalCompositeOperation = "source-atop";
      c.fillStyle = "rgba(20,6,10,0.34)";
      const step = Math.max(7, fontPx * 0.14);
      const r = Math.max(1.4, fontPx * 0.032);
      for (let yy = -fontPx; yy < fontPx * 0.3; yy += step) {
        for (let xx = 0; xx < c.measureText(str).width + step; xx += step) {
          c.beginPath();
          c.arc(xx, yy, r, 0, Math.PI * 2);
          c.fill();
        }
      }
      c.restore();
      c.save();
      c.translate(pad, y);
      c.font = fontPx + 'px Anton, sans-serif';
      c.strokeStyle = "#14060a";
      c.lineWidth = Math.max(2, fontPx * 0.09);
      c.lineJoin = "round";
      c.strokeText(str, 0, 0);
    } else if (style === "outline") {
      c.strokeStyle = "#14060a";
      c.lineWidth = Math.max(3, fontPx * 0.16);
      c.lineJoin = "round";
      c.strokeText(str, 0, 0);
      c.fillStyle = "rgba(10,4,12,0.55)";
      c.fillText(str, 0, 0);
      c.strokeStyle = ink;
      c.lineWidth = Math.max(2, fontPx * 0.045);
      c.strokeText(str, 0, 0);
    } else if (style === "glow") {
      c.shadowColor = grade.glow;
      c.shadowBlur = fontPx * 0.4;
      c.fillStyle = ink;
      c.fillText(str, 0, 0);
      c.fillText(str, 0, 0);
      c.shadowBlur = 0;
      c.strokeStyle = "rgba(10,4,12,0.85)";
      c.lineWidth = Math.max(1.5, fontPx * 0.03);
      c.strokeText(str, 0, 0);
    } else { /* solid */
      c.shadowColor = "rgba(0,0,0,0.55)";
      c.shadowBlur = fontPx * 0.08;
      c.shadowOffsetY = fontPx * 0.045;
      c.strokeStyle = "rgba(10,4,12,0.9)";
      c.lineWidth = Math.max(2, fontPx * 0.06);
      c.lineJoin = "round";
      c.strokeText(str, 0, 0);
      c.fillStyle = ink;
      c.fillText(str, 0, 0);
    }
    c.restore();
  }

  drawText(px, text, pad + px);
  /* subtitle, letterspaced, in the grade's accent */
  c.save();
  c.translate(pad, pad + px * 1.25 + subPx);
  c.font = subPx + 'px Anton, sans-serif';
  c.fillStyle = grade.sub;
  c.shadowColor = "rgba(0,0,0,0.6)";
  c.shadowBlur = subPx * 0.2;
  try { c.letterSpacing = Math.round(subPx * 0.42) + "px"; } catch (e) { /* older canvas */ }
  c.fillText(sub, 0, 0);
  c.restore();
  return off;
}

/* ---- the cover ---- */

function drawCover(ctx, W, H, st) {
  const grade = GRADES[st.grade] || GRADES.sunset;
  const g = Math.max(3, Math.round(Math.min(W, H) * 0.012));
  const geom = layoutPanels(st.layout);
  const band = titleBandRect(st.layout, st.titlePos, W, H);

  /* dark base shows through the gutters */
  ctx.save();
  ctx.fillStyle = "#0d0518";
  ctx.fillRect(0, 0, W, H);

  /* panels: photo + grade tint */
  geom.forEach(function (panel, i) {
    const photo = st.photos[photoForPanel(i)];
    const px = panel.x * W, py = panel.y * H;
    const pw = panel.w * W, ph = panel.h * H;
    const inset = g / 2;
    ctx.save();
    clipPanel(ctx, panel, W, H);
    if (photo && photo.img) {
      const p = st.panels[i] || makePanel(0);
      coverDraw(ctx, photo.img, px + inset, py + inset, pw - inset * 2, ph - inset * 2,
        p.zoom, p.ox, p.oy);
    } else {
      const grad = ctx.createLinearGradient(px, py, px + pw, py + ph);
      grad.addColorStop(0, grade.sky[0]);
      grad.addColorStop(1, grade.sky[2]);
      ctx.fillStyle = grad;
      ctx.fillRect(px, py, pw, ph);
    }
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = grade.tintAlpha;
    ctx.fillStyle = grade.tint;
    ctx.fillRect(px, py, pw, ph);
    ctx.restore();
  });

  /* sky gradient wash over the whole cover */
  ctx.save();
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, grade.sky[0]);
  wash.addColorStop(0.5, grade.sky[1]);
  wash.addColorStop(1, grade.sky[2]);
  ctx.globalAlpha = 0.16;
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  if (st.halftone) drawHalftone(ctx, W, H);

  /* sunburst rays behind the title */
  if (st.sunburst) {
    drawSunburst(ctx, W, H, W / 2, band.y + band.h / 2, grade.glow);
  }

  /* palm silhouettes framing the bottom corners */
  if (st.palms) {
    drawPalm(ctx, W * 0.03, H * 1.04, H * 0.3, 0.28, false);
    drawPalm(ctx, W * 0.97, H * 1.04, H * 0.26, 0.28, true);
  }

  /* comic gutters: thick dark outlines around every panel */
  geom.forEach(function (panel) {
    strokePanel(ctx, panel, W, H, Math.max(3, g * 0.9), "#0d0518");
  });

  /* title scrim + title block */
  const scrim = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
  scrim.addColorStop(0, "rgba(10,3,18,0)");
  scrim.addColorStop(0.25, grade.band);
  scrim.addColorStop(0.75, grade.band);
  scrim.addColorStop(1, "rgba(10,3,18,0)");
  ctx.fillStyle = scrim;
  ctx.fillRect(band.x, band.y, band.w, band.h);

  const badgeW = st.badge ? band.h * 0.66 : 0;
  const titleMaxW = band.w - badgeW - W * 0.06;
  const titlePx = renderTitleBlock(
    (st.title || "LEONIDA NIGHTS").toUpperCase(),
    (st.subtitle || "").toUpperCase(),
    Math.max(60, titleMaxW),
    band.h * st.titleSize,
    grade, st.lettering);
  const tx = band.x + (band.w - badgeW - titlePx.width) / 2;
  const ty = band.y + (band.h - titlePx.height) / 2;
  ctx.drawImage(titlePx, tx, ty);

  /* VI badge: pink disc with a white ring, right of the title */
  if (st.badge) {
    const r = band.h * 0.33;
    const cx = band.x + band.w - r - W * 0.02;
    const cy = band.y + band.h / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#ff2d78";
    ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.12);
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = Math.round(r * 0.95) + 'px Anton, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("VI", cx, cy + r * 0.05);
    ctx.restore();
  }

  /* vignette + outer frame */
  const vg = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.42,
    W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.34)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = Math.max(2, W * 0.002);
  ctx.strokeRect(1, 1, W - 2, H - 2);
  ctx.restore();
}

/* ---- editor wiring ---- */

const canvas = document.getElementById("coverCanvas");
const ctx = canvas.getContext("2d");
const sizeLabel = document.getElementById("sizeLabel");
const layoutLabel = document.getElementById("layoutLabel");
const panelLabel = document.getElementById("panelLabel");
const zoomSlider = document.getElementById("zoomSlider");
const zoomValue = document.getElementById("zoomValue");
const exportStatus = document.getElementById("exportStatus");
const exportSizeLabel = document.getElementById("exportSizeLabel");

function currentGeom() {
  return layoutPanels(state.layout);
}

function drawPreview() {
  const dims = SIZES[state.size];
  const aspect = dims[1] / dims[0];
  const pw = dims[0] > dims[1] ? 960 : 620;
  canvas.width = pw;
  canvas.height = Math.round(pw * aspect);
  drawCover(ctx, canvas.width, canvas.height, state);
  sizeLabel.textContent = state.size.replace("x", " × ");
  layoutLabel.textContent = LAYOUT_NAMES[state.layout];
  panelLabel.textContent = "Panel " + (state.selectedPanel + 1) +
    " of " + currentGeom().length;
  exportSizeLabel.textContent = state.size.replace("x", " × ");
  const p = state.panels[state.selectedPanel];
  if (p) {
    zoomSlider.value = String(p.zoom);
    zoomValue.textContent = p.zoom.toFixed(2) + "×";
  }
  document.querySelectorAll(".thumb-btn[data-photo]").forEach(function (b) {
    b.classList.toggle("on",
      Number(b.dataset.photo) === photoForPanel(state.selectedPanel));
  });
  document.querySelectorAll("#layoutBtns button").forEach(function (b) {
    b.classList.toggle("on", b.dataset.layout === state.layout);
  });
  document.querySelectorAll("#sizeBtns button").forEach(function (b) {
    b.classList.toggle("on", b.dataset.size === state.size);
  });
  document.querySelectorAll("#gradeBtns button").forEach(function (b) {
    b.classList.toggle("on", b.dataset.grade === state.grade);
  });
  document.querySelectorAll("#letterBtns button").forEach(function (b) {
    b.classList.toggle("on", b.dataset.lettering === state.lettering);
  });
}

function refresh() { drawPreview(); }

function setLayout(layout) {
  applyLayout(layout);
  refresh();
}

function setSize(size) {
  state.size = size;
  refresh();
}

function applyKeyArt() {
  state.layout = "keyart";
  state.size = "1920x1080";
  state.grade = "sunset";
  state.lettering = "comic";
  state.title = "LEONIDA NIGHTS";
  state.subtitle = "VICE CITY";
  state.titleSize = 1;
  state.titlePos = "bottom";
  state.sunburst = true;
  state.halftone = true;
  state.palms = true;
  state.badge = true;
  state.fillAll = false;
  applyLayout("keyart");
  state.panels[0] = makePanel(0);
  if (state.panels[1]) state.panels[1] = makePanel(1);
  if (state.panels[2]) state.panels[2] = makePanel(2);
  state.selectedPanel = 0;
  document.getElementById("titleInput").value = state.title;
  document.getElementById("subtitleInput").value = state.subtitle;
  document.getElementById("titleSizeSlider").value = "1";
  document.getElementById("titlePosSelect").value = "bottom";
  document.getElementById("sunburstToggle").checked = true;
  document.getElementById("halftoneToggle").checked = true;
  document.getElementById("palmsToggle").checked = true;
  document.getElementById("badgeToggle").checked = true;
  document.getElementById("fillAllToggle").checked = false;
  document.getElementById("fillAllRow").hidden = true;
  refresh();
}

/* ---- canvas pointer: select, pan, zoom ---- */

function canvasPoint(ev) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (ev.clientX - r.left) * (canvas.width / r.width),
    y: (ev.clientY - r.top) * (canvas.height / r.height),
  };
}

function hitPanel(pt) {
  const geom = currentGeom();
  for (let i = geom.length - 1; i >= 0; i--) {
    const p = geom[i];
    if (p.kind === "poly") {
      const bx = p.x * canvas.width, by = p.y * canvas.height;
      const bw = p.w * canvas.width, bh = p.h * canvas.height;
      if (pt.x >= bx && pt.x <= bx + bw && pt.y >= by && pt.y <= by + bh) return i;
    } else if (pt.x >= p.x * canvas.width && pt.x <= (p.x + p.w) * canvas.width &&
      pt.y >= p.y * canvas.height && pt.y <= (p.y + p.h) * canvas.height) {
      return i;
    }
  }
  return -1;
}

let dragging = null;
canvas.addEventListener("pointerdown", function (ev) {
  const pt = canvasPoint(ev);
  const hit = hitPanel(pt);
  if (hit >= 0) {
    state.selectedPanel = hit;
    dragging = { x: pt.x, y: pt.y, moved: false };
    canvas.setPointerCapture(ev.pointerId);
    refresh();
  }
});
canvas.addEventListener("pointermove", function (ev) {
  if (!dragging) return;
  const pt = canvasPoint(ev);
  const geom = currentGeom()[state.selectedPanel];
  const p = state.panels[state.selectedPanel];
  if (!geom || !p) return;
  const pw = geom.w * canvas.width, ph = geom.h * canvas.height;
  p.ox += (pt.x - dragging.x) / pw;
  p.oy += (pt.y - dragging.y) / ph;
  dragging.x = pt.x;
  dragging.y = pt.y;
  dragging.moved = true;
  refresh();
});
canvas.addEventListener("pointerup", function () { dragging = null; });
canvas.addEventListener("wheel", function (ev) {
  ev.preventDefault();
  const p = state.panels[state.selectedPanel];
  if (!p) return;
  p.zoom = Math.max(1, Math.min(3, p.zoom * Math.exp(-ev.deltaY * 0.0012)));
  refresh();
}, { passive: false });

zoomSlider.addEventListener("input", function () {
  const p = state.panels[state.selectedPanel];
  if (!p) return;
  p.zoom = Number(zoomSlider.value);
  refresh();
});

/* ---- photo slots ---- */

function loadImage(src) {
  return new Promise(function (resolve, reject) {
    const img = new Image();
    img.onload = function () { resolve(img); };
    img.onerror = reject;
    img.src = src;
  });
}

function setSlotThumb(slot, src) {
  const el = document.getElementById("slotImg" + slot);
  if (el) el.src = src;
  document.querySelectorAll(".slot").forEach(function (s) {
    s.classList.toggle("active", Number(s.dataset.slot) === state.selectedPanel % 3);
  });
}

function bindUpload(slot) {
  const input = document.getElementById("upload" + slot);
  input.addEventListener("change", function () {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      loadImage(reader.result).then(function (img) {
        state.photos[slot] = { img: img, name: file.name };
        setSlotThumb(slot, reader.result);
        refresh();
        exportStatus.textContent = "Photo " + (slot + 1) + " loaded: " + file.name;
      });
    };
    reader.readAsDataURL(file);
  });
}

/* ---- controls ---- */

document.getElementById("keyArtBtn").addEventListener("click", applyKeyArt);

document.querySelectorAll("#layoutBtns button").forEach(function (b) {
  b.addEventListener("click", function () { setLayout(b.dataset.layout); });
});
document.querySelectorAll("#sizeBtns button").forEach(function (b) {
  b.addEventListener("click", function () { setSize(b.dataset.size); });
});
document.querySelectorAll("#gradeBtns button").forEach(function (b) {
  b.addEventListener("click", function () {
    state.grade = b.dataset.grade;
    refresh();
  });
});
document.querySelectorAll("#letterBtns button").forEach(function (b) {
  b.addEventListener("click", function () {
    state.lettering = b.dataset.lettering;
    refresh();
  });
});
document.querySelectorAll(".thumb-btn[data-photo]").forEach(function (b) {
  b.addEventListener("click", function () {
    const i = Number(b.dataset.photo);
    if (state.fillAll) {
      state.fillPhoto = i;
    } else if (state.panels[state.selectedPanel]) {
      state.panels[state.selectedPanel].photo = i;
    }
    refresh();
  });
});
document.querySelectorAll(".thumb-btn[data-fill]").forEach(function (b) {
  b.addEventListener("click", function () {
    state.fillPhoto = Number(b.dataset.fill);
    refresh();
  });
});

document.getElementById("fillAllToggle").addEventListener("change", function (ev) {
  state.fillAll = ev.target.checked;
  document.getElementById("fillAllRow").hidden = !state.fillAll;
  refresh();
});
document.getElementById("titleInput").addEventListener("input", function (ev) {
  state.title = ev.target.value.toUpperCase();
  refresh();
});
document.getElementById("subtitleInput").addEventListener("input", function (ev) {
  state.subtitle = ev.target.value.toUpperCase();
  refresh();
});
document.getElementById("titleSizeSlider").addEventListener("input", function (ev) {
  state.titleSize = Number(ev.target.value);
  refresh();
});
document.getElementById("titlePosSelect").addEventListener("change", function (ev) {
  state.titlePos = ev.target.value;
  refresh();
});
document.getElementById("sunburstToggle").addEventListener("change", function (ev) {
  state.sunburst = ev.target.checked;
  refresh();
});
document.getElementById("halftoneToggle").addEventListener("change", function (ev) {
  state.halftone = ev.target.checked;
  refresh();
});
document.getElementById("palmsToggle").addEventListener("change", function (ev) {
  state.palms = ev.target.checked;
  refresh();
});
document.getElementById("badgeToggle").addEventListener("change", function (ev) {
  state.badge = ev.target.checked;
  refresh();
});

/* ---- export ---- */

function exportPNG(sizeKey) {
  const key = sizeKey || state.size;
  const dims = SIZES[key];
  const off = document.createElement("canvas");
  off.width = dims[0];
  off.height = dims[1];
  const octx = off.getContext("2d");
  drawCover(octx, dims[0], dims[1], state);
  return new Promise(function (resolve) {
    off.toBlob(function (blob) {
      const reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.readAsDataURL(blob);
    }, "image/png");
  });
}

function doExport() {
  exportStatus.textContent = "Rendering " + state.size + "…";
  exportPNG().then(function (dataUrl) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "leonida-nights-" + state.size + ".png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    exportStatus.textContent = "Exported leonida-nights-" + state.size + ".png";
  });
}
document.getElementById("exportBtn").addEventListener("click", doExport);
document.getElementById("exportBtn2").addEventListener("click", doExport);

/* ---- boot ---- */

const ready = (async function boot() {
  try { await document.fonts.load('100px Anton'); } catch (e) { /* fallback font */ }
  await document.fonts.ready;
  const samples = ["samples/sample-1.jpg", "samples/sample-2.jpg", "samples/sample-3.jpg"];
  for (let i = 0; i < samples.length; i++) {
    try {
      const img = await loadImage(samples[i]);
      state.photos[i] = { img: img, name: "sample-" + (i + 1) + ".jpg" };
      setSlotThumb(i, samples[i]);
    } catch (e) {
      state.photos[i] = null;
    }
  }
  bindUpload(0); bindUpload(1); bindUpload(2);
  applyKeyArt();
  return true;
})();

window.CoverArt = {
  state: state,
  ready: ready,
  drawPreview: drawPreview,
  applyKeyArt: applyKeyArt,
  setLayout: setLayout,
  setSize: setSize,
  exportPNG: exportPNG,
};
