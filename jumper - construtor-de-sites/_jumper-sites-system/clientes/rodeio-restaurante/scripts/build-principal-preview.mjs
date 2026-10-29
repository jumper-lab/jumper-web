import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../izigym-site');
const result = spawnSync('npx', ['--yes', 'pnpm@10.15.1', 'exec', 'vite', 'build', '--base=/izigym/', '--outDir=dist-preview'], {
  cwd: root, stdio: 'inherit', env: { ...process.env, VITE_ROUTER_BASENAME: '/izigym' },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
