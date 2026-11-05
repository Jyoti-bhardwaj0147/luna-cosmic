import importlib.util
import runpy
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts' / 'maintenance_agent.py'
spec = importlib.util.spec_from_file_location('maintenance_agent', SCRIPT)
agent = importlib.util.module_from_spec(spec)
spec.loader.exec_module(agent)

class GuardTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.original_root = agent.ROOT
        agent.ROOT = Path(self.tmp.name)
        self.addCleanup(lambda: setattr(agent, 'ROOT', self.original_root))
        (agent.ROOT / 'src').mkdir()
        (agent.ROOT / 'src' / 'ok.ts').write_text('export const score = 1;\n')
        self.bundle = [{'path': 'src/ok.ts', 'content': 'export const score = 1;\n'}]

    def test_reject_traversal_and_workflows(self):
        for name in ('../bad.ts', '.github/workflows/bad.yml', 'src/../../bad.ts', '/tmp/bad.ts', 'package.json'):
            self.assertFalse(agent.permitted(name))

    def test_reject_symlink(self):
        try:
            (agent.ROOT / 'src' / 'link.ts').symlink_to(agent.ROOT / 'src' / 'ok.ts')
        except OSError as exc:
            if getattr(exc, 'winerror', None) == 1314:
                self.skipTest('Windows requires Developer Mode or symlink privilege')
            raise
        self.assertFalse(agent.permitted('src/link.ts'))

    def test_reject_gate_and_configuration(self):
        for name in ('scripts/check_staged.py', 'scripts/validate-maintenance.mjs',
                     'tests/test_agent.py', 'vitest.config.mts', 'AGENTS.md',
                     'next.config.ts', 'eslint.config.mjs'):
            self.assertFalse(agent.permitted(name), name)

    def test_symlink_guard_without_platform_privileges(self):
        with patch.object(Path, 'is_symlink', return_value=True):
            self.assertFalse(agent.permitted('src/ok.ts'))

    def test_staged_guard_rejects_protected_file(self):
        with patch.dict('sys.modules', {'maintenance_agent': agent}):
            with patch('subprocess.check_output', return_value=b'tests/test_agent.py\0'):
                with self.assertRaises(SystemExit) as result:
                    runpy.run_path(str(SCRIPT.with_name('check_staged.py')))
        self.assertEqual(result.exception.code, 1)

    def test_staged_guard_accepts_application_file(self):
        with patch.dict('sys.modules', {'maintenance_agent': agent}):
            with patch('subprocess.check_output', return_value=b'src/ok.ts\0'):
                runpy.run_path(str(SCRIPT.with_name('check_staged.py')))

    def test_empty_proposal_has_no_changes(self):
        self.assertEqual(agent.apply({'edits': []}, self.bundle), [])

    def test_reject_secret_before_writing(self):
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'test-only-secret'}):
            with self.assertRaises(ValueError):
                agent.apply({'edits': [{'path': 'src/ok.ts', 'old': 'score = 1',
                                       'new': 'score = "test-only-secret"'}]}, self.bundle)
        self.assertEqual((agent.ROOT / 'src/ok.ts').read_text(), self.bundle[0]['content'])

    def test_allow_exact_replacement(self):
        paths = agent.apply({'edits': [{'path': 'src/ok.ts', 'old': 'score = 1', 'new': 'score = 2', 'reason': 'fix'}]}, self.bundle)
        self.assertEqual(paths, ['src/ok.ts'])
        self.assertIn('score = 2', (agent.ROOT / 'src' / 'ok.ts').read_text())

    def test_reject_noop_and_whitespace(self):
        for new in ('score = 1', 'score  = 1'):
            with self.assertRaises(ValueError):
                agent.apply({'edits': [{'path': 'src/ok.ts', 'old': 'score = 1', 'new': new, 'reason': 'x'}]}, self.bundle)

    def test_reject_duplicate_and_oversized(self):
        e = {'path': 'src/ok.ts', 'old': 'score = 1', 'new': 'score = 2', 'reason': 'x'}
        with self.assertRaises(ValueError): agent.apply({'edits': [e, e]}, self.bundle)
        with self.assertRaises(ValueError): agent.apply({'edits': [{**e, 'new': 'x' * 16001}]}, self.bundle)

    def test_creating_outside_safe_dirs(self):
        with self.assertRaises(ValueError):
            agent.apply({'edits': [{'path': 'src/new.ts', 'old': '', 'new': 'export {}', 'reason': 'x'}]}, self.bundle)

if __name__ == '__main__':
    unittest.main()
