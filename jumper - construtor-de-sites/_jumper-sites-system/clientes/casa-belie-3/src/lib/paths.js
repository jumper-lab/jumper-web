const base = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export function withBase(path = '') {
  const value = String(path);
  if (/^(?:https?:)?\/\//.test(value) || value.startsWith('data:')) return value;
  if (value === base.slice(0, -1) || value.startsWith(base)) return value;
  return `${base}${value.replace(/^\/+/, '')}`;
}
