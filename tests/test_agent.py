import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
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

    def test_bot_attribution_and_workflow_gates(self):
        workflow = (PROJECT / '.github/workflows/ai-maintenance.yml').read_text()
        name = 'github-actions[bot]'
        email = '41898282+github-actions[bot]@users.noreply.github.com'
        self.assertIn("git config user.name '" + name + "'", workflow)
        self.assertIn("git config user.email '" + email + "'", workflow)
        self.assertIn("if: steps.agent.outputs.has_changes == 'true'", workflow)
        self.assertIn('python scripts/check_staged.py --stage', workflow)
        self.assertNotIn('git add -A', workflow)
        self.assertIn("41 5 * * 1-6", workflow)
        self.assertNotIn('continue-on-error', workflow)
        self.run_git('-c', 'user.name=' + name, '-c', 'user.email=' + email,
                     'commit', '--allow-empty', '-qm', 'bot fixture')
        self.assertEqual(self.run_git('log', '-1', '--format=%an <%ae>').decode().strip(), f'{name} <{email}>')

    def test_no_external_service_dependency(self):
        paths = ['scripts/maintenance_agent.py', 'scripts/maintenance-transform.mjs', '.github/workflows/ai-maintenance.yml']
        for name in paths:
            source = (PROJECT / name).read_text().lower()
            for forbidden in ('urllib', 'requests.', 'fetch(', 'api.openai', 'openai_api_key', 'maintenance_model'):
                self.assertNotIn(forbidden, source, name)


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


if __name__ == '__main__':
    unittest.main()
