import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const principalRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../izigym-site');
// Pin the package manager as well as the frozen dependency graph.
for (const args of [['install', '--frozen-lockfile'], ['build']]) {
  const result = spawnSync('npx', ['--yes', 'pnpm@10.15.1', ...args], { cwd: principalRoot, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
