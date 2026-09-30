import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compareWebDeployment, hubStatus, recentActivity, releaseAlerts, releaseState } from '../../cloudflare/hub-status.mjs';
import worker from '../../cloudflare/worker.mjs';

const sha = 'a'.repeat(40);
const repositories = [{ id: 'jumper-web', sha }, { id: 'jumper-site', sha: 'b'.repeat(40) }];

test('only a verified version tag can claim that GitHub and Cloudflare match', () => {
  assert.equal(releaseState({ id: 'version-1', tag: `git-${sha}` }, repositories).hoster.state, 'matched');
  assert.equal(releaseState({ id: 'version-2', tag: `git-${'c'.repeat(40)}` }, repositories).hoster.state, 'different');
  assert.equal(releaseState({ id: 'version-3' }, repositories).hoster.state, 'unverified');
  assert.equal(releaseState({ id: 'version-4', tag: `git-${sha}` }, [{ id: 'jumper-web', sha: null }]).hoster.state, 'unverified');
  assert.equal(releaseState({}, repositories, { commitSha: 'b'.repeat(40), state: 'success' }).siteDeployment.relation, 'matched');
  assert.equal(releaseState({}, repositories, { commitSha: sha, state: 'success' }).siteDeployment.relation, 'different');
  assert.equal(releaseState({}, repositories, { commitSha: 'b'.repeat(40), state: 'pending' }).siteDeployment.relation, 'unverified');
});

test('publication alerts distinguish mismatches, failures and missing evidence', () => {
  const matched = releaseState(
    { id: 'version-1', tag: `git-${sha}` }, repositories,
    { commitSha: 'b'.repeat(40), state: 'success' },
  );
  assert.deepEqual(matched.alerts, []);

  const overwritten = releaseState(
    { id: 'version-2', tag: `git-${'c'.repeat(40)}` }, repositories,
    { commitSha: sha, state: 'success' },
  );
  assert.deepEqual(overwritten.alerts.map((alert) => alert.level), ['attention', 'attention']);
  assert.match(overwritten.alerts[0].detail, /main \(versão principal do GitHub\)/);
  assert.match(overwritten.alerts[0].detail, /sobrescrita/);

  const failed = releaseState(
    { id: 'version-3', tag: `git-${sha}` }, repositories,
    { commitSha: 'b'.repeat(40), state: 'failure' },
  );
  assert.equal(failed.alerts.length, 1);
  assert.equal(failed.alerts[0].title, 'Deploy do site falhou');
  assert.equal(failed.alerts[0].level, 'attention');

  const unknown = releaseAlerts(
    [{ id: 'jumper-web', sha: null }, { id: 'jumper-site', sha: null }],
    { commitSha: null, state: 'unknown', relation: 'unverified' },
    { commitSha: null, state: 'unverified' },
  );
  assert.deepEqual(unknown.map((alert) => alert.level), ['partial', 'partial']);
});

test('hub-only GitHub changes do not create a false hoster overwrite alert', async () => {
  const deployed = '1'.repeat(40);
  const main = '2'.repeat(40);
  const hubOnly = await compareWebDeployment(deployed, main, async () => Response.json({
    status: 'ahead',
    files: [{ filename: 'jumper - construtor-de-sites/_jumper-sites-system/clientes/rodeio-restaurante/cloudflare/dashboard.html' }],
  }));
  assert.equal(hubOnly, 'matched');
  const state = releaseState({ id: 'version-1', tag: `git-${deployed}` }, [{ id: 'jumper-web', sha: main }], undefined, hubOnly);
  assert.equal(state.hoster.state, 'matched');
  assert.equal(state.alerts.some((alert) => alert.source === 'jumper-hoster'), false);

  const pending = await compareWebDeployment('3'.repeat(40), main, async () => Response.json({
    status: 'ahead',
    files: [{ filename: 'jumper - construtor-de-sites/_jumper-sites-system/clientes/izigym-lp/src/simple.ts' }],
  }));
  assert.equal(pending, 'pending');
  const pendingState = releaseState({ id: 'version-2', tag: `git-${'3'.repeat(40)}` }, [{ id: 'jumper-web', sha: main }], undefined, pending);
  assert.equal(pendingState.alerts[0].level, 'partial');

  const divergence = await compareWebDeployment('4'.repeat(40), main, async () => Response.json({ status: 'diverged' }));
  assert.equal(divergence, 'different');
});

