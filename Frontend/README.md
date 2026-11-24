# Ledgerly frontend

React 19 and Vite frontend for the Express and MongoDB ledger backend. See the [project README](../README.md) for full-stack setup and backend configuration.

## Run locally

Start the backend first by following [`Backend/README.md`](../Backend/README.md). Then, from the project folder, install and start the frontend:

```powershell
Set-Location Frontend
npm install
npm run dev
```

Vite serves the app at <http://localhost:5173>. For a production frontend bundle, run `npm run build`; preview it locally with `npm run preview`.

## Environment

- `VITE_API_BASE_URL` is the browser API path and defaults to `/api`.
- `VITE_BACKEND_URL` is the origin used by the Vite development proxy and defaults to `http://localhost:3000`.

Keep `VITE_API_BASE_URL` on `/api` when using the proxy. If the backend listens on another port, set `VITE_BACKEND_URL`, for example `http://localhost:3123`. The backend does not configure CORS for direct cross-origin browser requests. Never put backend secrets in `VITE_*` variables; Vite exposes these values to the browser.

Authentication uses the backend's HTTP-only `token` cookie and `GET /api/auth/me` for session validation. The frontend sends cookie credentials and does not persist the JWT in browser storage.

## Screens

Regular users have a dashboard, accounts list and details, transaction history and details, a transfer form, and reports. The transaction form records account-to-account transfers with a category and optional note. Provisioned system users are routed to a separate `/system` operations console for issuing initial funds and reviewing system-account activity.

## Supported features and limits

- Login and registration use the existing authentication routes.
- Account listing, named account creation, account renaming, account balances, and transfer creation use the existing account and transaction routes.
- A transfer requires the exact ID of an existing active recipient account. There is no recipient directory endpoint.
- Transaction history, date filtering, account filtering, reports, and CSV exports use at most the latest 100 records returned by `GET /api/transactions`.
- Reports and CSV files are generated in the browser from those records; they are not backend report or export endpoints.
- The backend does not provide category management, in-app notifications, profile or password updates, logout, generic income/expense entries, pagination, or individual transaction lookup. Related UI is read-only or explains when an operation is unavailable.
