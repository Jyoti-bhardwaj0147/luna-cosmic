import io
import json
import urllib.error
from contextlib import redirect_stderr, redirect_stdout
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

class ApiTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict('os.environ', {'OPENAI_API_KEY': 'test-secret', 'MAINTENANCE_MODEL': 'gpt-5.5'})
        self.env.start()
        self.addCleanup(self.env.stop)
        self.sleep = patch.object(agent.time, 'sleep').start()
        self.addCleanup(patch.stopall)
        self.proposal = {'summary': 'No changes', 'why': 'No justified improvement', 'edits': []}

    def response(self, proposal=None):
        return {'status': 'completed', 'output': [
            {'type': 'reasoning'},
            {'type': 'message', 'role': 'assistant', 'status': 'completed',
             'content': [{'type': 'output_text', 'text': json.dumps(self.proposal if proposal is None else proposal)}]}]}

    def http_error(self, status, code=None):
        body = {'error': {'code': code, 'message': 'test-secret PRIVATE SOURCE', 'type': 'untrusted-secret'}}
        return urllib.error.HTTPError('https://example.invalid', status, 'test-secret', {},
                                      io.BytesIO(json.dumps(body).encode()))

    def test_missing_key(self):
        for key in ('', '  '):
            with self.subTest(key=key), patch.dict('os.environ', {'OPENAI_API_KEY': key}), patch.object(agent.urllib.request, 'urlopen') as request:
                with self.assertRaisesRegex(agent.MaintenanceError, 'configuration'):
                    agent.request_proposal([])
                request.assert_not_called()

    def test_http_categories_and_no_secret_logging(self):
        for status, code, category in [(400, None, 'request'), (401, None, 'authentication'),
                                       (403, None, 'permissions'), (404, 'model_not_found', 'model'),
                                       (404, None, 'model/resource'), (429, 'insufficient_quota', 'quota')]:
            with self.subTest(status=status, code=code), patch.object(agent.urllib.request, 'urlopen', side_effect=self.http_error(status, code)) as request:
                with self.assertRaises(agent.MaintenanceError) as result:
                    agent.request_proposal([])
                message = str(result.exception)
                self.assertIn(f'HTTP {status}', message)
                self.assertIn(f'[{category}]', message)
                self.assertNotIn('test-secret', message)
                self.assertNotIn('PRIVATE SOURCE', message)
                self.assertEqual(request.call_count, 1)
        self.sleep.assert_not_called()

    def test_bounded_rate_limit_and_server_retries(self):
        for status in (429, 500, 503):
            self.sleep.reset_mock()
            logs = io.StringIO()
            with self.subTest(status=status), redirect_stderr(logs), patch.object(agent.urllib.request, 'urlopen', side_effect=[self.http_error(status) for _ in range(3)]) as request:
                with self.assertRaisesRegex(agent.MaintenanceError, 'Retry limit reached'):
                    agent.request_proposal([])
                self.assertEqual(request.call_count, 3)
                self.assertEqual([call.args[0] for call in self.sleep.call_args_list], [2, 4])
                self.assertNotIn('test-secret', logs.getvalue())
                self.assertNotIn('PRIVATE SOURCE', logs.getvalue())

    def test_network_timeout_is_bounded(self):
        for exc in (urllib.error.URLError('test-secret'), TimeoutError('test-secret')):
            with self.subTest(error=type(exc)), redirect_stderr(io.StringIO()), patch.object(agent.urllib.request, 'urlopen', side_effect=exc) as request:
                with self.assertRaisesRegex(agent.MaintenanceError, r'\[network\]'):
                    agent.request_proposal([])
                self.assertEqual(request.call_count, 3)

    def test_retry_can_recover_and_request_contract(self):
        success = io.BytesIO(json.dumps(self.response()).encode())
        with redirect_stderr(io.StringIO()), patch.object(agent.urllib.request, 'urlopen', side_effect=[self.http_error(503), success]) as request:
            self.assertEqual(agent.request_proposal([]), self.proposal)
        req = request.call_args.args[0]
        payload = json.loads(req.data)
        self.assertEqual(req.full_url, 'https://api.openai.com/v1/responses')
        self.assertEqual(payload['model'], 'gpt-5.5')
        self.assertFalse(payload['store'])
        self.assertEqual(payload['text']['format']['schema'], agent.SCHEMA)
        self.assertTrue(payload['text']['format']['strict'])
        self.assertEqual(payload['max_output_tokens'], 6500)

    def test_failed_response_server_error_can_recover(self):
        failure = {'status': 'failed', 'error': {'code': 'server_error', 'message': 'test-secret'}}
        replies = [io.BytesIO(json.dumps(failure).encode()), io.BytesIO(json.dumps(self.response()).encode())]
        with redirect_stderr(io.StringIO()) as logs, patch.object(agent.urllib.request, 'urlopen', side_effect=replies) as request:
            self.assertEqual(agent.request_proposal([]), self.proposal)
            self.assertEqual(request.call_count, 2)
        self.assertNotIn('test-secret', logs.getvalue())

    def test_incomplete_response_never_applied_or_retried(self):
        for reason in ('max_output_tokens', 'content_filter', 'test-secret'):
            response = {'status': 'incomplete', 'incomplete_details': {'reason': reason}}
            with self.subTest(reason=reason), patch.object(agent.urllib.request, 'urlopen', return_value=io.BytesIO(json.dumps(response).encode())) as request:
                with self.assertRaisesRegex(agent.MaintenanceError, 'incomplete') as result:
                    agent.request_proposal([])
                self.assertNotIn('test-secret', str(result.exception))
                self.assertEqual(request.call_count, 1)

    def test_empty_valid_proposal_succeeds_without_handoff(self):
        with patch.object(agent, 'require_clean_tree'), patch.object(agent, 'source_bundle', return_value=[{'path': 'src/a.ts'}]), patch.object(agent.urllib.request, 'urlopen', return_value=io.BytesIO(json.dumps(self.response()).encode())), patch('builtins.open') as write, redirect_stdout(io.StringIO()) as logs:
            self.assertEqual(agent.cli(), 0)
            write.assert_not_called()
            self.assertIn('No meaningful improvement', logs.getvalue())

    def test_unexpected_formats_fail_closed(self):
        cases = [[], {}, {'status': 'completed', 'output': None},
                 {'status': 'completed', 'output': [None]},
                 {'status': 'completed', 'output': []}, self.response([]),
                 self.response({'edits': []}), self.response({**self.proposal, 'edits': [None]})]
        invalid_json = self.response()
        invalid_json['output'][1]['content'][0]['text'] = 'test-secret NOT JSON'
        cases.append(invalid_json)
        for response in cases:
            with self.subTest(response=response), self.assertRaisesRegex(agent.MaintenanceError, 'response-format') as result:
                agent.parse_proposal(response)
            self.assertNotIn('test-secret', str(result.exception))
        with patch.object(agent.urllib.request, 'urlopen', return_value=io.BytesIO(b'test-secret')):
            with self.assertRaisesRegex(agent.MaintenanceError, 'invalid JSON'):
                agent.request_proposal([])

    def test_refusal_and_failed_status(self):
        response = self.response()
        response['output'][1]['content'] = [{'type': 'refusal', 'refusal': 'test-secret'}]
        with self.assertRaisesRegex(agent.MaintenanceError, 'refusal'):
            agent.parse_proposal(response)
        with self.assertRaisesRegex(agent.MaintenanceError, 'quota'):
            agent.parse_proposal({'status': 'failed', 'error': {'code': 'insufficient_quota'}})

    def test_dirty_tree_reports_only_paths_before_api(self):
        raw = b' M tsconfig.json\0R  docs/new.md\0docs/old.md\0?? docs/test-secret\n::error bad.md\0'
        with patch.object(agent.subprocess, 'check_output', return_value=raw), patch.object(agent, 'request_proposal') as request, redirect_stderr(io.StringIO()) as logs:
            self.assertEqual(agent.cli(), 1)
            request.assert_not_called()
        self.assertIn('tsconfig.json', logs.getvalue())
        self.assertIn('docs/old.md', logs.getvalue())
        self.assertIn('[working-tree]', logs.getvalue())
        self.assertNotIn('test-secret', logs.getvalue())
        self.assertNotIn('\n::error', logs.getvalue())

    def test_unknown_exceptions_never_leak(self):
        with patch.object(agent, 'main', side_effect=RuntimeError('test-secret PRIVATE SOURCE')), redirect_stderr(io.StringIO()) as logs:
            self.assertEqual(agent.cli(), 1)
        self.assertIn('[internal]', logs.getvalue())
        self.assertNotIn('test-secret', logs.getvalue())


if __name__ == '__main__':
    unittest.main()