test('status reads only the two fixed GitHub repositories', async () => {
  const requests = [];
  const fetcher = async (url) => {
    requests.push(url);
    if (url.endsWith('deployments?environment=Production&per_page=1')) {
      return Response.json([{ id: 1, sha, created_at: '2026-09-01T00:00:00Z', creator: { login: 'vercel[bot]' } }]);
    }
    if (url.endsWith('deployments/1/statuses?per_page=1')) {
      return Response.json([{ state: 'success', created_at: '2026-09-01T00:01:00Z', creator: { login: 'vercel[bot]' } }]);
    }
    return Response.json([{ sha, commit: { message: 'Atualiza o site', committer: { date: '2026-09-01T00:00:00Z' } } }]);
  };
  const status = await hubStatus({ id: 'version-1', tag: `git-${sha}` }, fetcher);
  assert.deepEqual(requests.slice().sort(), [
    'https://api.github.com/repos/jumper-lab/jumper-web/commits?sha=main&per_page=3',
    'https://api.github.com/repos/jumper-lab/jumper-site/commits?sha=main&per_page=3',
    'https://api.github.com/repos/jumper-lab/jumper-site/deployments?environment=Production&per_page=1',
    'https://api.github.com/repos/jumper-lab/jumper-site/deployments/1/statuses?per_page=1',
  ].sort());
  assert.equal(status.hoster.state, 'matched');
  assert.equal(status.repositories.length, 2);
  assert.equal(status.activity.some((event) => event.source === 'jumper-hoster'), true);
});

test('activity shows the latest GitHub and deployment events without inventing links', () => {
  const webCommits = Array.from({ length: 3 }, (_, index) => ({
    sha: String(index + 1).repeat(40),
    message: `Ajuste web ${index + 1}`,
    committedAt: `2026-09-0${3 - index}T12:00:00Z`,
  }));
  const siteCommits = Array.from({ length: 3 }, (_, index) => ({
    sha: String(index + 4).repeat(40),
    message: `Ajuste site ${index + 1}`,
    committedAt: `2026-09-0${3 - index}T10:00:00Z`,
  }));
  const events = recentActivity(
    [{ id: 'jumper-web', recentCommits: webCommits }, { id: 'jumper-site', recentCommits: siteCommits }],
    { commitSha: siteCommits[0].sha, state: 'success', deployedAt: '2026-09-03T11:00:00Z', url: 'https://github.com/jumper-lab/jumper-site/deployments/1' },
    { versionId: 'version-1', commitSha: webCommits[0].sha, deployedAt: '2026-09-03T13:00:00Z' },
  );
  assert.equal(events.length, 4);
  assert.equal(events[0].source, 'jumper-hoster');
  assert.equal(events.some((event) => event.source === 'jumper-web' && event.kind === 'github'), true);
  assert.equal(events.some((event) => event.source === 'jumper-site' && event.kind === 'github'), true);
  assert.equal(events.some((event) => event.kind === 'site-deploy'), true);
  assert.equal(events.every((event) => !event.url || event.url.startsWith('https://github.com/jumper-lab/')), true);
  assert.equal(events.find((event) => event.kind === 'hoster-deploy').detail, 'Ajuste web 1');
});

test('activity remains honest when a source cannot be verified', () => {
  const events = recentActivity(
    [{ id: 'jumper-web', recentCommits: [] }, { id: 'jumper-site', recentCommits: [] }],
    { commitSha: null, state: 'unknown' },
    { versionId: 'version-2', commitSha: null, deployedAt: 'invalid' },
  );
  assert.deepEqual(events.map((event) => event.kind), ['hoster-deploy']);
  assert.equal(events[0].url, null);
  assert.equal(events[0].occurredAt, null);
});

test('status endpoint is restricted to the authenticated hub', async () => {
  const env = { JUMPER_HOSTER_PASSWORD: 'test-secret' };
  const path = 'https://site.jumper.dev.br/__jumper/system-status';
  const unauthorized = await worker.fetch(new Request(path), env);
  assert.equal(unauthorized.status, 401);
  assert.equal(unauthorized.headers.get('Cache-Control'), 'no-store, private');
  const post = await worker.fetch(new Request(path, { method: 'POST' }), env);
  assert.equal(post.status, 405);
  const login = await worker.fetch(new Request('https://site.jumper.dev.br/__jumper/login', {
    method: 'POST', body: new URLSearchParams({ password: 'test-secret', next: '/' }),
  }), env);
  assert.equal(login.status, 303);
  const cookie = login.headers.get('Set-Cookie').split(';')[0];
  const authorized = await worker.fetch(new Request(path, { headers: { Cookie: cookie } }), {
    ...env, CF_VERSION_METADATA: { id: 'version-1', tag: `git-${sha}` },
  });
  assert.equal(authorized.status, 200);
  assert.equal((await authorized.json()).hoster.state, 'matched');
});
