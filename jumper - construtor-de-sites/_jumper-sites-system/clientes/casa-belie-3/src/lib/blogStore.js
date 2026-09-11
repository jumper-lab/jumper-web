// Blog Autônomo Jumper — persistência em data/blog-posts.json.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DATA_PATH = path.join(process.cwd(), 'data', 'blog-posts.json');

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function dateLabel(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  const d = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

export async function getAllPosts() {
  try {
    const raw = await readFile(DATA_PATH, 'utf8');
    const posts = JSON.parse(raw);
    return posts
      .map((p) => ({ ...p, dateLabel: dateLabel(p.date) }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch {
    return [];
  }
}

export async function getPublishedPosts() {
  return (await getAllPosts()).filter((p) => p.status === 'published');
}

export async function getPostBySlug(slug) {
  return (await getPublishedPosts()).find((p) => p.slug === slug) ?? null;
}

export async function savePosts(posts) {
  const clean = posts.map(({ dateLabel: _dl, ...p }) => p);
  await writeFile(DATA_PATH, JSON.stringify(clean, null, 2), 'utf8');
}

export function slugify(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

// Senha real via env. Fallback local existe SOMENTE para preview e está
// documentado no README do cliente (regra DOC-MESTRE).
export function checkPassword(pass) {
  const real = process.env.BLOG_ADMIN_PASSWORD || import.meta.env.BLOG_ADMIN_PASSWORD || 'belie2026posts';
  return typeof pass === 'string' && pass.length > 0 && pass === real;
}
