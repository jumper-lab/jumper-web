const REPOSITORIES = [
  { id: 'jumper-web', owner: 'jumper-lab', repo: 'jumper-web' },
  { id: 'jumper-site', owner: 'jumper-lab', repo: 'jumper-site' },
];

const REFRESH_MS = 60_000;
let cached;
let pending;
let cachedSiteDeployment;
let pendingSiteDeployment;

function githubHeaders() {
  return { Accept: 'application/vnd.github+json', 'User-Agent': 'Jumper-Hub-Status' };
}

async function githubMain({ owner, repo, id }, fetcher) {
  try {
    const response = await fetcher(`https://api.github.com/repos/${owner}/${repo}/commits/main`, {
      headers: githubHeaders(),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
    const data = await response.json();
    if (!/^[a-f0-9]{40}$/.test(data.sha)) throw new Error('SHA inválido');
    return {
      id,
      sha: data.sha,
      url: `https://github.com/${owner}/${repo}/commit/${data.sha}`,
      message: String(data.commit?.message || '').split('\n')[0].slice(0, 120),
      committedAt: data.commit?.committer?.date || null,
    };
  } catch {
    // A failed lookup must never be presented as a synchronized release.
    return { id, sha: null, url: `https://github.com/${owner}/${repo}`, unavailable: true };
  }
}

async function readSiteDeployment(fetcher) {
  try {
    const deployments = await fetcher('https://api.github.com/repos/jumper-lab/jumper-site/deployments?environment=Production&per_page=1', {
      headers: githubHeaders(), signal: AbortSignal.timeout(8_000),
    });
    if (!deployments.ok) throw new Error(`GitHub HTTP ${deployments.status}`);
    const [deployment] = await deployments.json();
    if (!deployment || deployment.creator?.login !== 'vercel[bot]' || !/^[a-f0-9]{40}$/.test(deployment.sha) || !Number.isInteger(deployment.id)) {
      throw new Error('Deploy de produção inválido');
    }
    const statuses = await fetcher(`https://api.github.com/repos/jumper-lab/jumper-site/deployments/${deployment.id}/statuses?per_page=1`, {
      headers: githubHeaders(), signal: AbortSignal.timeout(8_000),
    });
    if (!statuses.ok) throw new Error(`GitHub HTTP ${statuses.status}`);
    const [status] = await statuses.json();
    if (status?.creator?.login !== 'vercel[bot]') throw new Error('Status não confirmado pela Vercel');
    return {
      commitSha: deployment.sha,
      state: status?.state || 'unknown',
      deployedAt: status?.created_at || deployment.created_at || null,
      url: `https://github.com/jumper-lab/jumper-site/deployments/${deployment.id}`,
    };
  } catch {
    return { commitSha: null, state: 'unknown', deployedAt: null, url: 'https://github.com/jumper-lab/jumper-site/deployments' };
  }
}

export async function siteDeployment(fetcher = fetch, now = Date.now()) {
  if (cachedSiteDeployment && now - cachedSiteDeployment.at < REFRESH_MS) return cachedSiteDeployment.value;
  if (!pendingSiteDeployment) {
    pendingSiteDeployment = readSiteDeployment(fetcher)
      .then((value) => {
        cachedSiteDeployment = { at: Date.now(), value };
        return value;
      })
      .finally(() => { pendingSiteDeployment = null; });
  }
  return pendingSiteDeployment;
}

export async function githubMains(fetcher = fetch, now = Date.now()) {
  if (cached && now - cached.at < REFRESH_MS) return cached.value;
  if (!pending) {
    pending = Promise.all(REPOSITORIES.map((repo) => githubMain(repo, fetcher)))
      .then((value) => {
        cached = { at: Date.now(), value };
        return value;
      })
      .finally(() => { pending = null; });
  }
  return pending;
}

export async function hubStatus(versionMetadata, fetcher = fetch) {
  const [repositories, production] = await Promise.all([githubMains(fetcher), siteDeployment(fetcher)]);
  return releaseState(versionMetadata, repositories, production);
}

export function releaseState(versionMetadata, repositories, production = { commitSha: null, state: 'unknown' }) {
  const webSha = repositories.find((repo) => repo.id === 'jumper-web')?.sha;
  const siteSha = repositories.find((repo) => repo.id === 'jumper-site')?.sha;
  const tag = versionMetadata?.tag || null;
  const deployedSha = /^git-([a-f0-9]{40})$/.exec(tag || '')?.[1] || null;
  return {
    checkedAt: new Date().toISOString(),
    repositories,
    siteDeployment: {
      ...production,
      relation: !siteSha || !production.commitSha || production.state !== 'success'
        ? 'unverified'
        : siteSha === production.commitSha ? 'matched' : 'different',
    },
    hoster: {
      worker: 'jumper-hoster',
      versionId: versionMetadata?.id || null,
      deployedAt: versionMetadata?.timestamp || null,
      commitSha: deployedSha,
      state: !webSha || !deployedSha ? 'unverified' : webSha === deployedSha ? 'matched' : 'different',
    },
  };
}
