"""Durable notification worker. Secrets supplied only by systemd EnvironmentFile."""
import datetime
import json
import os
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


def run():
    channels = ['telegram']
    if os.environ.get('SMTP_USER') and os.environ.get('SMTP_APP_PASSWORD'):
        channels.append('email')
    for channel in channels:
        jobs = queue({'action': 'claim', 'channels': [channel]})
        if not isinstance(jobs, list):
            raise ValueError('INVALID_QUEUE_RESPONSE')
        for job in jobs:
            success, error, retry = False, None, 300
            try:
                (telegram if channel == 'telegram' else email)(job)
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


if __name__ == '__main__':
    try:
        run()
    except Exception:
        print('NOTIFICATION_WORKER_FAILED_NO_SECRET_LOGGED', flush=True)
        raise SystemExit(1)
