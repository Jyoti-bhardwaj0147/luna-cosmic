import importlib.util
import io
import json
import os
import shutil
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stdout, redirect_stderr
from unittest.mock import patch

PROJECT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('maintenance_agent', PROJECT / 'scripts/maintenance_agent.py')
agent = importlib.util.module_from_spec(spec)
spec.loader.exec_module(agent)
sys.modules['maintenance_agent'] = agent
spec = importlib.util.spec_from_file_location('check_staged', PROJECT / 'scripts/check_staged.py')
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)


class MaintenanceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name).resolve()
        for module in (agent, guard):
            original = module.ROOT
            module.ROOT = self.root
            self.addCleanup(lambda m=module, p=original: setattr(m, 'ROOT', p))
        self.run_git('init', '-q')
        self.run_git('config', 'user.name', 'Fixture')
        self.run_git('config', 'user.email', 'fixture@example.invalid')
        self.run_git('config', 'core.autocrlf', 'false')
        (self.root / 'src').mkdir()
        (self.root / 'src/a.ts').write_text('export const value=1;\n')
        self.run_git('add', '.')
        self.run_git('commit', '-qm', 'fixture')

    def run_git(self, *args):
        return subprocess.check_output(['git', *args], cwd=self.root, stderr=subprocess.DEVNULL)

    def change(self):
        return {'path': 'src/a.ts', 'content': 'export const value = 1;\n'}

    def test_reject_unsafe_paths(self):
        for path in ('../bad.ts', 'src/../bad.ts', '.github/workflows/a.yml', 'package.json',
                     'scripts/check_staged.py', 'tests/test_agent.py', 'src/.env.ts', 'src/a.css',
                     'docs/MVP_CONTRACT.md', '/src/a.ts', 'src\\a.ts'):
            self.assertFalse(agent.permitted(path), path)
        with self.assertRaises(agent.MaintenanceError):
            agent.select_changes([{'path': 'package.json', 'content': '{}'}], [])

    def test_symlink_guard(self):
        with patch.object(Path, 'is_symlink', return_value=True):
            self.assertFalse(agent.permitted('src/a.ts'))

    def test_no_change_keeps_tree_clean(self):
        with patch.object(agent, 'validate') as validate, patch.object(agent, 'proposals', return_value=[]), redirect_stdout(io.StringIO()):
            agent.main()
        validate.assert_called_once()
        self.assertEqual(agent.changed_files(), [])
        self.assertFalse(agent.receipt_path().exists())

    def test_successful_validation_and_exact_staging(self):
        with patch.object(agent, 'validate') as validate, patch.object(agent, 'proposals', return_value=[self.change()]), redirect_stdout(io.StringIO()):
            agent.main()
            guard.check(stage=True)
        self.assertEqual(validate.call_count, 2)
        self.assertEqual(self.run_git('diff', '--cached', '--name-only').decode().strip(), 'src/a.ts')
        (self.root / 'src/a.ts').write_text('unvalidated content')
        with self.assertRaises(agent.MaintenanceError):
            guard.check()

    def test_staged_mode_and_unrelated_paths_are_rejected(self):
        with patch.object(agent, 'validate'), patch.object(agent, 'proposals', return_value=[self.change()]), redirect_stdout(io.StringIO()):
            agent.main()
            guard.check(stage=True)
        # Linux normally trusts filesystem modes; Windows normally does not.
        # The index mode must be checked independently in both configurations.
        for filemode in ('true', 'false'):
            with self.subTest(filemode=filemode):
                self.run_git('config', 'core.filemode', filemode)
                self.run_git('update-index', '--chmod=+x', 'src/a.ts')
                self.assertTrue(self.run_git('ls-files', '--stage', 'src/a.ts').startswith(b'100755 '))
                with self.assertRaises(agent.MaintenanceError):
                    guard.check()
                self.run_git('update-index', '--chmod=-x', 'src/a.ts')
                with redirect_stdout(io.StringIO()):
                    guard.check()
        (self.root / 'package.json').write_text('{}')
        self.run_git('add', 'package.json')
        with self.assertRaises(agent.MaintenanceError):
            guard.check()

    def test_failed_validation_never_authorizes_commit(self):
        for failing_call in (0, 1):
            with self.subTest(failing_call=failing_call):
                self.run_git('restore', 'src/a.ts')
                outcomes = [None] * failing_call + [subprocess.CalledProcessError(1, 'validation')]
                with patch.object(agent, 'validate', side_effect=outcomes), patch.object(agent, 'proposals', return_value=[self.change()]), redirect_stdout(io.StringIO()):
                    with self.assertRaises(subprocess.CalledProcessError):
                        agent.main()
                self.assertFalse(agent.receipt_path().exists())
                self.assertEqual(self.run_git('diff', '--cached', '--name-only'), b'')
                with self.assertRaises(FileNotFoundError):
                    guard.check(stage=True)

    def test_dirty_tree_stops_before_validation(self):
        (self.root / 'src/a.ts').write_text('legitimate user changes')
        with patch.object(agent, 'validate') as validate, self.assertRaises(agent.MaintenanceError):
            agent.main()
        validate.assert_not_called()
        self.assertEqual((self.root / 'src/a.ts').read_text(), 'legitimate user changes')

    def test_unexpected_validation_edits_block_receipt(self):
        def validate():
            if (self.root / 'src/a.ts').read_text().startswith('export const value ='):
                (self.root / 'unexpected.txt').write_text('unexpected')
        with patch.object(agent, 'validate', side_effect=validate), patch.object(agent, 'proposals', return_value=[self.change()]), redirect_stdout(io.StringIO()):
            with self.assertRaises(agent.MaintenanceError):
                agent.main()
        self.assertFalse(agent.receipt_path().exists())

    def test_bounded_changes(self):
        for name in ('src/b.ts', 'src/c.ts'):
            (self.root / name).write_text('export {};\n')
        proposals = [self.change()] + [{'path': n, 'content': 'export { };\n'} for n in ('src/b.ts', 'src/c.ts')]
        self.assertEqual(len(agent.select_changes(proposals, ['src/a.ts', 'src/b.ts', 'src/c.ts'])), 2)
        oversized = {'path': 'src/a.ts', 'content': 'line\n' * 181}
        with redirect_stdout(io.StringIO()):
            self.assertEqual(agent.select_changes([oversized], ['src/a.ts']), {})

    def test_transformer_failure_reports_diagnostics_without_edits(self):
        result = subprocess.CompletedProcess([], 1, '', 'fixture transformer error\n')
        errors = io.StringIO()
        with patch.object(agent.subprocess, 'run', return_value=result), redirect_stderr(errors):
            with self.assertRaises(agent.MaintenanceError):
                agent.proposals(['src/a.ts'])
        self.assertIn('fixture transformer error', errors.getvalue())
        self.assertEqual(agent.changed_files(), [])
        self.assertFalse(agent.receipt_path().exists())

    def test_document_is_stable_and_source_derived(self):
        names = ['src/app/calendar/page.tsx', 'src/app/page.tsx', 'src/app/layout.tsx']
        doc = agent.page_document(names)
        self.assertEqual(doc, agent.page_document(list(reversed(names))))
        self.assertIn('src/app/calendar/page.tsx', doc)
        self.assertNotIn('layout.tsx', doc)
        path = self.root / agent.DOC
        path.parent.mkdir()
        path.write_text(doc)
        before = path.stat().st_mtime_ns
        self.assertEqual(agent.select_changes([{'path': agent.DOC, 'content': doc}], names), {})
        self.assertEqual(path.stat().st_mtime_ns, before)
        self.assertNotEqual(doc, agent.page_document(names + ['src/app/about/page.tsx']))

    def test_new_document_can_be_staged_and_rechecked(self):
        proposal = {'path': agent.DOC, 'content': agent.page_document(['src/app/page.tsx'])}
        with patch.object(agent, 'validate'), patch.object(agent, 'proposals', return_value=[proposal]), redirect_stdout(io.StringIO()):
            agent.main()
            guard.check(stage=True)
            guard.check()

    def test_approval_token_binds_base_paths_and_content(self):
        receipt = {'head': 'base', 'files': {'src/a.ts': 'content-hash'}}
        path = agent.receipt_path()
        path.write_text(json.dumps(receipt))
        token = agent.approval_digest()
        path.write_text(json.dumps(receipt, sort_keys=True, indent=2))
        self.assertEqual(token, agent.approval_digest())
        for changed in (
            {'head': 'new-base', 'files': receipt['files']},
            {'head': 'base', 'files': {'src/b.ts': 'content-hash'}},
            {'head': 'base', 'files': {'src/a.ts': 'new-content'}},
        ):
            path.write_text(json.dumps(changed))
            self.assertNotEqual(token, agent.approval_digest())

    def test_no_change_output_is_explicit(self):
        output = self.root / '.git' / 'test-output'
        with patch.dict(os.environ, {'GITHUB_OUTPUT': str(output)}), patch.object(agent, 'validate'), patch.object(agent, 'proposals', return_value=[]), redirect_stdout(io.StringIO()):
            agent.main()
        self.assertEqual(output.read_text(), 'has_changes=false\n')

    def test_owner_attribution_and_workflow_gates(self):
        workflow = (PROJECT / '.github/workflows/ai-maintenance.yml').read_text()
        name = 'Jyoti-bhardwaj0147'
        email = 'fixture@example.invalid'
        self.assertIn("git config user.name '" + name + "'", workflow)
        self.assertIn('git config user.email "$MAINTENANCE_AUTHOR_EMAIL"', workflow)
        self.assertIn("if: steps.agent.outputs.has_changes == 'true'", workflow)
        self.assertIn('python scripts/check_staged.py --stage', workflow)
        self.assertNotIn('git add -A', workflow)
        self.assertIn("41 5 * * 1-6", workflow)
        self.assertNotIn('continue-on-error', workflow)
        self.assertIn("if: github.ref == 'refs/heads/main'", workflow)
        self.assertIn('HEAD:refs/heads/main', workflow)
        self.assertIn('[ "$APPROVED_DIGEST" != "$REVIEW_DIGEST" ]', workflow)
        self.assertIn('[ "$GITHUB_ACTOR" != Jyoti-bhardwaj0147 ]', workflow)
        self.assertIn('[ "$GITHUB_TRIGGERING_ACTOR" != Jyoti-bhardwaj0147 ]', workflow)
        self.assertIn('secrets.MAINTENANCE_AUTHOR_EMAIL', workflow)
        self.assertIn('default: preview', workflow)
        self.assertNotIn('--force', workflow)
        self.assertIn('git rev-parse FETCH_HEAD', workflow)
        self.run_git('-c', 'user.name=' + name, '-c', 'user.email=' + email,
                     'commit', '--allow-empty', '-qm', 'owner fixture')
        self.assertEqual(self.run_git('log', '-1', '--format=%an <%ae>').decode().strip(), f'{name} <{email}>')

    def test_no_external_service_dependency(self):
        paths = ['scripts/maintenance_agent.py', 'scripts/maintenance-transform.mjs', '.github/workflows/ai-maintenance.yml']
        for name in paths:
            source = (PROJECT / name).read_text().lower()
            for forbidden in ('urllib', 'requests.', 'fetch(', 'api.openai', 'openai_api_key', 'maintenance_model'):
                self.assertNotIn(forbidden, source, name)


