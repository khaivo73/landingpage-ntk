# Notification verification

## Result

Automatic Telegram and email notifications passed the combined production form test on 12 November 2026.

- Live form submission: HTTP 200.
- Registration persistence: verified.
- Telegram delivery: sent, first attempt, no error.
- Email delivery: sent, first attempt, no error.
- Mailbox receipt: independently verified in Inbox using the test message identifier.
- Test registration: closed and marked do not contact after verification.
- Google Sheets: destination headers verified; separate queue endpoint and Apps Script synchronizer prepared. Activation is pending the owner's Google authorization and saving its dedicated queue credential in Script Properties. No successful live Sheets delivery is claimed yet.

## Automated checks

- Python notification and setup tests: 7 passed.
- Form validation, JSON and Sheets synchronization tests: 17 passed (4 Sheets tests cover deduplication, preservation of manual notes, formula injection protection and invalid phone rejection).
- ESLint: passed for notification implementation.
- Database checks: test exclusion, leasing, wrong-lease rejection and retry delay passed.
- Sheets database transaction checks: three-channel enqueue, exclusive lease, wrong-lease rejection and acknowledgement passed with rollback. Unauthenticated Sheets endpoint access returned 401.

No website bundle changes were required for this notification update. Email and Telegram delivery may be retried after provider/network failure; registration references help identify duplicates. Credentials are excluded from source control and this report.
