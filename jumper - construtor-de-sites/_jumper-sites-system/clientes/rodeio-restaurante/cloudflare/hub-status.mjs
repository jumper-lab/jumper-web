const REPOSITORIES = [
  { id: 'jumper-web', owner: 'jumper-lab', repo: 'jumper-web' },
  { id: 'jumper-site', owner: 'jumper-lab', repo: 'jumper-site' },
];

const REFRESH_MS = 60_000;
const RECENT_COMMITS = 3;
let cached;
let pending;
let cachedSiteDeployment;
let pendingSiteDeployment;
const comparisonCache = new Map();
const HUB_SOURCE = 'jumper - construtor-de-sites/_jumper-sites-system/clientes/rodeio-restaurante/';
const HUB_ONLY_FILES = new Set([
  `${HUB_SOURCE}cloudflare/dashboard.html`,
  `${HUB_SOURCE}cloudflare/hub-redesign.css`,
  `${HUB_SOURCE}cloudflare/hub-worker.mjs`,
  `${HUB_SOURCE}cloudflare/favicon-jumper.png`,
  `${HUB_SOURCE}scripts/stage-hub.mjs`,
  `${HUB_SOURCE}scripts/deploy-hub.mjs`,
  `${HUB_SOURCE}scripts/tests/hub-worker.test.mjs`,
  `${HUB_SOURCE}wrangler.hub.jsonc`,
]);

function isHubOnly(filename) {
  return HUB_ONLY_FILES.has(filename) || filename.startsWith(`${HUB_SOURCE}cloudflare/design-system/`);
}

