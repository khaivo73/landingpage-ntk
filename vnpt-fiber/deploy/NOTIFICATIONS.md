# Notification verification

## Result

Automatic Telegram and email notifications passed the combined production form test on 12 November 2026.

- Live form submission: HTTP 200.
- Registration persistence: verified.
- Telegram delivery: sent, first attempt, no error.
- Email delivery: sent, first attempt, no error.
- Mailbox receipt: independently verified in Inbox using the test message identifier.
- Test registration: closed and marked do not contact after verification.
- Google Sheets delivery: not connected; awaiting the owner's spreadsheet ID and runtime authorization.

## Automated checks

- Python notification and setup tests: 7 passed.
- Existing form validation and JSON tests: 13 passed.
- ESLint: passed for notification implementation.
- Database checks: test exclusion, leasing, wrong-lease rejection and retry delay passed.

No website bundle changes were required for this notification update. Email and Telegram delivery may be retried after provider/network failure; registration references help identify duplicates. Credentials are excluded from source control and this report.
