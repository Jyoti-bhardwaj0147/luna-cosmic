#!/usr/bin/env python3
"""Stage only exact, validated deterministic outputs; reject drift before commit."""
import json
import subprocess
import sys
from maintenance_agent import ROOT, MAX_FILES, MaintenanceError, digest, git, permitted, receipt_path, verify_changes


def check(stage=False):
    receipt = json.loads(receipt_path().read_text(encoding='utf-8'))
    files = receipt['files']
    if receipt['head'] != git('rev-parse', 'HEAD').decode().strip() or not 0 < len(files) <= MAX_FILES:
        raise MaintenanceError('Stale or invalid validation receipt.')
    expected = {}
    for name, sha in files.items():
        if not permitted(name):
            raise MaintenanceError('Disallowed staged path.')
        data = (ROOT / name).read_bytes()
        if digest(data) != sha:
            raise MaintenanceError('File changed after validation.')
        expected[name] = data.decode('utf-8')
    verify_changes(expected)
    if stage:
        # Never stage unrelated paths via git add -A.
        subprocess.run(['git', 'add', '--', *files], cwd=ROOT, check=True)
        verify_changes(expected)
    staged = {n.decode() for n in git('diff', '--cached', '--name-only', '-z').split(b'\0') if n}
    if staged != set(files):
        raise MaintenanceError('Staged paths differ from validated files.')
    for name, sha in files.items():
        if digest(git('show', ':' + name)) != sha:
            raise MaintenanceError('Staged content differs from validated content.')
    subprocess.run(['git', 'diff', '--cached', '--check'], cwd=ROOT, check=True)
    print('Validated staged changes.')


if __name__ == '__main__':
    try:
        check(stage='--stage' in sys.argv[1:])
    except Exception:
        print('Refusing commit: staged changes lack matching successful validation.', file=sys.stderr)
        sys.exit(1)
