// Fixed scenes for screenshots: ?shot=editor shows the page with the sample
// photos loaded; ?shot=cover shows the cover alone, full frame. Query params
// pick the layout, size, grade, caption, subtitle and style, and `photos`
// names the samples (comma-separated, e.g. photos=sample-2,sample-1,sample-3).
// window.__shotReady is set once the scene is painted.
export async function runShot(shot, query, editor, state) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const layout = query.get('layout');
  const size = query.get('size');
  const grade = query.get('grade');
  const style = query.get('style');
  if (layout) editor.setLayout(layout);
  if (size) editor.setSize(size);
  if (grade) editor.setGrade(grade);
  if (style) editor.setCaptionStyle(style);
  if (query.get('caption') !== null) editor.setCaption(query.get('caption'));
  if (query.get('subtitle') !== null) editor.setSubtitle(query.get('subtitle'));
  const photos = (query.get('photos') ?? 'sample-1,sample-2,sample-3').split(',');
  await Promise.all(photos.map((sample, i) => editor.loadSlotSample(i, sample.trim())));
  editor.selectPanel(0);
  await document.fonts.load('100px Anton');
  if (shot === 'cover') editor.drawCoverOnly();
  else editor.redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
