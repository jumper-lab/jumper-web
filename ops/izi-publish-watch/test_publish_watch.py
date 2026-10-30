import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('watch', Path(__file__).parent / 'publish-watch.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


class WatchTests(unittest.TestCase):
    def run_cycle(self, state, run, sent):
        def api(path):
            if 'jobs?' in path:
                return {'jobs': [{'steps': [{'name': 'Publicar IZI dev no oficial', 'conclusion': 'success'}]}]}
            return {'workflow_runs': [run]}
        with patch.object(m, 'save'):
            m.cycle(state, '2026-11-01T03:10:00Z', api, sent.append)

    def test_success_deduplicated(self):
        state = {'sent': []}; sent = []
        run = dict(id=123, created_at='2026-11-01T03:01:00Z', head_branch='main', event='schedule', status='completed', conclusion='success')
        self.run_cycle(state, run, sent)
        self.run_cycle(state, run, sent)
        self.assertEqual(len(sent), 1)
        self.assertIn('SUCESSO', sent[0])

    def test_failed_delivery_not_saved(self):
        state = {'sent': []}
        run = dict(id=123, created_at='2026-11-01T03:01:00Z', head_branch='main', event='schedule', status='completed', conclusion='failure')
        def failed(_): raise RuntimeError()
        with patch.object(m, 'save'), self.assertRaises(RuntimeError):
            m.cycle(state, '2026-11-01T03:10:00Z', lambda _: {'workflow_runs': [run]}, failed)
        self.assertEqual(state['sent'], [])

    def test_skipped_deploy_not_success(self):
        self.assertIn('SEM PUBLICAÇÃO', m.outcome({'conclusion': 'success'}, [{'steps': [{'name': 'Publicar IZI dev no oficial', 'conclusion': 'skipped'}]}]))

    def test_failure_does_not_claim_rollback(self):
        result = m.outcome({'conclusion': 'failure'}, [])
        self.assertIn('Não há rollback automático confirmado', result)

    def test_wrong_branch_ignored(self):
        state = {'sent': []}; sent = []
        self.run_cycle(state, dict(id=123, created_at='2026-11-01T03:01:00Z', head_branch='other', event='workflow_dispatch', status='completed'), sent)
        self.assertFalse(sent)
