# Event-driven notification upgrade

## Intended behavior

Validated submissions write a local pending recovery marker before database persistence. Once persistence finishes (or its response is uncertain), the marker moves to the ready directory. systemd.path wakes the worker immediately. The database insert atomically creates the durable per-channel outbox rows.

The worker only contacts cloud APIs when at least one ready marker exists. It journals markers into a retry directory before delivery so a crash cannot erase the wakeup. Failed messages retain their existing outbox retry/backoff; local flags are promoted only when due. A local-only recovery timer also handles markers abandoned during a process crash. Empty-system recovery performs zero cloud calls.

Google Sheets receives authenticated HTTPS POST events through the owner's Apps Script web app, retaining UUID deduplication and manual notes. The previous time-driven Sheets trigger is disabled only after the event receiver and production path pass verification.

## Cutover order

1. Build and validate the new Next.js bundle with event mode unset (old behavior is retained).
2. Owner authorizes the Apps Script web app deployment, executing as owner with endpoint access for server requests. The receiver rejects writes without the dedicated secret; it does not publish Sheet contents.
3. Configure and ping the web app from the VPS using `configure-sheets-webhook.py`, keeping credentials in the root-only existing environment file.
4. Stage the worker, recovery helper, path and timer units in `/opt/vnpt-notify`.
5. Install the new application runtime, then run `enable-event-mode.sh`. It enables the directory watcher and local-only recovery timer, and disables the old network-polling timer.
6. Run `tatKiemTraDinhKyVNPT` in the owner's Apps Script project to remove the previous Sheets polling trigger.
7. Verify a labelled form test reaches all three channels, test duplicate submission, and observe the idle condition without remote calls.

## Release status

Production cutover completed on 2026-11-12 using runtime revision 544216bc70e6a23eb98101547232fa37cab56cc4. The authenticated Sheets webhook passed its readiness check. The directory watcher and local recovery timer are active; the previous network polling timer is inactive and the previous Apps Script time trigger has been removed.

Live verification: a labelled test submission returned HTTP 200, reached Telegram, email and Google Sheets on their first attempts, and left no event markers. A duplicate request with the same UUID returned HTTP 200 and retained exactly one database record and one Sheet row. The email was independently found in the receiving inbox. Test records were marked closed after verification.

Validation completed: 23 JavaScript tests, 11 Python tests, type checking and production build passed. Hosted transactional checks verified Google-channel claims, acknowledgement and pending-state calculations with rollback. Tests explicitly verify zero cloud calls while idle, durable recovery after failure, no wakeup before persistence completes, webhook authentication and prevention of unauthenticated Sheet writes.

## Limits and recovery

No customer data is stored in local marker files. A marker is a durable wakeup hint, while Supabase remains the authoritative record and delivery queue. A local-only periodic check is required to recover crashes and delayed retries; it never polls cloud APIs without work. Terminal failures remain visible in the database after the attempt limit. Sheet edits do not sync back to the database.

To roll back, disable the path/recovery timer, remove the event-mode service drop-ins and restart the web service and the previous notification timer; restore the previous Sheets trigger if push delivery is disabled. Keep all durable outbox rows and local markers.
