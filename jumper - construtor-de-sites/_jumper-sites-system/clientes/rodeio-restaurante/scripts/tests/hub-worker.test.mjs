import assert from 'node:assert/strict';
import { test } from 'node:test';
import hubWorker from '../../cloudflare/hub-worker.mjs';
import hosterWorker from '../../cloudflare/worker.mjs';

function environment(authorized) {
  const calls = [];
  return {
    calls,
    HOSTER: {
      async fetch(request) {
        const url = new URL(request.url);
        calls.push(url.pathname);
        assert.equal(request.headers.get('X-Jumper-Hub-Auth'), '1');
        return authorized ? new Response(null, { status: 204 }) : new Response('Login do hoster', { status: 401 });
      },
    },
    ASSETS: {
      async fetch(request) {
        calls.push(new URL(request.url).pathname);
        return new Response('Arquivo do hub');
      },
    },
  };
}

test('hub requires the existing hoster session and never serves the dashboard publicly', async () => {
  const env = environment(false);
  const response = await hubWorker.fetch(new Request('https://site.jumper.dev.br/'), env);
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('X-Jumper-Surface'), 'jumper-hub');
  assert.equal(await response.text(), 'Login do hoster');
  assert.deepEqual(env.calls, ['/']);
});

test('authenticated hub serves only its own document', async () => {
  const env = environment(true);
  const response = await hubWorker.fetch(new Request('https://site.jumper.dev.br/', {
    headers: { Cookie: 'jumper_hoster_session=valid' },
  }), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store, private');
  assert.equal(response.headers.get('X-Jumper-Surface'), 'jumper-hub');
  assert.deepEqual(env.calls, ['/', '/index.html']);
});

test('an asset redirect cannot send an authenticated user back to the hub root', async () => {
  const env = environment(true);
  env.ASSETS.fetch = async () => Response.redirect('https://site.jumper.dev.br/', 307);
  const response = await hubWorker.fetch(new Request('https://site.jumper.dev.br/'), env);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Location'), null);
});

test('hub routes do not capture client paths, login or the private document URL', async () => {
  const env = environment(true);
  for (const path of ['/izigym/', '/rodeio/', '/__jumper/login', '/index.html']) {
    const response = await hubWorker.fetch(new Request(`https://site.jumper.dev.br${path}`), env);
    assert.equal(response.status, 404, path);
  }
  assert.deepEqual(env.calls, []);
});

test('only prefixed static assets are public', async () => {
  const env = environment(false);
  const response = await hubWorker.fetch(new Request('https://site.jumper.dev.br/hub-assets/hub-redesign.css'), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Jumper-Surface'), 'jumper-hub');
  assert.deepEqual(env.calls, ['/hub-assets/hub-redesign.css']);
});

test('hoster validates the existing cookie for the hub without serving its document', async () => {
  const password = 'local-test-secret';
  const login = await hosterWorker.fetch(new Request('https://site.jumper.dev.br/__jumper/login', {
    method: 'POST', body: new URLSearchParams({ password, next: '/' }),
  }), { JUMPER_HOSTER_PASSWORD: password });
  const cookie = login.headers.get('Set-Cookie').split(';')[0];
  const check = await hosterWorker.fetch(new Request('https://site.jumper.dev.br/', {
    headers: { Cookie: cookie, 'X-Jumper-Hub-Auth': '1' },
  }), { JUMPER_HOSTER_PASSWORD: password });
  assert.equal(check.status, 204);
  assert.equal(await check.text(), '');
  const blocked = await hosterWorker.fetch(new Request('https://site.jumper.dev.br/', {
    headers: { 'X-Jumper-Hub-Auth': '1' },
  }), { JUMPER_HOSTER_PASSWORD: password });
  assert.equal(blocked.status, 401);
});

test('hub status adds its own Cloudflare deployment without changing hoster data', async () => {
  const sha = 'a'.repeat(40);
  const base = {
    repositories: [{ id: 'jumper-web', sha, recentCommits: [{ sha, message: 'Hub atualizado' }] }],
    hoster: { worker: 'jumper-hoster', versionId: 'hoster-version' },
    alerts: [],
    activity: [],
  };
  const env = {
    CF_VERSION_METADATA: { id: 'hub-version', tag: `git-${sha}`, timestamp: '2026-09-30T03:00:00Z' },
    HOSTER: { async fetch(request) {
      assert.equal(new URL(request.url).pathname, '/__jumper/system-status');
      return Response.json(base);
    } },
  };
  const response = await hubWorker.fetch(new Request('https://site.jumper.dev.br/__jumper/hub-status'), env);
  assert.equal(response.status, 200);
  const status = await response.json();
  assert.equal(status.hoster.versionId, 'hoster-version');
  assert.equal(status.hub.versionId, 'hub-version');
  assert.equal(status.hub.state, 'matched');
  assert.equal(status.activity[0].source, 'jumper-hub');
  assert.deepEqual(status.alerts, []);
});
