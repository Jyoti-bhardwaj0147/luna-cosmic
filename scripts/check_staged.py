#!/usr/bin/env python3
"""Ensure auto-commit includes only AI-approved source paths."""
import subprocess
import sys
from maintenance_agent import permitted

names = subprocess.check_output(['git', 'diff', '--cached', '--name-only', '-z']).split(b'\0')
changed = [n.decode('utf-8') for n in names if n]
if not changed:
    print('No staged files')
    sys.exit(0)
if any(not permitted(name) for name in changed):
    print('Refusing staged files outside the agent allowlist:', changed, file=sys.stderr)
    sys.exit(1)
print('Validated staged files:', ', '.join(changed))