export async function compareWebDeployment(deployedSha, mainSha, fetcher = fetch) {
  if (!/^[a-f0-9]{40}$/.test(deployedSha || '') || !/^[a-f0-9]{40}$/.test(mainSha || '')) return 'unverified';
  if (deployedSha === mainSha) return 'matched';
  const key = `${deployedSha}:${mainSha}`;
  if (comparisonCache.has(key)) return comparisonCache.get(key);
  let relation = 'unverified';
  try {
    const response = await fetcher(`https://api.github.com/repos/jumper-lab/jumper-web/compare/${deployedSha}...${mainSha}`, {
      headers: githubHeaders(), signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
    const result = await response.json();
    if (['behind', 'diverged'].includes(result.status)) relation = 'different';
    else if (result.status === 'ahead' && Array.isArray(result.files) && result.files.length < 300) {
      relation = result.files.every((file) => isHubOnly(file.filename) && (!file.previous_filename || isHubOnly(file.previous_filename))) ? 'matched' : 'pending';
    }
  } catch {
    relation = 'unverified';
  }
  comparisonCache.set(key, relation);
  return relation;
}

function githubHeaders() {
  return { Accept: 'application/vnd.github+json', 'User-Agent': 'Jumper-Hub-Status' };
}

async function githubMain({ owner, repo, id }, fetcher) {
  try {
    const response = await fetcher(`https://api.github.com/repos/${owner}/${repo}/commits?sha=main&per_page=${RECENT_COMMITS}`, {
      headers: githubHeaders(),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data) || !/^[a-f0-9]{40}$/.test(data[0]?.sha || '')) throw new Error('Resposta de commits inválida');
    const recentCommits = data.filter((commit) => /^[a-f0-9]{40}$/.test(commit.sha || '')).map((commit) => ({
      sha: commit.sha,
      url: `https://github.com/${owner}/${repo}/commit/${commit.sha}`,
      message: String(commit.commit?.message || '').split('\n')[0].slice(0, 120),
      committedAt: commit.commit?.committer?.date || null,
    }));
    return {
      id,
      ...recentCommits[0],
      recentCommits,
    };
  } catch {
    // A failed lookup must never be presented as a synchronized release.
    return { id, sha: null, url: `https://github.com/${owner}/${repo}`, recentCommits: [], unavailable: true };
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
  const deployedSha = /^git-([a-f0-9]{40})$/.exec(versionMetadata?.tag || '')?.[1] || null;
  const mainSha = repositories.find((repository) => repository.id === 'jumper-web')?.sha;
  const webRelation = await compareWebDeployment(deployedSha, mainSha, fetcher);
  return releaseState(versionMetadata, repositories, production, webRelation);
}

function eventTime(value) {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

export function recentActivity(repositories, siteDeployment, hoster) {
  const events = [];
  for (const repository of repositories) {
    if (!REPOSITORIES.some((entry) => entry.id === repository.id)) continue;
    for (const commit of (repository.recentCommits || []).slice(0, RECENT_COMMITS)) {
      if (!/^[a-f0-9]{40}$/.test(commit.sha || '')) continue;
      events.push({
        id: `${repository.id}-${commit.sha}`,
        source: repository.id,
        kind: 'github',
        title: 'Alteração no GitHub',
        detail: String(commit.message || 'Commit sem descrição').slice(0, 120),
        occurredAt: eventTime(commit.committedAt),
        url: `https://github.com/jumper-lab/${repository.id}/commit/${commit.sha}`,
      });
    }
  }
  if (/^[a-f0-9]{40}$/.test(siteDeployment.commitSha || '')) {
    const siteCommit = repositories.find((repo) => repo.id === 'jumper-site')?.recentCommits?.find((commit) => commit.sha === siteDeployment.commitSha);
    events.push({
      id: `jumper-site-deploy-${siteDeployment.commitSha}`,
      source: 'jumper-site',
      kind: 'site-deploy',
      title: siteDeployment.state === 'success' ? 'Site publicado na Vercel'
        : ['failure', 'error'].includes(siteDeployment.state) ? 'Deploy do site falhou' : 'Deploy do site em andamento',
      detail: siteCommit?.message || 'Versão de produção do site institucional.',
      occurredAt: eventTime(siteDeployment.deployedAt),
      url: siteDeployment.url,
    });
  }
  if (hoster.versionId) {
    const webCommit = repositories.find((repo) => repo.id === 'jumper-web')?.recentCommits?.find((commit) => commit.sha === hoster.commitSha);
    events.push({
      id: `jumper-hoster-deploy-${hoster.versionId}`,
      source: 'jumper-hoster',
      kind: 'hoster-deploy',
      title: 'Worker publicado na Cloudflare',
      detail: webCommit?.message || 'Versão ativa dos sites de desenvolvimento.',
      occurredAt: eventTime(hoster.deployedAt),
      url: /^[a-f0-9]{40}$/.test(hoster.commitSha || '')
        ? `https://github.com/jumper-lab/jumper-web/commit/${hoster.commitSha}`
        : null,
    });
  }
  const timeValue = (event) => event.occurredAt ? Date.parse(event.occurredAt) : 0;
  const newestFirst = events.sort((left, right) => timeValue(right) - timeValue(left));
  const required = [
    ['jumper-web', 'github'],
    ['jumper-site', 'github'],
    ['jumper-site', 'site-deploy'],
    ['jumper-hoster', 'hoster-deploy'],
  ];
  const selected = required.map(([source, kind]) => newestFirst.find((event) => event.source === source && event.kind === kind)).filter(Boolean);
  return selected.sort((left, right) => timeValue(right) - timeValue(left));
}

export function releaseAlerts(repositories, siteDeployment, hoster) {
  const alerts = [];
  const webSha = repositories.find((repo) => repo.id === 'jumper-web')?.sha;
  const siteSha = repositories.find((repo) => repo.id === 'jumper-site')?.sha;

  if (hoster.state === 'different') {
    alerts.push({
      level: 'attention',
      source: 'jumper-hoster',
      title: 'Cloudflare e GitHub estão diferentes',
      detail: 'O Worker ativo não corresponde ao main (versão principal do GitHub) do jumper-web. Confira se há deploy pendente ou sobrescrita.',
    });
  } else if (hoster.state === 'pending') {
    alerts.push({
      level: 'partial',
      source: 'jumper-hoster',
      title: 'Alterações aguardam verificação no hoster',
      detail: 'O GitHub tem mudanças além do hub após o último deploy do jumper-hoster. Confira o que ainda precisa ser publicado.',
    });
  } else if (hoster.state === 'unverified') {
    alerts.push({
      level: 'partial',
      source: 'jumper-hoster',
      title: 'Origem do Worker não confirmada',
      detail: 'Não foi possível comparar a versão ativa com o main (versão principal do GitHub) do jumper-web.',
    });
  }

  if (['failure', 'error'].includes(siteDeployment.state)) {
    alerts.push({
      level: 'attention',
      source: 'jumper-site',
      title: 'Deploy do site falhou',
      detail: 'A publicação de produção na Vercel falhou. Confira o registro do deploy antes de considerar o site atualizado.',
    });
  } else if (siteDeployment.relation === 'different') {
    alerts.push({
      level: 'attention',
      source: 'jumper-site',
      title: 'Site publicado e GitHub estão diferentes',
      detail: 'A produção não corresponde ao main (versão principal do GitHub) do jumper-site. Confira se há deploy pendente ou sobrescrita.',
    });
  } else if (!siteSha || !siteDeployment.commitSha || siteDeployment.state === 'unknown') {
    alerts.push({
      level: 'partial',
      source: 'jumper-site',
      title: 'Publicação não confirmada',
      detail: 'Não foi possível confirmar a versão de produção do jumper-site na Vercel.',
    });
  } else if (siteDeployment.state !== 'success') {
    alerts.push({
      level: 'partial',
      source: 'jumper-site',
      title: 'Publicação em andamento',
      detail: 'O deploy de produção ainda não foi concluído.',
    });
  }
  return alerts;
}

export function releaseState(versionMetadata, repositories, production = { commitSha: null, state: 'unknown' }, webRelation = 'different') {
  const webSha = repositories.find((repo) => repo.id === 'jumper-web')?.sha;
  const siteSha = repositories.find((repo) => repo.id === 'jumper-site')?.sha;
  const tag = versionMetadata?.tag || null;
  const deployedSha = /^git-([a-f0-9]{40})$/.exec(tag || '')?.[1] || null;
  const siteDeployment = {
      ...production,
      relation: !siteSha || !production.commitSha || production.state !== 'success'
        ? 'unverified'
        : siteSha === production.commitSha ? 'matched' : 'different',
    };
  const hoster = {
      worker: 'jumper-hoster',
      versionId: versionMetadata?.id || null,
      deployedAt: versionMetadata?.timestamp || null,
      commitSha: deployedSha,
      state: !webSha || !deployedSha ? 'unverified' : webSha === deployedSha ? 'matched' : webRelation,
    };
  return {
    checkedAt: new Date().toISOString(),
    repositories,
    siteDeployment,
    hoster,
    alerts: releaseAlerts(repositories, siteDeployment, hoster),
    activity: recentActivity(repositories, siteDeployment, hoster),
  };
}
