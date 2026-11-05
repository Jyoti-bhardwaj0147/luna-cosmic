// The maintenance gate requires every check; missing scripts must fail closed.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const scripts = pkg.scripts ?? {};
const checks = ['lint', 'typecheck', 'test', 'build'];
if (checks.some(check => typeof scripts[check] !== 'string' || !scripts[check].trim())) {
  console.error('Maintenance requires lint, typecheck, test, and build scripts');
  process.exit(1);
}
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status || 1);
}
run('python', ['-B', '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_*.py']);
for (const check of checks) {
  console.log(`Running npm run ${check}`);
  // Windows npm.cmd needs a shell. Arguments here are fixed, never AI input.
  run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', check], {
    shell: process.platform === 'win32',
  });
}
