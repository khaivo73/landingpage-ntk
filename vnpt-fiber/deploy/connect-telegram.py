"""Run on the VPS; never print tokens or other chats."""
import hashlib
import json
import pathlib
import secrets
import urllib.request

path = pathlib.Path('/etc/vnpt-notifications.env')
env = dict(line.split('=', 1) for line in path.read_text().splitlines() if '=' in line)

def api(method):
    with urllib.request.urlopen('https://api.telegram.org/bot' + env['TELEGRAM_BOT_TOKEN'] + '/' + method, timeout=20) as response:
        result = json.load(response)
    if not result.get('ok'):
        raise ValueError('TELEGRAM_API_FAILED')
    return result['result']

try:
    if api('getMe').get('username') != 'vnpt_cantho_khaivo73_bot':
        raise ValueError('WRONG_BOT')
    matches = {str(m['chat']['id']) for item in api('getUpdates?limit=100&timeout=0')
               for m in [item.get('message', {})]
               if m.get('chat', {}).get('type') == 'private' and m.get('text', '').strip() == 'VNPT-KHAI-6881'}
    if len(matches) != 1:
        print('RECIPIENT_MATCHES', len(matches))
    else:
        env['TELEGRAM_CHAT_ID'] = matches.pop()
        env.setdefault('NOTIFY_QUEUE_KEY', secrets.token_hex(36))
        path.write_text(''.join(k + '=' + v + '\n' for k, v in env.items()))
        path.chmod(0o600)
        print('RECIPIENT_LINKED')
        print('QUEUE_KEY_SHA256', hashlib.sha256(env['NOTIFY_QUEUE_KEY'].encode()).hexdigest())
except Exception:
    print('CONNECT_FAILED_NO_SECRET_LOGGED')