class WorkflowCommitTests(unittest.TestCase):
    def run_commit_step(self, **overrides):
        bash = shutil.which('bash')
        if not bash and os.name == 'nt':
            candidate = Path('C:/Program Files/Git/bin/bash.exe')
            bash = str(candidate) if candidate.exists() else None
        if not bash:
            self.skipTest('Bash is required for workflow shell regression tests')
        workflow = (PROJECT / '.github/workflows/ai-maintenance.yml').read_text()
        step = workflow.split('      - name: Commit and push validated maintenance directly\n')[1]
        script = step.split('        run: |\n')[1].split('      - name:')[0]
        script = '\n'.join(line[10:] for line in script.splitlines())
        # Execute the actual workflow shell with local transport/commit stubs.
        stubs = '''
python() { :; }
git() {
  case "$*" in
    'diff --cached --quiet') return 1 ;;
    *'fetch origin'*) return 0 ;;
    'rev-parse FETCH_HEAD') echo "$REMOTE_HEAD" ;;
    'rev-parse HEAD') echo base ;;
    'config user.name '*) COMMIT_NAME="$3" ;;
    'config user.email '*) COMMIT_EMAIL="$3" ;;
    'commit '*) echo "COMMIT_AUTHOR=$COMMIT_NAME"; echo "COMMIT_EMAIL=$COMMIT_EMAIL" ;;
    *'push origin'*) echo PUSH_ATTEMPT; return "$PUSH_STATUS" ;;
  esac
}
'''
        env = {**os.environ, 'MODE': 'approved', 'GH_TOKEN': 'fixture',
               'APPROVED_DIGEST': 'exact', 'REVIEW_DIGEST': 'exact',
               'GITHUB_EVENT_NAME': 'workflow_dispatch',
               'GITHUB_ACTOR': 'Jyoti-bhardwaj0147',
               'GITHUB_TRIGGERING_ACTOR': 'Jyoti-bhardwaj0147',
               'MAINTENANCE_AUTHOR_EMAIL': 'fixture@example.invalid',
               'REMOTE_HEAD': 'base', 'PUSH_STATUS': '0', **overrides}
        env.pop('GIT_AUTHOR_NAME', None)
        env.pop('GIT_AUTHOR_EMAIL', None)
        return subprocess.run([bash, '-c', stubs + script], env=env, capture_output=True, text=True)

    def test_owner_attribution_in_all_commit_modes(self):
        approved = self.run_commit_step()
        self.assertEqual(approved.returncode, 0, approved.stderr)
        self.assertIn('COMMIT_AUTHOR=Jyoti-bhardwaj0147', approved.stdout)
        for mode, event in (('', 'schedule'), ('commit', 'workflow_dispatch')):
            with self.subTest(mode=mode):
                result = self.run_commit_step(MODE=mode, GITHUB_EVENT_NAME=event)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertIn('COMMIT_AUTHOR=Jyoti-bhardwaj0147', result.stdout)
                self.assertIn('COMMIT_EMAIL=fixture@example.invalid', result.stdout)
                missing = self.run_commit_step(MODE=mode, GITHUB_EVENT_NAME=event,
                                               MAINTENANCE_AUTHOR_EMAIL='')
                self.assertNotEqual(missing.returncode, 0)
                self.assertNotIn('COMMIT_AUTHOR=', missing.stdout)
                self.assertNotIn('PUSH_ATTEMPT', missing.stdout)

    def test_invalid_approval_blocks_commit_and_push(self):
        for override in ({'APPROVED_DIGEST': ''}, {'APPROVED_DIGEST': 'stale'},
                         {'GITHUB_ACTOR': 'other'}, {'GITHUB_TRIGGERING_ACTOR': 'other'},
                         {'MAINTENANCE_AUTHOR_EMAIL': ''}, {'GITHUB_EVENT_NAME': 'schedule'}):
            with self.subTest(override=override):
                result = self.run_commit_step(**override)
                self.assertNotEqual(result.returncode, 0)
                self.assertNotIn('COMMIT_AUTHOR=', result.stdout)
                self.assertNotIn('PUSH_ATTEMPT', result.stdout)

    def test_concurrent_update_and_push_failure(self):
        moved = self.run_commit_step(REMOTE_HEAD='advanced')
        self.assertNotEqual(moved.returncode, 0)
        self.assertNotIn('COMMIT_AUTHOR=', moved.stdout)
        failed = self.run_commit_step(PUSH_STATUS='1')
        self.assertNotEqual(failed.returncode, 0)
        self.assertIn('Push failed', failed.stdout)


class TransformerTests(unittest.TestCase):
    def transform(self, content):
        result = subprocess.run(['node', 'scripts/maintenance-transform.mjs'], cwd=PROJECT,
                                input=json.dumps([{'path': 'src/maintenance-fixture.ts', 'content': content}]),
                                text=True, encoding='utf-8', capture_output=True, check=True)
        return json.loads(result.stdout)

    def test_real_formatter_fix_and_idempotence(self):
        fixed = self.transform('export const values=[1,2,3]\n')
        self.assertEqual(fixed[0]['content'], 'export const values = [1, 2, 3];\n')
        self.assertEqual(self.transform(fixed[0]['content']), [])

    def test_full_repository_input(self):
        # Exercise the actual payload, not only a one-line formatting fixture.
        proposals = agent.proposals(agent.tracked_files())
        self.assertEqual(proposals[0]['path'], agent.DOC)
        self.assertTrue(all(agent.permitted(item['path']) for item in proposals))

    def test_large_piped_input(self):
        content = '// lunar input\n' * 6000 + 'export const value=1\n'
        fixed = self.transform(content)
        self.assertEqual(fixed[0]['content'], content.replace('value=1\n', 'value = 1;\n'))


if __name__ == '__main__':
    unittest.main()
