"""Durable notification worker. Secrets supplied only by systemd EnvironmentFile."""
import datetime
import json
import os
import pathlib
import tempfile
import time
import smtplib
import ssl
import urllib.error
import urllib.request
from email.message import EmailMessage
from zoneinfo import ZoneInfo

QUEUE_URL = 'https://sktvegipvzngwsditzjx.supabase.co/functions/v1/vnpt-notification-queue'


def post(url, body, headers=None):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method='POST',
                                 headers={'Content-Type': 'application/json', **(headers or {})})
    with urllib.request.urlopen(req, timeout=15) as response:
        return json.load(response)


def queue(body):
    return post(QUEUE_URL, body, {'X-VNPT-Queue-Key': os.environ['NOTIFY_QUEUE_KEY']})


def message(job):
    stamp = datetime.datetime.fromisoformat(job['created_at'].replace('Z', '+00:00'))
    when = stamp.astimezone(ZoneInfo('Asia/Ho_Chi_Minh')).strftime('%d/%m/%Y %H:%M')
    return '\n'.join([
        '[KIỂM THỬ — KHÔNG LIÊN HỆ]' if job.get('is_test') else 'KHÁCH ĐĂNG KÝ TƯ VẤN VNPT',
        'Họ tên: ' + job['full_name'], 'Điện thoại: ' + job['phone'],
        'Gói / nhu cầu: ' + job['demand'], 'Khu vực: ' + job['ward'],
        'Địa chỉ: ' + (job.get('address') or 'Chưa cung cấp'), 'Thời gian: ' + when,
        'Mã đăng ký: ' + job['lead_id'],
    ])


def telegram(job):
    result = post('https://api.telegram.org/bot' + os.environ['TELEGRAM_BOT_TOKEN'] + '/sendMessage',
                  {'chat_id': os.environ['TELEGRAM_CHAT_ID'], 'text': message(job),
                   'protect_content': True, 'link_preview_options': {'is_disabled': True}})
    if not result.get('ok'):
        raise ValueError('TELEGRAM_FAILED')


def email(job):
    # Dedicated app password only; never use the user's ordinary Gmail password.
    sender = os.environ['SMTP_USER']
    mail = EmailMessage()
    mail['From'] = sender
    mail['To'] = os.environ['NOTIFY_EMAIL_TO']
    mail['Subject'] = '[VNPT] ' + ('Kiểm thử thông báo' if job.get('is_test') else 'Khách đăng ký tư vấn mới')
    mail['Message-ID'] = '<vnpt-' + job['lead_id'] + '@internet.vnptcantho.io.vn>'
    mail.set_content(message(job))
    with smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=20, context=ssl.create_default_context()) as smtp:
        smtp.login(sender, os.environ['SMTP_APP_PASSWORD'])
        smtp.send_message(mail)


def google_sheets(job):
    url = os.environ['SHEETS_WEBHOOK_URL']
    if not url.startswith('https://script.google.com/macros/s/') or not url.endswith('/exec'):
        raise ValueError('INVALID_SHEETS_URL')
    result = post(url, {'key': os.environ['SHEETS_WEBHOOK_KEY'], 'job': job})
    if result.get('ok') is not True:
        raise ValueError('SHEETS_FAILED')


def enabled_channels():
    channels = ['telegram']
    if os.environ.get('SMTP_USER') and os.environ.get('SMTP_APP_PASSWORD'):
        channels.append('email')
    if os.environ.get('SHEETS_WEBHOOK_URL') and os.environ.get('SHEETS_WEBHOOK_KEY'):
        channels.append('google_sheets')
    return channels


def run():
    channels = enabled_channels()
    processed, needs_retry = 0, False
    for channel in channels:
        jobs = queue({'action': 'claim', 'channels': [channel]})
        if not isinstance(jobs, list):
            raise ValueError('INVALID_QUEUE_RESPONSE')
        for job in jobs:
            success, error, retry = False, None, 300
            try:
                {'telegram': telegram, 'email': email, 'google_sheets': google_sheets}[channel](job)
                success = True
            except urllib.error.HTTPError as exc:
                error = 'TELEGRAM_FAILED' if channel == 'telegram' else 'EMAIL_FAILED'
                if exc.code == 429:
                    error = 'RATE_LIMIT'
                    try:
                        retry = max(60, min(86400, int(json.load(exc).get('parameters', {}).get('retry_after', 300))))
                    except Exception:
                        pass
            except Exception:
                error = 'TELEGRAM_FAILED' if channel == 'telegram' else 'EMAIL_FAILED'
            acknowledged = queue({'action': 'finish', 'id': job['id'], 'lease_id': job['lease_id'],
                                  'success': success, 'error': error, 'retry_seconds': retry})
            if acknowledged is not True:
                raise ValueError('ACK_FAILED')
            # No customer data, addresses, bot tokens, or provider exceptions in logs.
            print(channel.upper() + ('_SENT' if success else '_RETRY_QUEUED'), flush=True)
            processed += 1
            needs_retry = needs_retry or not success
    return {'processed': processed, 'needs_retry': needs_retry}


def write_retry(path, next_at):
    fd, temporary = tempfile.mkstemp(dir=path.parent, prefix='.event-')
    try:
        with os.fdopen(fd, 'w') as stream:
            os.fchmod(stream.fileno(), 0o660)
            json.dump({'next_at': next_at}, stream)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
        directory_fd = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def run_events(root):
    root = pathlib.Path(root)
    active = []
    for flag in (root / 'ready').glob('*.json'):
        target = root / 'retry' / flag.name
        # Journal before sending. A crash leaves a durable, delayed recovery flag.
        write_retry(target, time.time() + 300)
        flag.unlink(missing_ok=True)
        active.append(target)
    if not active:
        return  # Critical: no flag means ZERO cloud/API calls.
    try:
        deadline = time.monotonic() + 100
        while True:
            result = run()
            if result['needs_retry'] or not result['processed'] or time.monotonic() >= deadline:
                break
        state = queue({'action': 'state', 'channels': enabled_channels()})
        if state.get('pending', 0) == 0:
            for flag in active:
                flag.unlink(missing_ok=True)
        else:
            due = datetime.datetime.fromisoformat(state['next_due_at'].replace('Z', '+00:00')).timestamp()
            for flag in active:
                write_retry(flag, max(time.time() + 30, due))
    except Exception:
        for flag in active:
            write_retry(flag, time.time() + 60)
        raise


if __name__ == '__main__':
    try:
        if os.environ.get('VNPT_EVENTS_DIR'):
            run_events(os.environ['VNPT_EVENTS_DIR'])
        else:
            run()  # Compatibility before the atomic production cutover.
    except Exception:
        print('NOTIFICATION_WORKER_FAILED_NO_SECRET_LOGGED', flush=True)
        raise SystemExit(1)
