import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../izigym-site-dev');
for (const args of [['install', '--frozen-lockfile'], ['exec', 'vite', 'build', '--base=/izigym/']]) {
  const result = spawnSync('npx', ['--yes', 'pnpm@10.15.1', ...args], {
    cwd: root, stdio: 'inherit', env: { ...process.env, VITE_ROUTER_BASENAME: '/izigym' },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
