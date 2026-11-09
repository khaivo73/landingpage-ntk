# VPS deployment

Do not replace existing WordPress/Apache configuration or reboot the server.

1. Build and test on GitHub Actions Ubuntu; bundle standalone runtime, public assets and .next/static. No Supabase credentials enter build/release. Record SHA256.
2. Install official Node 24 Linux x64 in /opt/vnpt-node (verify vendor checksum); do not replace system Node.
3. Create system user vnpt-fiber, /opt/vnpt-fiber/releases/<commit>, cache directory owned by service user. Extract verified runtime there; current symlink points at release.
4. Create /etc/vnpt-fiber.env owned root:root mode 600 from .env.example. Use server-only Supabase secret key and random IP hash secret. Set SITE_URL to confirmed HTTPS URL; leave SITE_INDEXABLE=false until live tests pass. No credentials in shell history, Git or logs.
5. Install unit file, daemon-reload and start. Check localhost:3100 before adding reverse proxy. Keep 3100 bound to loopback.
6. Add a separate hostname A record to 42.96.17.168; add a separate Apache vhost. Enable proxy/proxy_http/headers if required, apache2ctl configtest then graceful reload. Never overwrite wordpress.conf or its certificate.
7. Obtain TLS certificate for the new hostname through existing certbot installation. Force HTTPS; HTTPS vhost must set RequestHeader set X-Forwarded-Proto "https", ProxyPreserveHost On, strip incoming X-Forwarded-For before ProxyAddHeaders On. Do not trust caller-supplied forwarded IPs.
8. Set real SITE_URL and test full form via HTTPS, DB persisted row, retry idempotency, rate limit and anon rejection. Only then enable indexing if intended.
9. Rollback: point current to prior verified release and restart vnpt-fiber; disable only new vhost if needed. WordPress remains independent.

Supabase project: sktvegipvzngwsditzjx, ap-southeast-1. Customer table: public.vnpt_leads. Admins use Supabase Dashboard; no public read endpoint. Security advisor INFO RLS-with-no-policy is intentional for this service-only table.
