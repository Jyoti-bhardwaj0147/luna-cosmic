#!/usr/bin/env python3
"""Bounded deterministic maintenance. Never commits or contacts a service."""
import difflib
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import subprocess
import sys

ROOT = Path.cwd().resolve()
MAX_FILES = 2
MAX_DIFF_LINES = 180
MAX_FILE_BYTES = 100_000
DOC = 'docs/generated-pages.md'


class MaintenanceError(RuntimeError):
    pass


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, stderr=subprocess.DEVNULL)


def tracked_files():
    return [os.fsdecode(p) for p in git('ls-files', '-z').split(b'\0') if p]


def permitted(name):
    if not isinstance(name, str) or '\\' in name or name.startswith('/'):
        return False
    parts = name.split('/')
    if any(p in ('', '.', '..') or p.startswith('.') for p in parts):
        return False
    if name != DOC and not (parts[0] == 'src' and PurePosixPath(name).suffix in {'.ts', '.tsx', '.js', '.jsx'}):
        return False
    path = ROOT / name
    if not path.resolve().is_relative_to(ROOT):
        return False
    if any(p.is_symlink() for p in [path, *path.parents] if p.is_relative_to(ROOT)):
        return False
    return not path.exists() or path.is_file()


def changed_files():
    # No rename detection: report both sides so deletions/renames fail closed.
    changed = git('diff', 'HEAD', '--no-renames', '--name-only', '-z').split(b'\0')
    changed += git('ls-files', '--others', '--exclude-standard', '-z').split(b'\0')
    return sorted({os.fsdecode(p) for p in changed if p})


def require_clean_tree():
    paths = changed_files()
    if paths:
        for path in paths:
            print('Changed path: ' + json.dumps(path), file=sys.stderr)
        raise MaintenanceError('Working tree must be clean; no existing changes were discarded.')


def page_document(names):
    pages = sorted(n for n in names if n.startswith('src/app/') and PurePosixPath(n).name in {'page.tsx', 'page.ts', 'page.jsx', 'page.js'})
    return ('# Application page inventory\n\n'
            'Generated from tracked App Router page files. Paths describe source files, not expanded runtime URLs.\n\n'
            + ''.join('- `' + n.replace('`', '\\`') + '`\n' for n in pages))


def line_count(before, after):
    return sum(line.startswith(('+', '-')) and not line.startswith(('+++', '---'))
               for line in difflib.unified_diff(before.splitlines(), after.splitlines()))


def select_changes(proposals, names):
    selected = {}
    lines = 0
    for proposal in proposals:
        name, after = proposal['path'], proposal['content']
        if not permitted(name) or (name != DOC and name not in names):
            raise MaintenanceError('Transformer proposed a disallowed path.')
        if name in selected or not isinstance(after, str) or not after.strip():
            raise MaintenanceError('Duplicate or malformed transformation.')
        path = ROOT / name
        before = path.read_text(encoding='utf-8') if path.exists() else ''
        if before == after:
            continue
        size = line_count(before, after)
        if len(after.encode()) > MAX_FILE_BYTES or lines + size > MAX_DIFF_LINES:
            print('Skipping oversized transformation: ' + json.dumps(name))
            continue
        if len(selected) == MAX_FILES:
            break
        selected[name] = after
        lines += size
    return selected


def proposals(names):
    inputs = [{'path': n, 'content': (ROOT / n).read_text(encoding='utf-8')}
              for n in sorted(names) if n != DOC and permitted(n) and (ROOT / n).stat().st_size <= MAX_FILE_BYTES]
    result = subprocess.run(['node', 'scripts/maintenance-transform.mjs'], cwd=ROOT,
                            input=json.dumps(inputs), text=True, encoding='utf-8',
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=180)
    if result.returncode:
        if result.stderr.strip():
            print(result.stderr.strip(), file=sys.stderr)
        raise MaintenanceError('ESLint/Prettier transformation failed; no edits applied.')
    return [{'path': DOC, 'content': page_document(names)}, *json.loads(result.stdout)]


def validate():
    subprocess.run(['node', 'scripts/validate-maintenance.mjs'], cwd=ROOT, check=True)


def receipt_path():
    return Path(os.fsdecode(git('rev-parse', '--absolute-git-dir')).strip()) / 'luna-maintenance.json'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def approval_digest():
    # Bind approval to the validated base revision, paths, and exact file hashes.
    receipt = json.loads(receipt_path().read_text(encoding='utf-8'))
    return digest(json.dumps(receipt, sort_keys=True).encode('utf-8'))


def verify_changes(expected):
    if set(changed_files()) != set(expected):
        raise MaintenanceError('Unexpected paths changed during maintenance/validation; commit blocked.')
    if not 0 < len(expected) <= MAX_FILES:
        raise MaintenanceError('Changed-file limit exceeded.')
    lines = 0
    names = [os.fsdecode(p) for p in git('ls-tree', '-r', '--name-only', '-z', 'HEAD').split(b'\0') if p]
    raw = git('diff', 'HEAD', '--raw', '--no-renames').decode()
    for record in raw.splitlines():
        fields = record.split('\t')[0].split()
        if fields[1] != '100644' or fields[4] not in {'M', 'A'}:
            raise MaintenanceError('File deletion, rename or mode change rejected.')
    for name, content in expected.items():
        if not permitted(name) or (ROOT / name).read_bytes() != content.encode('utf-8'):
            raise MaintenanceError('Unexpected content or file type; commit blocked.')
        before = git('show', 'HEAD:' + name).decode('utf-8') if name in names else ''
        lines += line_count(before, content)
    if lines > MAX_DIFF_LINES:
        raise MaintenanceError('Diff limit exceeded; commit blocked.')
    subprocess.run(['git', 'diff', '--check'], cwd=ROOT, check=True)


def main():
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as output:
            output.write('has_changes=false\n')
    receipt = receipt_path()
    receipt.unlink(missing_ok=True)  # Only our prior validation receipt, never source files.
    require_clean_tree()
    print('Baseline validation', flush=True)
    validate()
    require_clean_tree()
    names = tracked_files()
    selected = select_changes(proposals(names), names)
    if not selected:
        print('Maintenance completed with no changes; no commit created.')
        return
    for name, content in selected.items():
        (ROOT / name).parent.mkdir(parents=True, exist_ok=True)
        (ROOT / name).write_bytes(content.encode('utf-8'))
    verify_changes(selected)
    print('Post-change validation', flush=True)
    validate()
    verify_changes(selected)
    receipt.write_text(json.dumps({'head': git('rev-parse', 'HEAD').decode().strip(),
                                  'files': {n: digest(c.encode()) for n, c in selected.items()}}), encoding='utf-8')
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as output:
            output.write('has_changes=true\n')
    print('Changes detected and validated: ' + ', '.join(json.dumps(n) for n in selected))


if __name__ == '__main__':
    try:
        main()
    except MaintenanceError as exc:
        print('Maintenance failed: ' + str(exc), file=sys.stderr)
        sys.exit(1)
    except subprocess.CalledProcessError:
        print('Maintenance failed: required command failed; no commit authorized.', file=sys.stderr)
        sys.exit(1)
    except Exception:
        print('Maintenance failed: local tool or filesystem failure; no commit authorized.', file=sys.stderr)
        sys.exit(1)
