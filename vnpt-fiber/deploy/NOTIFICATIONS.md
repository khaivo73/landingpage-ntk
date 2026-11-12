# VNPT notification delivery

## Live status

- Website: https://internet.vnptcantho.io.vn/
- Recipient bot: https://t.me/vnpt_cantho_khaivo73_bot
- Email recipient explicitly authorized by owner: khaivo73@gmail.com.
- Telegram delivered one labelled test via live POST /api/leads, atomic outbox trigger, authenticated queue endpoint and VPS systemd worker on 11 November 2026 (Vietnam time). Outbox confirmed sent, attempts=1.
- Email is implemented but NOT enabled or live-tested until the owner configures a Google app password on the VPS. ChatGPT's Gmail connection is not a runtime SMTP credential.
- Google Sheets integration is separate and pending the owner's spreadsheet ID and runtime authorization. No Sheets delivery is claimed.

## Architecture

Lead insert atomically enqueues Telegram and email rows. No historical leads are backfilled. `system_qa` fixtures are excluded. `delivery_qa` messages are visibly labelled and the completed live test lead is closed so no further contact/email is attempted.

The separate `vnpt-notification-queue` Edge Function validates a dedicated queue credential. Lead intake remains write-only; it cannot claim customer records. Both queue tables and RPCs are unavailable to anon/authenticated roles. Only the credential digest is in source; raw secrets stay in root-only `/etc/vnpt-notifications.env` on the VPS.

`vnpt-notify.timer` runs the separate worker every 15 seconds after the preceding invocation ends. Each job has a two-minute lease, unique lead/channel identity, retry delay and maximum 12 attempts. Closed leads are not claimed. After the final expired lease the job is marked failed. Inspect failed rows in Supabase for manual follow-up. Logs contain delivery codes only.

Delivery is at-least-once: if a provider accepted a message but acknowledgement failed, a retry may duplicate it. Every notification includes the registration UUID. Email Message-ID is stable per lead, but this is not a guarantee of inbox deduplication. SMTP acceptance also does not prove inbox delivery; check Inbox/Spam.

## Gmail setup

1. On the owner's Google account enable two-step verification and create an app password named `VNPT VPS`. Never use the ordinary account password.
2. Download `configure-email.py` from a reviewed immutable Git commit to `/opt/vnpt-notify/configure-email.py`.
3. Run as root in an interactive SSH terminal: `python3 /opt/vnpt-notify/configure-email.py`.
4. Paste the app password only at its hidden prompt. The program does not take credentials in shell arguments or print provider exceptions.
5. Script tests TLS SMTP login and submits a test message to the authorized address before atomically saving credentials, preserving Telegram settings with file mode 0600. It then starts the existing timer and worker.
6. Verify `EMAIL_CONFIG_SAVED`, `EMAIL_WORKER_STARTED`, and receipt of the test email. Verify a fresh labelled form fixture reaches the email queue and becomes sent before calling email delivery complete.

SMTP uses smtp.gmail.com:465 with certificate verification. No new paid service is required. Worker claims email only when both SMTP_USER and SMTP_APP_PASSWORD are configured; otherwise pending email rows remain durable without consuming attempts.

## Validation

- `python3 -m unittest discover -s tests -p 'test_*.py'`: 7 tests passed, including provider failure isolation, retry handling, account/recipient binding, atomic credential save, root-only permissions, and preservation of Telegram credentials.
- `npm test`: 13 existing lead validation/JSON tests passed.
- `npm run lint`: passed after queue/worker implementation.
- Hosted SQL transaction checks: system QA exclusion, leasing, no double claim, wrong-lease rejection, retry and backoff passed with rollback.
- Security advisors: no WARN/ERROR; INFO for intentionally service-only RLS tables with no public policies.
- Production Next.js bundle is unchanged by these worker-only additions. No new website build or restart is required.

## Schema source

`supabase/002_notifications.sql` is the consolidated final schema. Hosted migration history contains `vnpt_notification_outbox`, `vnpt_notification_expired_final_lease`, and `vnpt_allow_labelled_delivery_test`. Do not reapply the consolidated schema to an already migrated database.
