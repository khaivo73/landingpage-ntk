"""Interactive VPS-only Gmail setup. Never pass a password as a command argument."""
import getpass
import os
from pathlib import Path
import re
import smtplib
import ssl
import subprocess
import sys
import tempfile
from email.message import EmailMessage

ACCOUNT = 'khaivo73@gmail.com'
ENV_PATH = Path('/etc/vnpt-notifications.env')


def save_credentials(path, password):
    # Preserve Telegram and queue credentials. Atomic replacement, root-only mode.
    env = dict(line.split('=', 1) for line in path.read_text().splitlines() if '=' in line)
    env.update(SMTP_USER=ACCOUNT, SMTP_APP_PASSWORD=password, NOTIFY_EMAIL_TO=ACCOUNT)
    fd, temporary = tempfile.mkstemp(prefix='.vnpt-notify-', dir=path.parent)
    try:
        with os.fdopen(fd, 'w') as stream:
            os.fchmod(stream.fileno(), 0o600)
            stream.write(''.join(key + '=' + value + '\n' for key, value in env.items()))
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def verify_and_send_test(password):
    mail = EmailMessage()
    mail['From'] = ACCOUNT
    mail['To'] = ACCOUNT
    mail['Subject'] = '[VNPT] Kiểm thử kết nối email tự động'
    mail.set_content('Đây là email kiểm thử cấu hình thông báo VNPT. Không có dữ liệu khách hàng trong email này.\n'
                     'Sau khi cấu hình được lưu, VPS sẽ xử lý các thông báo email đang chờ trong hàng đợi.')
    with smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=20, context=ssl.create_default_context()) as smtp:
        smtp.login(ACCOUNT, password)
        refused = smtp.send_message(mail)
        if refused:
            raise ValueError('RECIPIENT_REFUSED')


def main():
    if os.geteuid() != 0:
        print('CAN CHAY BANG ROOT HOAC SUDO')
        return 1
    if not sys.stdin.isatty():
        print('CAN CHAY TRUC TIEP TRONG TERMINAL SSH, KHONG PIPE MAT KHAU')
        return 1
    if not ENV_PATH.is_file() or not Path('/opt/vnpt-notify/notification-worker.py').is_file():
        print('THIEU CAU HINH WORKER - DUNG LAI, KHONG DOI CAU HINH')
        return 1
    print('Tai khoan gui va nhan: ' + ACCOUNT)
    print('Nhap MAT KHAU UNG DUNG Google 16 ky tu. Khong nhap mat khau Gmail thong thuong.')
    password = ''.join(getpass.getpass('Mat khau ung dung (an ky tu): ').split())
    if not re.fullmatch(r'[A-Za-z]{16}', password):
        print('SAI DINH DANG - KHONG LUU')
        return 1
    try:
        verify_and_send_test(password)
    except smtplib.SMTPAuthenticationError:
        print('GOOGLE_TU_CHOI_DANG_NHAP - KIEM TRA MAT KHAU UNG DUNG, CHUA LUU')
        return 1
    except Exception:
        print('SMTP_KET_NOI_HOAC_GUI_THAT_BAI - CHUA LUU, KHONG IN THONG TIN BI MAT')
        return 1
    print('EMAIL_TEST_SMTP_ACCEPTED - KIEM TRA HOP THU VA THU RAC')
    save_credentials(ENV_PATH, password)
    password = None
    print('EMAIL_CONFIG_SAVED')
    try:
        subprocess.run(['systemctl', 'enable', '--now', 'vnpt-notify.timer'], check=True, capture_output=True)
        subprocess.run(['systemctl', 'start', 'vnpt-notify.service'], check=True, capture_output=True, timeout=115)
    except Exception:
        print('DA_LUU_NHUNG_CAN_KIEM_TRA_DICH_VU_VNPT_NOTIFY')
        return 1
    print('EMAIL_WORKER_STARTED')
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (KeyboardInterrupt, EOFError):
        print('\nDA_HUY')
        raise SystemExit(1)
