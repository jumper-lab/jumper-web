// API do Blog Autônomo Jumper.
// GET sem senha: somente posts published. Com senha válida (header x-blog-pass): todos.
// POST com senha: create | update | delete. Senha errada: 401.
import { getAllPosts, getPublishedPosts, savePosts, slugify, checkPassword } from '../../lib/blogStore.js';

export const prerender = false;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export async function GET({ request }) {
  const pass = request.headers.get('x-blog-pass');
  if (pass) {
    if (!checkPassword(pass)) return json({ error: 'unauthorized' }, 401);
    return json(await getAllPosts());
  }
  return json(await getPublishedPosts());
}

export async function POST({ request }) {
  const pass = request.headers.get('x-blog-pass');
  if (!checkPassword(pass)) return json({ error: 'unauthorized' }, 401);

  let payload;
  try { payload = await request.json(); } catch { return json({ error: 'invalid json' }, 400); }
  const { action, post, slug } = payload ?? {};
  const posts = (await getAllPosts()).map(({ dateLabel: _dl, ...p }) => p);

  if (action === 'create') {
    if (!post?.title) return json({ error: 'title required' }, 400);
    const novo = {
      slug: post.slug?.trim() ? slugify(post.slug) : slugify(post.title),
      title: post.title,
      excerpt: post.excerpt ?? '',
      body: post.body ?? '',
      cover: post.cover ?? '',
      date: post.date || new Date().toISOString().slice(0, 10),
      status: ['published', 'draft', 'archived'].includes(post.status) ? post.status : 'draft',
    };
    if (posts.some((p) => p.slug === novo.slug)) novo.slug += `-${Date.now().toString(36)}`;
    posts.push(novo);
    await savePosts(posts);
    return json({ ok: true, slug: novo.slug });
  }

  if (action === 'update') {
    const i = posts.findIndex((p) => p.slug === slug);
    if (i < 0) return json({ error: 'not found' }, 404);
    posts[i] = {
      ...posts[i],
      ...post,
      slug: posts[i].slug,
      status: ['published', 'draft', 'archived'].includes(post?.status) ? post.status : posts[i].status,
    };
    await savePosts(posts);
    return json({ ok: true });
  }

  if (action === 'delete') {
    const restantes = posts.filter((p) => p.slug !== slug);
    if (restantes.length === posts.length) return json({ error: 'not found' }, 404);
    await savePosts(restantes);
    return json({ ok: true });
  }

  return json({ error: 'unknown action' }, 400);
}
