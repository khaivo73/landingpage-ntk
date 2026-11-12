"""Run interactively on VPS. Credential is never a CLI argument or log entry."""
import getpass
import json
import os
from pathlib import Path
import re
import tempfile
import sys
import urllib.request

def configure():
    if os.geteuid()!=0: raise ValueError('ROOT_REQUIRED')
    if not sys.stdin.isatty(): raise ValueError('INTERACTIVE_TERMINAL_REQUIRED')
    url=input('Google Web App URL (/exec): ').strip()
    if not re.fullmatch(r'https://script\.google\.com/macros/s/[A-Za-z0-9_-]+/exec',url):
        raise ValueError('INVALID_WEB_APP_URL')
    key=getpass.getpass('Sheets key (hidden): ').strip()
    if not re.fullmatch(r'[0-9a-f]{72}',key): raise ValueError('INVALID_KEY')
    request=urllib.request.Request(url,data=json.dumps({'key':key,'ping':True}).encode(),
                                  headers={'Content-Type':'application/json'},method='POST')
    with urllib.request.urlopen(request,timeout=30) as response: result=json.load(response)
    if result.get('ok') is not True or result.get('ready') is not True: raise ValueError('PING_FAILED')
    path=Path('/etc/vnpt-notifications.env')
    env=dict(line.split('=',1) for line in path.read_text().splitlines() if '=' in line)
    env.update(SHEETS_WEBHOOK_URL=url,SHEETS_WEBHOOK_KEY=key)
    fd,temporary=tempfile.mkstemp(dir=path.parent,prefix='.vnpt-notify-')
    try:
        with os.fdopen(fd,'w') as output:
            os.fchmod(output.fileno(),0o600)
            output.write(''.join(k+'='+v+'\n' for k,v in env.items()))
            output.flush();os.fsync(output.fileno())
        os.replace(temporary,path)
    finally:
        if os.path.exists(temporary):os.unlink(temporary)
    print('SHEETS_WEBHOOK_CONFIGURED')

if __name__=='__main__':
    try:configure()
    except Exception:
        print('SHEETS_WEBHOOK_SETUP_FAILED_NO_SECRET_LOGGED')
        raise SystemExit(1)
