import importlib.util
import pathlib
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('email_setup', pathlib.Path(__file__).parents[1] / 'deploy/configure-email.py')
setup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(setup)


class EmailSetupTests(unittest.TestCase):
    def test_atomic_save_preserves_other_credentials_and_permissions(self):
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / 'env'
            path.write_text('TELEGRAM_CHAT_ID=123\nNOTIFY_QUEUE_KEY=fake-test-key\n')
            setup.save_credentials(path, 'abcdefghijklmnop')
            values = dict(line.split('=', 1) for line in path.read_text().splitlines())
            self.assertEqual(values['TELEGRAM_CHAT_ID'], '123')
            self.assertEqual(values['NOTIFY_QUEUE_KEY'], 'fake-test-key')
            self.assertEqual(values['SMTP_USER'], setup.ACCOUNT)
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)

    def test_failed_smtp_does_not_save_or_start_worker(self):
        with patch.object(setup.os, 'geteuid', return_value=0), patch.object(setup.sys.stdin, 'isatty', return_value=True), patch.object(setup.Path, 'is_file', return_value=True), patch.object(setup.getpass, 'getpass', return_value='abcdefghijklmnop'), patch.object(setup, 'verify_and_send_test', side_effect=RuntimeError('secret')), patch.object(setup, 'save_credentials') as save, patch.object(setup.subprocess, 'run') as run:
            self.assertEqual(setup.main(), 1)
            save.assert_not_called()
            run.assert_not_called()

    def test_smtp_uses_tls_and_exact_authorized_recipient(self):
        with patch.object(setup.smtplib, 'SMTP_SSL') as smtp:
            connection = smtp.return_value.__enter__.return_value
            connection.send_message.return_value = {}
            setup.verify_and_send_test('abcdefghijklmnop')
            self.assertEqual(smtp.call_args.args, ('smtp.gmail.com', 465))
            connection.login.assert_called_once_with(setup.ACCOUNT, 'abcdefghijklmnop')
            mail = connection.send_message.call_args.args[0]
            self.assertEqual(mail['To'], setup.ACCOUNT)
            self.assertEqual(mail['From'], setup.ACCOUNT)


if __name__ == '__main__':
    unittest.main()
