const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export function renderSourceTags(sourceLabel) {
  const sources = sourceLabel.split('·').map((source) => source.trim().toLowerCase() === 'jumper-hoster-dev' ? 'jumper-hoster' : source.trim()).filter(Boolean);
  const hasKinsta = sources.some((source) => source.toLowerCase() === 'kinsta');
  const hasWebmaster = sources.some((source) => ['jumper-web', 'jumper-hoster'].includes(source.toLowerCase()));
  const tags = hasKinsta
    ? sources.map((source) => `<span class="tag${source.toLowerCase() === 'kinsta' ? ' tag-kinsta' : ''}">${escapeHtml(source)}</span>`).join('')
    : `<span class="tag">${escapeHtml(sources.join(' · '))}</span>`;
  return `<span class="card-tags">${tags}${hasWebmaster ? '<span class="tag tag-webmaster">Webmaster</span>' : ''}</span>`;
}
