#!/usr/bin/env bash
# Installs isolated application only. Does not touch existing Apache sites or DNS.
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo 'Run as root'; exit 1; }
release=${1:?Supply verified release commit}
runtime_sha=${2:?Supply verified SHA256}
[[ "$release" =~ ^[a-f0-9]{40}$ ]]
[[ "$runtime_sha" =~ ^[a-f0-9]{64}$ ]]
node_version=v24.22.2
work=$(mktemp -d /var/tmp/vnpt-install.XXXXXX)
trap 'rm -rf "$work"' EXIT
cd "$work"
if [ ! -x /opt/vnpt-node/bin/node ]; then
  curl -fSL --retry 2 "https://nodejs.org/dist/$node_version/node-$node_version-linux-x64.tar.xz" -o node.tar.xz
  curl -fsSL "https://nodejs.org/dist/$node_version/SHASUMS256.txt" -o SHASUMS256.txt
  expected=$(awk -v file="node-$node_version-linux-x64.tar.xz" '$2==file {print $1}' SHASUMS256.txt)
  [ "${#expected}" = 64 ]
  printf '%s  node.tar.xz\n' "$expected" | sha256sum -c -
  mkdir -p /opt/vnpt-node
  tar -xJf node.tar.xz -C /opt/vnpt-node --strip-components=1
fi
/opt/vnpt-node/bin/node --version
getent passwd vnpt-fiber >/dev/null || useradd --system --user-group --home-dir /opt/vnpt-fiber --shell /usr/sbin/nologin vnpt-fiber
mkdir -p /opt/vnpt-fiber/releases
if [ ! -d "/opt/vnpt-fiber/releases/$release" ]; then
  curl -fSL --retry 2 "https://github.com/khaivo73/landingpage-ntk/releases/download/vnpt-build-$release/vnpt-runtime.tar.gz" -o vnpt-runtime.tar.gz
  printf '%s  vnpt-runtime.tar.gz\n' "$runtime_sha" | sha256sum -c -
  mkdir "/opt/vnpt-fiber/releases/$release"
  tar -xzf vnpt-runtime.tar.gz -C "/opt/vnpt-fiber/releases/$release" --no-same-owner
fi
app="/opt/vnpt-fiber/releases/$release"
test -f "$app/server.js"
mkdir -p "$app/.next/cache"
chown -R vnpt-fiber:vnpt-fiber "$app/.next/cache"
if [ -e /opt/vnpt-fiber/current ] && [ ! -L /opt/vnpt-fiber/current ]; then
  echo 'Existing current path is not a symlink; refusing to replace'; exit 1
fi
ln -sfn "$app" /opt/vnpt-fiber/current
if [ ! -e /etc/vnpt-fiber.env ]; then
  umask 077
  printf 'SUPABASE_URL=https://sktvegipvzngwsditzjx.supabase.co\nSUPABASE_SECRET_KEY=\nLEAD_IP_HASH_SECRET=%s\nSITE_URL=\nSITE_INDEXABLE=false\n' "$(openssl rand -hex 32)" > /etc/vnpt-fiber.env
fi
curl -fsSL "https://raw.githubusercontent.com/khaivo73/landingpage-ntk/$release/vnpt-fiber/deploy/vnpt-fiber.service" -o "$work/vnpt-fiber.service"
if [ -e /etc/systemd/system/vnpt-fiber.service ]; then
  cmp -s "$work/vnpt-fiber.service" /etc/systemd/system/vnpt-fiber.service || { echo "Different service exists; review required"; exit 1; }
else
  install -m 644 "$work/vnpt-fiber.service" /etc/systemd/system/vnpt-fiber.service
fi
systemctl daemon-reload
systemctl enable --now vnpt-fiber
for attempt in 1 2 3 4 5; do
  if curl -fsS -o /dev/null http://127.0.0.1:3100/; then echo 'VNPT_RUNTIME_OK'; exit 0; fi
  sleep 2
done
systemctl status vnpt-fiber --no-pager
exit 1
