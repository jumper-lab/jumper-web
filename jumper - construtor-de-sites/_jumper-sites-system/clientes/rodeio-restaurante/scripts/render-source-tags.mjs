const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export function renderSourceTags(sourceLabel) {
  const sources = sourceLabel.split('·').map((source) => source.trim()).filter(Boolean);
  const hasKinsta = sources.some((source) => source.toLowerCase() === 'kinsta');
  const tags = hasKinsta
    ? sources.map((source) => `<span class="tag${source.toLowerCase() === 'kinsta' ? ' tag-kinsta' : ''}">${escapeHtml(source)}</span>`).join('')
    : `<span class="tag">${escapeHtml(sourceLabel)}</span>`;
  return `<span class="card-tags">${tags}</span>`;
}
