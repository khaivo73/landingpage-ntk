import importlib.util
import pathlib
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('worker', pathlib.Path(__file__).parents[1] / 'deploy/notification-worker.py')
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)
JOB = dict(id='a', lease_id='b', lead_id='test-id', channel='telegram', full_name='<Test>',
           phone='0900000000', demand='CAM MẬT', ward='Bình Thủy', address='',
           created_at='2026-11-10T17:00:00Z', is_test=True)


class NotificationTests(unittest.TestCase):
    def test_message_is_plain_and_vietnam_time(self):
        text = worker.message(JOB)
        self.assertIn('11/11/2026 00:00', text)
        self.assertIn('CAM MẬT', text)
        self.assertIn('KHÔNG LIÊN HỆ', text)
        self.assertIn('<Test>', text)

    def test_delivery_failure_requeues_without_losing_job(self):
        with patch.dict(worker.os.environ, {}, clear=True), patch.object(worker, 'queue', side_effect=[[JOB], True]) as queue, patch.object(worker, 'telegram', side_effect=RuntimeError('SECRET')):
            worker.run()
            ack = queue.call_args_list[-1].args[0]
            self.assertFalse(ack['success'])
            self.assertEqual(ack['error'], 'TELEGRAM_FAILED')
            self.assertEqual(ack['lease_id'], 'b')

    def test_email_not_claimed_without_credentials(self):
        with patch.dict(worker.os.environ, {}, clear=True), patch.object(worker, 'queue', return_value=[]) as queue:
            worker.run()
            queue.assert_called_once_with({'action': 'claim', 'channels': ['telegram']})

    def test_both_channels_are_independent(self):
        with patch.dict(worker.os.environ, {'SMTP_USER': 'test@example.com', 'SMTP_APP_PASSWORD': 'test'}, clear=True), patch.object(worker, 'queue', side_effect=[[JOB], True, [{**JOB, 'channel': 'email'}], True]) as queue, patch.object(worker, 'telegram', side_effect=RuntimeError()), patch.object(worker, 'email') as mail:
            worker.run()
            mail.assert_called_once()
            self.assertTrue(queue.call_args_list[-1].args[0]['success'])


if __name__ == '__main__':
    unittest.main()
