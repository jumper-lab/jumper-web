import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hubStatus, releaseState } from '../../cloudflare/hub-status.mjs';
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
    return new Response(JSON.stringify({ sha }), { headers: { 'Content-Type': 'application/json' } });
  };
  const status = await hubStatus({ id: 'version-1', tag: `git-${sha}` }, fetcher);
  assert.deepEqual(requests.slice().sort(), [
    'https://api.github.com/repos/jumper-lab/jumper-web/commits/main',
    'https://api.github.com/repos/jumper-lab/jumper-site/commits/main',
    'https://api.github.com/repos/jumper-lab/jumper-site/deployments?environment=Production&per_page=1',
    'https://api.github.com/repos/jumper-lab/jumper-site/deployments/1/statuses?per_page=1',
  ].sort());
  assert.equal(status.hoster.state, 'matched');
  assert.equal(status.repositories.length, 2);
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
