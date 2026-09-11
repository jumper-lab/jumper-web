// Upload de imagem do blog — multipart/form-data com campo "file".
// Requer senha válida em x-blog-pass. Salva em public/uploads/blog/.
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { checkPassword } from '../../lib/blogStore.js';
import { withBase } from '../../lib/paths.js';

export const prerender = false;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const OK_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif', 'image/gif': '.gif' };
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST({ request }) {
  let form;
  try { form = await request.formData(); } catch { return json({ error: 'multipart form expected' }, 400); }
  // Senha via header (admin) ou via campo do form (uploads programáticos sem preflight CORS).
  const pass = request.headers.get('x-blog-pass') ?? form.get('pass');
  if (!checkPassword(pass)) return json({ error: 'unauthorized' }, 401);
  const file = form.get('file');
  if (!file || typeof file === 'string') return json({ error: 'file field required' }, 400);
  const ext = OK_TYPES[file.type];
  if (!ext) return json({ error: 'unsupported type' }, 415);
  if (file.size > MAX_BYTES) return json({ error: 'file too large (max 8MB)' }, 413);

  const base = (file.name || 'imagem').replace(/\.[^.]+$/, '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40) || 'imagem';
  const nome = `${base}-${Date.now().toString(36)}${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads', 'blog');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, nome), Buffer.from(await file.arrayBuffer()));
  return json({ ok: true, url: withBase(`/uploads/blog/${nome}`) });
}
