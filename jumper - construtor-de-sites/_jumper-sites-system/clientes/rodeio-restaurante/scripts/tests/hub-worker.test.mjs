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
