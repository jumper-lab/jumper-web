const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export function renderSourceTags(sourceLabel) {
  const labels = sourceLabel.split('·').map((source) => source.trim())
    .filter(Boolean)
    .map((source) => source.toLowerCase() === 'jumper-hoster-dev' ? 'jumper-hoster' : source);
  const hasWebmaster = labels.some((label) => ['jumper-web', 'jumper-hoster', 'webmaster'].includes(label.toLowerCase()));
  const sources = labels.filter((label) => label.toLowerCase() !== 'webmaster');
  const hostClasses = new Map([['kinsta', ' tag-kinsta'], ['hostinger', ' tag-hostinger']]);
  const separateHosts = sources.some((source) => hostClasses.has(source.toLowerCase()));
  const tags = separateHosts
    ? sources.map((source) => `<span class="tag${hostClasses.get(source.toLowerCase()) ?? ''}">${escapeHtml(source)}</span>`).join('')
    : sources.length ? `<span class="tag">${escapeHtml(sources.join(' · '))}</span>` : '';
  return `<span class="card-tags">${tags}${hasWebmaster ? '<span class="tag tag-webmaster">Webmaster</span>' : ''}</span>`;
}
