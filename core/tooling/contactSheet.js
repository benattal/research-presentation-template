/**
 * The contact sheet of a capture run: one card per frame with its
 * screenshot and findings, filterable to the frames that need attention.
 * Plain HTML with relative image paths, so it opens from disk.
 */
import { writeFileSync } from 'node:fs';

function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

function frameCard(frame, previousRunPath) {
  const changed = frame.diff && frame.diff.diffFile;
  const classes = [
    'card',
    frame.errors.length && 'has-error',
    frame.warnings.length && 'has-warning',
    changed && 'has-change',
  ].filter(Boolean).join(' ');
  const findings = [
    ...frame.errors.map((text) => `<li class="error">${escapeHtml(text)}</li>`),
    ...frame.warnings.map((text) => `<li class="warning">${escapeHtml(text)}</li>`),
  ].join('');
  const views = changed && previousRunPath
    ? `<div class="views">
         <button data-src="${frame.file}" class="active">now</button>
         <button data-src="${previousRunPath}/${frame.file}">before</button>
         <button data-src="${frame.diff.diffFile}">diff</button>
         <span>${(frame.diff.ratio * 100).toFixed(1)}% changed</span>
       </div>`
    : '';
  return `<figure class="${classes}">
  <a href="${frame.file}" target="_blank"><img src="${frame.file}" alt="${escapeHtml(frame.slideId)}"></a>
  <figcaption>
    <strong>${frame.slideIndex + 1}. ${escapeHtml(frame.title || frame.slideId)}</strong>
    <span class="meta">${escapeHtml(frame.slideId)} · ${escapeHtml(frame.layout)} · step ${frame.step}/${frame.steps}</span>
    ${views}
    ${findings ? `<ul>${findings}</ul>` : ''}
  </figcaption>
</figure>`;
}

export function writeContactSheet(path, summary, previousRunPath) {
  const { frames } = summary;
  const count = (predicate) => frames.filter(predicate).length;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(summary.title)}: capture ${escapeHtml(summary.capturedAt)}</title>
<style>
  body { margin: 0; padding: 24px; font-family: system-ui, sans-serif; background: #0d0d12; color: #e8e8f0; }
  h1 { font-size: 1.3rem; margin: 0 0 4px; }
  .summary { color: #9898b0; margin-bottom: 16px; }
  .filters button, .views button { background: #1e1e30; color: #e8e8f0; border: 1px solid #333; border-radius: 6px; padding: 4px 10px; cursor: pointer; }
  .filters button.active, .views button.active { background: #6c63ff; border-color: #6c63ff; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 16px; margin-top: 16px; }
  .card { margin: 0; background: #16161f; border: 2px solid transparent; border-radius: 8px; overflow: hidden; }
  .card.has-warning { border-color: #ff9800; }
  .card.has-error { border-color: #e84393; }
  .card img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: contain; background: #000; }
  figcaption { padding: 8px 10px; font-size: 0.85rem; }
  .meta { display: block; color: #9898b0; font-size: 0.75rem; margin-top: 2px; }
  .views { margin-top: 6px; display: flex; gap: 6px; align-items: center; font-size: 0.75rem; color: #00d2ff; }
  ul { margin: 6px 0 0; padding-left: 18px; }
  li.error { color: #ff7aa8; }
  li.warning { color: #ffb74d; }
  body.only-problems .card:not(.has-error):not(.has-warning) { display: none; }
  body.only-changed .card:not(.has-change) { display: none; }
</style>
</head>
<body>
<h1>${escapeHtml(summary.title)} (${escapeHtml(summary.presentation)})</h1>
<div class="summary">
  Captured ${escapeHtml(summary.capturedAt)} · ${frames.length} frames ·
  ${count((f) => f.errors.length)} with errors · ${count((f) => f.warnings.length)} with warnings
  ${summary.comparedWith ? ` · ${count((f) => f.diff?.diffFile)} changed since ${escapeHtml(summary.comparedWith)}` : ''}
</div>
<div class="filters">
  <button data-filter="" class="active">All</button>
  <button data-filter="only-problems">Errors and warnings</button>
  <button data-filter="only-changed">Changed</button>
</div>
<div class="grid">
${frames.map((frame) => frameCard(frame, previousRunPath)).join('\n')}
</div>
<script>
  document.querySelectorAll('.filters button').forEach((button) => button.addEventListener('click', () => {
    document.body.className = button.dataset.filter;
    document.querySelectorAll('.filters button').forEach((b) => b.classList.toggle('active', b === button));
  }));
  document.querySelectorAll('.views button').forEach((button) => button.addEventListener('click', () => {
    const card = button.closest('.card');
    card.querySelector('img').src = button.dataset.src;
    card.querySelector('a').href = button.dataset.src;
    card.querySelectorAll('.views button').forEach((b) => b.classList.toggle('active', b === button));
  }));
</script>
</body>
</html>
`;
  writeFileSync(path, html);
}
