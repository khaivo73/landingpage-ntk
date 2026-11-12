#!/usr/bin/env bash
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo ROOT_REQUIRED; exit 1; }
# Stage these reviewed files in /opt/vnpt-notify before calling this installer.
cd /opt/vnpt-notify
test -f notification-worker.py
test -f event-spool.py
grep -q '^SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/' /etc/vnpt-notifications.env
grep -q '^SHEETS_WEBHOOK_KEY=' /etc/vnpt-notifications.env
getent group vnpt-events >/dev/null || groupadd --system vnpt-events
for dir in pending ready retry; do install -d -m 2770 -o root -g vnpt-events "/var/lib/vnpt-events/$dir"; done
install -d /etc/systemd/system/vnpt-fiber.service.d /etc/systemd/system/vnpt-notify.service.d
cat > /etc/systemd/system/vnpt-fiber.service.d/events.conf <<'EOF'
[Service]
SupplementaryGroups=vnpt-events
Environment=LEAD_EVENTS_DIR=/var/lib/vnpt-events
ReadWritePaths=/var/lib/vnpt-events
EOF
cat > /etc/systemd/system/vnpt-notify.service.d/events.conf <<'EOF'
[Service]
SupplementaryGroups=vnpt-events
Environment=VNPT_EVENTS_DIR=/var/lib/vnpt-events
ReadWritePaths=/var/lib/vnpt-events
TimeoutStartSec=300
EOF
for unit in vnpt-notify.path vnpt-notify-recovery.service vnpt-notify-recovery.timer; do
 install -m 644 "$unit" "/etc/systemd/system/$unit"
done
systemctl disable --now vnpt-notify.timer
systemctl stop vnpt-notify.service
systemctl daemon-reload
systemctl restart vnpt-fiber
systemctl enable --now vnpt-notify.path vnpt-notify-recovery.timer
echo VNPT_EVENT_MODE_ENABLED
