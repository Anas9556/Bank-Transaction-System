# Ledgerly: Bank Transaction System

Ledgerly is a full-stack ledger application with a React and Vite web client and an Express API backed by MongoDB. The backend records account-to-account transfers as balanced debit and credit ledger entries; account balances are calculated from those entries.

## Features

- Email and password registration and login, with bcrypt password hashing and JWT sessions in an HTTP-only cookie.
- User-owned accounts with names, status, currency, and ledger-derived balances.
- Transfers between active accounts, with sender balance checks, idempotency keys, and MongoDB transactions.
- A restricted system-user console for issuing initial funds to an account by ID.
- Dashboard, transaction history, account pages, reports, and CSV export in the browser.

## Project layout

```text
Backend/
  src/                 Express app, routes, controllers, models, services
  scripts/             System-user setup and demo-data seeding
  docs/                API reference and test database guide
  test/                Node.js HTTP and MongoDB integration tests
Frontend/
  src/                 React pages, components, and API services
  index.html
  vite.config.js
README.md
```

The frontend and backend are separate npm projects. Install dependencies and run commands from the relevant folder.

## Requirements

- Node.js and npm.
- MongoDB configured as a replica set, or MongoDB Atlas. Transfer and funding operations use MongoDB transactions, which require transaction support.
- Gmail OAuth credentials only if you want registration and transaction emails. `NODE_ENV=test` disables email sending and the mail connection check.

## Run locally

### 1. Configure and start the backend

In PowerShell, from the project folder:

```powershell
Set-Location Backend
npm install
Copy-Item .env.example .env
```

Edit `Backend/.env`. Set at least `PORT`, `MONGO_URI`, `DATABASE_NAME`, and a private `JWT_SECRET`. The example uses port `3000`, which matches the Vite proxy default. Start the API:

```powershell
npm run dev
```

The backend listens at `http://localhost:3000` when `PORT=3000`. Without `PORT`, it defaults to `3123`.

### 2. Start the web client

Open a second PowerShell terminal in the project folder:

```powershell
Set-Location Frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Vite forwards `/api` requests to `http://localhost:3000` by default. If your backend uses another origin, set `VITE_BACKEND_URL` before starting Vite, for example:

```powershell
$env:VITE_BACKEND_URL = "http://localhost:3123"
npm run dev
```

The browser API path defaults to `/api` (`VITE_API_BASE_URL`). Keep it on `/api` when using the Vite proxy. The backend does not enable cross-origin browser requests directly. Do not put secrets in `VITE_*` variables; Vite exposes them to the browser.

## Configuration

Backend settings are documented in [`Backend/.env.example`](Backend/.env.example):

- `PORT`: API port; the example sets `3000`, and the server fallback is `3123`.
- `MONGO_URI` and `DATABASE_NAME`: MongoDB connection and selected database.
- `JWT_SECRET`: signing key for three-day JWT sessions.
- `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN`, and `EMAIL_USER`: Gmail OAuth settings used by the email service.
- `SYSTEM_USER_NAME`, `SYSTEM_USER_EMAIL`, and `SYSTEM_USER_PASSWORD`: credentials used when provisioning the restricted system operator.

Email configuration is optional for core account and transfer flows. For local test runs, `NODE_ENV=test` suppresses outgoing email and the startup mail check.

## Provision the system operator

Regular users can register through the web client. To enable initial-funds operations, set the three `SYSTEM_USER_*` values in `Backend/.env`, then run this from `Backend/`:

```powershell
npm run setup:system-user
```

The command creates the configured system user and its account if they do not exist. It does not reset an existing system user's password. Sign in using those credentials to open the restricted `/system` console. The recipient must be specified by an existing active account ID because the API has no recipient directory.

## Useful commands

| Folder | Command | Purpose |
| --- | --- | --- |
| `Backend/` | `npm run dev` | Start the API with nodemon. |
| `Backend/` | `npm start` | Start the API without nodemon. |
| `Backend/` | `npm test` | Run HTTP tests; MongoDB integration tests need `TEST_MONGO_URI`. |
| `Backend/` | `npm run setup:system-user` | Provision the system operator and its account. |
| `Backend/` | `npm run seed:monthly-demo` | Add guarded synthetic October/November 2026 dashboard history. |
| `Frontend/` | `npm run dev` | Start the Vite development server. |
| `Frontend/` | `npm run build` | Build the production frontend bundle. |
| `Frontend/` | `npm run preview` | Preview the built frontend locally. |

The demo seed is intended for a dedicated test, e2e, or demo database. There it requires two existing active INR accounts belonging to separate non-system `.test` users, with enough available balance. The explicit `ALLOW_MAIN_DATABASE_DEMO_SEED=yes` opt-in for `BackendLedger` may create two reserved synthetic users and accounts; if both accounts are empty and have no history, it records an INR 500 opening credit from an existing active system account. Read the [backend README](Backend/README.md) before running it.

## API overview

All API routes are prefixed with `/api`. Authenticated requests accept the HTTP-only `token` cookie or an `Authorization: Bearer <token>` header.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register a user. |
| `POST` | `/api/auth/login` | Log in and issue a session. |
| `GET` | `/api/auth/me` | Get the current session user. |
| `GET`, `POST` | `/api/accounts` | List the signed-in user's accounts or create one. |
| `PATCH` | `/api/accounts/:accountId` | Rename an account owned by the signed-in user. |
| `GET` | `/api/transactions` | List up to the latest 100 transactions involving the user's accounts. |
| `POST` | `/api/transactions` | Create an account-to-account transfer. |
| `POST` | `/api/transactions/system/initial-funds` | Credit an account using the system user's account; system-user authentication required. |

See the [API reference](Backend/docs/API.md) for payloads, response codes, authentication examples, and transaction behavior.

## Current scope and limits

- Reports, date and account filters, and CSV files are computed in the browser from the API's latest 100 transactions. They are not server-side report or export endpoints.
- Transfers require the recipient's exact account ID. There is no recipient lookup endpoint.
- Transfers are account-to-account only. There are no standalone income/expense records, pagination, individual transaction lookup, profile or password update, logout, category management, or in-app notification endpoints.
- The frontend transaction detail view can show a record only while it is available in the latest-100 feed (or in the current navigation state).

## Documentation

- [Backend setup, scripts, and tests](Backend/README.md)
- [Frontend setup and capabilities](Frontend/README.md)
- [API request and response reference](Backend/docs/API.md)
- [Website test database guide](Backend/docs/TEST_DATABASE_GUIDE.md)

The backend package declares the ISC license.
