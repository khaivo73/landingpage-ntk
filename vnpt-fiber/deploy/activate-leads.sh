#!/usr/bin/env bash
# Run from an authenticated SSH terminal. Never paste credentials into chat.
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo 'Run as root'; exit 1; }
[ -f /etc/vnpt-fiber.env ] || { echo 'Application environment is missing'; exit 1; }
[ -t 0 ] || { echo 'Run the downloaded script in an interactive SSH terminal'; exit 1; }
trap 'unset vnpt_key' EXIT
IFS= read -r -s -p 'Paste Supabase server secret (input hidden), then Enter: ' vnpt_key
printf '\n'
[[ "$vnpt_key" =~ ^sb_secret_[A-Za-z0-9_-]+$ ]] || { echo 'Invalid secret key format'; exit 1; }
# Validate credentials without printing them or retrieving customer data.
http_status=$(printf 'url = "https://sktvegipvzngwsditzjx.supabase.co/rest/v1/vnpt_leads?select=id&limit=0"\nheader = "apikey: %s"\n' "$vnpt_key" | curl -sS --connect-timeout 10 --max-time 20 -K - -o /dev/null -w '%{http_code}')
[ "$http_status" = 200 ] || { echo "Supabase credential check failed (HTTP $http_status); environment unchanged"; exit 1; }
sed -i '/^SUPABASE_SECRET_KEY=/d' /etc/vnpt-fiber.env
umask 077
printf '\nSUPABASE_SECRET_KEY=%s\n' "$vnpt_key" >> /etc/vnpt-fiber.env
chmod 600 /etc/vnpt-fiber.env
unset vnpt_key
systemctl restart vnpt-fiber
printf 'Supabase key configured. Verify a test registration at https://internet.vnptcantho.io.vn/ before accepting customers.\n'
