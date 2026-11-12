# Notification verification

## Result

Automatic Telegram and email notifications passed the combined production form test on 12 November 2026.

- Live form submission: HTTP 200.
- Registration persistence: verified.
- Telegram delivery: sent, first attempt, no error.
- Email delivery: sent, first attempt, no error.
- Mailbox receipt: independently verified in Inbox using the test message identifier.
- Test registration: closed and marked do not contact after verification.
- Google Sheets: enabled after owner authorization. A time-driven Apps Script trigger runs approximately every minute using a dedicated credential stored in Script Properties. The live form test on 12 November 2026 at 18:01 Vietnam time reached Sheets, Telegram and email on their first attempts. The Sheets row retained the correct package, phone leading zero, typed timestamp, test warning and attribution. Inbox receipt was independently verified.
- The same live submission was sent twice with one registration UUID: both requests returned HTTP 200, with one database registration and exactly one Sheet row. The test row and registration were closed after verification. No customer data is included in this report.

## Automated checks

- Python notification and setup tests: 7 passed.
- Form validation, JSON and Sheets synchronization tests: 17 passed (4 Sheets tests cover deduplication, preservation of manual notes, formula injection protection and invalid phone rejection).
- ESLint: passed for notification implementation.
- Database checks: test exclusion, leasing, wrong-lease rejection and retry delay passed.
- Sheets database transaction checks: three-channel enqueue, exclusive lease, wrong-lease rejection and acknowledgement passed with rollback. Unauthenticated Sheets endpoint access returned 401.

No website bundle changes were required for this notification update. Email and Telegram delivery may be retried after provider/network failure; registration references help identify duplicates. Credentials are excluded from source control and this report.

## Sheets behavior

Only newly submitted registrations are enqueued; historical records are not automatically backfilled. New rows are appended by registration UUID. Existing rows, including manual status, owner and notes, are not overwritten on retry. Editing a Sheet row does not update the database. The trigger processes up to five pending rows per invocation and prevents overlapping runs. Failed deliveries remain in the database queue for retry or manual review after the attempt limit.
