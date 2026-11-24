# Bank Transaction System backend

Express 5 and Mongoose API for the Ledgerly web application. It provides authentication, user-owned accounts, account-to-account transfers, a double-entry-style ledger, and a restricted system-user initial-funds flow.

## Requirements

- Node.js and npm.
- MongoDB on a replica set or MongoDB Atlas. Transfer and initial-funds writes run in MongoDB transactions.
- Gmail OAuth credentials only when email notifications are needed.

## Install and configure

Run these commands from `Backend/`:

```powershell
npm install
Copy-Item .env.example .env
```

Set `MONGO_URI`, `DATABASE_NAME`, `JWT_SECRET`, and `PORT` in `.env`. The example sets `PORT=3000`; if it is omitted, the server defaults to port `3123`. Gmail OAuth variables (`CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN`, and `EMAIL_USER`) are used by the email service. Set `NODE_ENV=test` to disable email sending and the startup mail connection check.

## Start the API

```powershell
npm run dev
```

`npm run dev` starts the Express server with nodemon. Use `npm start` to start it without nodemon. The API is mounted under `/api`; see [`docs/API.md`](docs/API.md) for routes and examples.

## System-user funding

The `/api/transactions/system/initial-funds` endpoint is restricted to a provisioned system user. Set `SYSTEM_USER_NAME`, `SYSTEM_USER_EMAIL`, and `SYSTEM_USER_PASSWORD` in `.env`, then run:

```powershell
npm run setup:system-user
```

This creates the configured system user and its account if missing. It does not reset the password of an existing system user. The endpoint transfers funds from that account to an existing active recipient account identified by its MongoDB ID.

## Tests

Run the HTTP tests without a database with:

```powershell
npm test
```

Set `TEST_MONGO_URI` to run the database integration tests. The suite creates a temporary database named `bank_transaction_test_<process-id>_<random-suffix>` and drops that database after the tests. Use a disposable MongoDB deployment; the connection must be allowed to create and drop databases and must support transactions for the transfer/ledger tests. The suite does not fall back to `MONGO_URI`.

PowerShell example:

```powershell
$env:TEST_MONGO_URI = "mongodb://localhost:27017/?replicaSet=rs0"
npm test
Remove-Item Env:TEST_MONGO_URI
```

For the isolated website walkthrough database and its synthetic accounts, follow [`docs/TEST_DATABASE_GUIDE.md`](docs/TEST_DATABASE_GUIDE.md).

## Monthly dashboard demo seed

`npm run seed:monthly-demo` creates 84 synthetic completed transfers across October and November 2026. On a test/e2e/demo database, it uses two existing active INR accounts belonging to non-system users with `.test` email addresses; it does not create accounts there. It uses fixed idempotency keys, verifies existing seed entries and ledger rows, and checks the accounts' balances and latest-100 transaction feeds. The accounts need enough existing balance for the planned transfers; the script will not top them up.

The script refuses database names that are not recognized as test, e2e, or demo by default. Use a dedicated test database by setting `DATABASE_NAME` in the same PowerShell session before running it:

```powershell
$env:DATABASE_NAME = "bank_transaction_system_e2e_20261105"
npm run seed:monthly-demo
```

An explicit opt-in allows adding the reserved synthetic monthly-demo users, accounts, and seed transactions to `BackendLedger`. It requires an active INR system account. If both demo accounts are empty and have no transaction history, the script records a one-time INR 500 opening credit from that system account; it will not adjust partial balances. Newly created demo users have generated passwords printed once. Use this only when you intend to add demo data to `BackendLedger`:

```powershell
$env:ALLOW_MAIN_DATABASE_DEMO_SEED = "yes"
npm run seed:monthly-demo
Remove-Item Env:ALLOW_MAIN_DATABASE_DEMO_SEED
```

Read the seed script's output carefully and use the explicit opt-in only for the intended database. Aside from the optional opening credit, seed transfers run between the two reserved demo accounts.

## Project layout

```text
src/
  app.js
  config/db.js
  controllers/
  middlewares/
  models/
  routes/
  services/email.service.js
scripts/
  seed-system-user.js
  seed-monthly-demo-transactions.js
docs/
  API.md
  TEST_DATABASE_GUIDE.md
test/api.test.js
.env.example
package.json
server.js
```

The project-level guide is [`../README.md`](../README.md). The React client has a separate guide at [`../Frontend/README.md`](../Frontend/README.md).
