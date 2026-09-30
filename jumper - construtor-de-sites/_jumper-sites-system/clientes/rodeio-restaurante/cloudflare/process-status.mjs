const ACTIVE_WINDOW_MS = 180_000;
const GITHUB_WINDOW_MS = 1_800_000;
const WORKERS = new Set(['jumper-hoster', 'jumper-hoster-dev']);
const REPOSITORIES = new Set(['jumper-web', 'jumper-site']);

export async function cloudflareProcesses(namespace, { githubEventsEnabled = false, now = Date.now() } = {}) {
  if (!namespace?.list || !namespace?.get) return { available: false, items: [] };
  try {
    const listing = await namespace.list({ limit: 50 });
    if (!listing.list_complete) return { available: false, items: [] };
    const values = await Promise.all(listing.keys.map(({ name }) => namespace.get(name, 'json')));
    const items = values.filter((value) => {
      if (!value || typeof value.phase !== 'string') return false;
      const isWorker = WORKERS.has(value.source);
      if (!isWorker && !REPOSITORIES.has(value.source)) return false;
      const age = now - Date.parse(value.updatedAt || '');
      return Number.isFinite(age) && age >= -30_000 && age <= (isWorker ? ACTIVE_WINDOW_MS : GITHUB_WINDOW_MS);
    }).map((value) => ({
      source: value.source,
      phase: value.phase.slice(0, 100),
      startedAt: value.startedAt,
      updatedAt: value.updatedAt,
      url: value.url && /^https:\/\/github\.com\/jumper-lab\/(jumper-web|jumper-site)\/actions\/runs\/\d+$/.test(value.url)
        ? value.url : /^[a-f0-9]{40}$/.test(value.commitSha || '')
        ? `https://github.com/jumper-lab/jumper-web/commit/${value.commitSha}` : null,
    }));
    return { available: true, githubEventsEnabled, items };
  } catch {
    return { available: false, items: [] };
  }
}

export async function githubWebhook(request, namespace, secret) {
  if (!secret || !namespace?.put || !namespace?.delete) return new Response('Not Found', { status: 404 });
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const signature = /^sha256=([a-f0-9]{64})$/.exec(request.headers.get('X-Hub-Signature-256') || '');
  if (!signature || Number(request.headers.get('Content-Length') || 0) > 1_000_000) return new Response('Unauthorized', { status: 401 });
  const body = await request.arrayBuffer();
  if (body.byteLength > 1_000_000) return new Response('Payload Too Large', { status: 413 });
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const bytes = Uint8Array.from(signature[1].match(/../g), (pair) => Number.parseInt(pair, 16));
  if (!(await crypto.subtle.verify('HMAC', key, bytes, body))) return new Response('Unauthorized', { status: 401 });
  if (request.headers.get('X-GitHub-Event') !== 'workflow_run') return new Response(null, { status: 202 });
  let payload;
  try { payload = JSON.parse(new TextDecoder().decode(body)); } catch { return new Response('Bad Request', { status: 400 }); }
  const repository = payload.repository?.full_name;
  const repo = repository?.startsWith('jumper-lab/') ? repository.slice('jumper-lab/'.length) : null;
  const run = payload.workflow_run;
  if (!REPOSITORIES.has(repo) || !Number.isInteger(run?.id) || run.html_url !== `https://github.com/jumper-lab/${repo}/actions/runs/${run.id}`) {
    return new Response('Bad Request', { status: 400 });
  }
  const recordKey = `github/${repo}/${run.id}`;
  if (payload.action === 'completed') {
    await namespace.delete(recordKey);
  } else if (['requested', 'in_progress'].includes(payload.action) && ['queued', 'in_progress', 'waiting', 'pending', 'requested'].includes(run.status)) {
    await namespace.put(recordKey, JSON.stringify({
      source: repo,
      phase: run.status === 'in_progress' ? `GitHub: ${String(run.name || 'Verificação').slice(0, 70)} em execução` : `GitHub: ${String(run.name || 'Verificação').slice(0, 70)} na fila`,
      startedAt: run.run_started_at || run.created_at || null,
      updatedAt: new Date().toISOString(),
      url: run.html_url,
    }), { expirationTtl: 1800 });
  }
  return new Response(null, { status: 202 });
}
