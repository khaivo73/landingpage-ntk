import importlib.util
import json
import pathlib
import tempfile
import time
import unittest
from unittest.mock import patch

BASE=pathlib.Path(__file__).parents[1]/'deploy'
def module(name,file):
    spec=importlib.util.spec_from_file_location(name,BASE/file)
    item=importlib.util.module_from_spec(spec);spec.loader.exec_module(item);return item
spool=module('spool','event-spool.py')
worker=module('event_worker','notification-worker.py')

class EventTests(unittest.TestCase):
    def make_root(self,directory):
        root=pathlib.Path(directory)
        for name in ['pending','ready','retry']:(root/name).mkdir()
        return root

    def test_idle_worker_and_recovery_make_zero_cloud_calls(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(worker,'queue') as queue:
            root=self.make_root(directory)
            worker.run_events(root)
            self.assertEqual(spool.promote(root),0)
            queue.assert_not_called()

    def test_future_retry_is_not_promoted(self):
        with tempfile.TemporaryDirectory() as directory:
            root=self.make_root(directory)
            (root/'retry'/'test.json').write_text(json.dumps({'next_at':200}))
            self.assertEqual(spool.promote(root,100),0)
            self.assertEqual(spool.promote(root,201),1)

    def test_queue_failure_leaves_durable_delayed_flag(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(worker,'run',side_effect=RuntimeError('no network')):
            root=self.make_root(directory);(root/'ready'/'test.json').write_text('{}')
            with self.assertRaises(RuntimeError):worker.run_events(root)
            self.assertFalse((root/'ready'/'test.json').exists())
            self.assertGreater(json.loads((root/'retry'/'test.json').read_text())['next_at'],time.time())

    def test_acknowledged_queue_removes_only_handled_flags(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(worker,'run',return_value={'processed':0,'needs_retry':False}), patch.object(worker,'queue',return_value={'pending':0}):
            root=self.make_root(directory);(root/'ready'/'test.json').write_text('{}')
            worker.run_events(root)
            self.assertEqual(list((root/'retry').iterdir()),[])

if __name__=='__main__':unittest.main()
