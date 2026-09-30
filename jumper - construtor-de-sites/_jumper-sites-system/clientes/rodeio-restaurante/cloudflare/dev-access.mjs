// Defense in depth: the preview Worker stays closed if the Cloudflare Access
// application is absent or misconfigured. Its app-specific AUD is a Worker secret.
const TEAM_DOMAIN = 'jumperstudio.cloudflareaccess.com';
const ALLOWED_EMAIL_DOMAIN = '@jumper.studio';
const CERTS_URL = `https://${TEAM_DOMAIN}/cdn-cgi/access/certs`;
const CERTS_TTL_MS = 60 * 60 * 1000;
let certsCache;

function decodeBase64Url(value) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

function decodeJson(value) {
  try {
    return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
  } catch {
    return undefined;
  }
}

async function certificates(fetchImpl, now, refresh = false) {
  if (!refresh && certsCache && now - certsCache.fetchedAt < CERTS_TTL_MS) return certsCache.keys;
  try {
    const response = await fetchImpl(CERTS_URL, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return certsCache?.keys ?? [];
    const body = await response.json();
    certsCache = { keys: Array.isArray(body.keys) ? body.keys : [], fetchedAt: now };
    return certsCache.keys;
  } catch {
    return certsCache?.keys ?? [];
  }
}

export function resetDevAccessCertificatesForTests() {
  certsCache = undefined;
}

export async function verifyDevAccess(request, env, { fetchImpl = fetch, now = Date.now() } = {}) {
  const expectedAudience = env.HOSTER_DEV_ACCESS_AUD;
  if (!expectedAudience || typeof expectedAudience !== 'string') return false;
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return false;
  const [headerPart, payloadPart, signaturePart, extra] = token.split('.');
  if (!headerPart || !payloadPart || !signaturePart || extra) return false;
  const header = decodeJson(headerPart);
  const payload = decodeJson(payloadPart);
  if (header?.alg !== 'RS256' || !header.kid || !payload) return false;
  if (payload.iss !== `https://${TEAM_DOMAIN}` || typeof payload.exp !== 'number' || payload.exp * 1000 <= now) return false;
  if (typeof payload.email !== 'string' || !payload.email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN)) return false;
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(expectedAudience)) return false;
  let jwk = (await certificates(fetchImpl, now)).find((key) => key.kid === header.kid);
  if (!jwk) jwk = (await certificates(fetchImpl, now, true)).find((key) => key.kid === header.kid);
  if (!jwk) return false;
  try {
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decodeBase64Url(signaturePart), new TextEncoder().encode(`${headerPart}.${payloadPart}`));
  } catch {
    return false;
  }
}
