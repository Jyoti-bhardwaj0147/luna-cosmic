// The maintenance gate requires every check; missing scripts must fail closed.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const scripts = pkg.scripts ?? {};
const checks = ['lint', 'typecheck', 'test', 'build'];
const missing = checks.filter(check => typeof scripts[check] !== 'string' || !scripts[check].trim());
if (missing.length) {
  console.error(`Maintenance requires lint, typecheck, test, and build scripts. Missing or empty: ${missing.join(', ')}`);
  process.exit(1);
}
function run(command, args, options = {}) {
  const label = [command, ...args].join(' ');
  console.log(`Running ${label}`);
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.status !== 0) {
    console.error(`Validation failed: ${label}${result.signal ? ` (signal ${result.signal})` : ` (exit ${result.status ?? 'unknown'})`}`);
    if (result.error) console.error(result.error.message);
    process.exit(result.status || 1);
  }
}
run('python', ['-B', '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_*.py']);
for (const check of checks) {
  // Windows npm.cmd needs a shell. Arguments here are fixed, never generated input.
  run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', check], {
    shell: process.platform === 'win32',
  });
}
