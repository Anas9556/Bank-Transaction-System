# Website test database guide

This guide is for the isolated database created for the website walkthrough:

```text
Database name: bank_transaction_system_e2e_20261105
```

The database contains synthetic test users and accounts, one initial-funds
credit, and one completed transfer. Its initial-funds system account has
already been provisioned. Do not point the app at a production database while
using this guide.

## Start the backend against the test database

Open PowerShell in `Backend/`. The backend reads `MONGO_URI` from the local
`.env` file. In the **same PowerShell window**, override `DATABASE_NAME` and
set test mode before starting the server:

```powershell
$env:DATABASE_NAME = "bank_transaction_system_e2e_20261105"
$env:NODE_ENV = "test"
npm run dev
```

Keep this terminal open while using the app. Confirm the startup output says:

```text
Database connected to bank_transaction_system_e2e_20261105
```

If it says `BackendLedger` (or any other name), stop the server with `Ctrl+C`;
that means the override was not set in the terminal running the backend. Do
not continue testing against that database.

`NODE_ENV=test` disables outbound email sending and the mail connection check.
It must also be set in this same backend terminal. The test website does not
need valid email OAuth credentials.

The message `invalid_client: The provided client secret is invalid` is a Gmail
OAuth configuration error, not a MongoDB error. For normal email sending,
replace the OAuth client ID, client secret, and refresh token in the local
`Backend/.env` with valid credentials from the configured Google account. Never
paste those credentials into chat. For this test walkthrough, use
`NODE_ENV=test` instead.

## Start the website

Open a second PowerShell window in `Frontend/`:

```powershell
$env:VITE_BACKEND_URL = "http://localhost:3000"
npm run dev -- --host 127.0.0.1
```

Open <http://127.0.0.1:5173>. Keep the backend terminal open; Vite forwards
website API requests to it.

## Synthetic test accounts

Both website users use the password `Test-Website-E2E-2026!`.

| User | Email | Account ID | Current balance |
|---|---|---|---:|
| Website Test Sender | `website-e2e-sender-1793873361513@example.test` | `6aec55d696e4e487ed005b20` | ₹750 |
| Website Test Recipient | `website-e2e-recipient-1793873367199@example.test` | `6aec55da96e4e487ed005b22` | ₹250 |

These are synthetic local test credentials, not real user credentials. The
sender was initially credited ₹1,000, then transferred ₹250 to the recipient.
The existing transfer is recorded as category `Bills` with note
`Website E2E transfer verification`.

## Try the website

1. Sign in as either test user.
2. Open **Dashboard** to see the current balance and incoming/outgoing totals.
3. Open **Transactions** to inspect that user's incoming or outgoing transfer.
4. Open **Reports & Analytics** to view the credit, debit, category, and net
   movement summaries.
5. To try another transfer, open **Transfers**, enter the recipient account ID
   shown above, choose an amount from ₹1 to the sender's available balance,
   optionally select a category and note, then submit. Transfer records are
   persistent in this test database.
6. To verify the insufficient-funds handling, try an amount greater than the
   sender's displayed balance. The API should reject it and leave both
   balances unchanged.

When signed in as the sender, the expected totals before any additional
transfers are ₹1,000 incoming, ₹250 outgoing, ₹750 net, and ₹750 balance. The
recipient should see ₹250 incoming and ₹250 balance.

## Stop and remove the test database

Stop the backend and frontend with `Ctrl+C` in their respective terminals.
This stops the app but does not delete database records.

When you are finished, remove only `bank_transaction_system_e2e_20261105`
using your MongoDB provider's database management UI or `mongosh`. For example,
after connecting to the same MongoDB deployment:

```javascript
use bank_transaction_system_e2e_20261105
db.dropDatabase()
```

Verify the selected database name before running `db.dropDatabase()`. Do not
drop the database configured for normal app use.
