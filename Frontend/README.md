# Ledgerly frontend

React 19 and Vite frontend for the existing Express/MongoDB ledger backend.

## Run locally

1. Configure and start the backend from `Backend/` using its `.env.example`
   and README. The Vite proxy defaults to `http://localhost:3000`, matching
   the example backend port.
2. Optionally create `Frontend/.env` to override the API URL.
3. Install dependencies with `npm install`, then start the UI with
   `npm run dev`. Vite serves the app at `http://localhost:5173`.
4. For a production bundle, run `npm run build`; preview it with
   `npm run preview`.

## Environment

- `VITE_API_BASE_URL` — API path used by the browser; defaults to `/api`.
- `VITE_BACKEND_URL` — backend origin used by the Vite development proxy;
  defaults to `http://localhost:3000`.

Keep the browser API path on `/api` when using the Vite proxy. The backend does
not configure CORS for direct cross-origin browser requests. Never put backend
secrets in `VITE_*` variables; Vite exposes those values to the browser.

Authentication uses the backend's `token` cookie and `GET /api/auth/me` for
session validation. The frontend does not persist the JWT in browser storage.

## Supported features and limits

- Email/password login and registration use the existing authentication routes.
- Provisioned system users are routed to a separate operations console for
  initial-funds requests and system-account activity. It uses the restricted
  `/api/transactions/system/initial-funds` endpoint; recipients must provide an
  exact account ID because the backend has no recipient directory.
- Account listing, named account creation, account renaming, account balances, transfer creation, and
  the latest transaction records use the existing account and transaction
  routes.
- Transaction history, date filtering, account filtering, and CSV exports are
  based on the latest 100 records returned by `GET /api/transactions`.
- CSV exports and reports are generated in the browser from those actual
  records; they are not backend report endpoints.
- The backend has no category-management, in-app notification, profile-update,
  password-update, generic income/expense, logout, or individual-record routes.
  The corresponding UI either presents read-only data or explains the missing
  capability instead of simulating a successful operation.
- The transaction endpoint accepts a recipient account ID, but no recipient
  directory is available. The transfer form therefore requires the exact ID
  of an existing active account.
