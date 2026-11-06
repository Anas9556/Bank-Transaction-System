# Bank Transaction System API

## Base URL

The API base URL is `http://localhost:3000` when `.env` sets `PORT=3000`.
The server defaults to port `3123` if `PORT` is not set. Replace the port in
the examples if your server uses a different one.

All request bodies below are JSON. Send the header
`Content-Type: application/json` for requests with a body.

## Authentication

Registration and login return a JWT in the JSON response and set it as a
`token` cookie. For requests from Postman, curl, or another client, send the
token as a bearer token:

```http
Authorization: Bearer YOUR_TOKEN
```

The token is required for account creation and both transaction endpoints.
The initial-funds endpoint requires the system user's token.

## Endpoints

### Register a user

`POST /api/auth/register`

No authentication required.

Request:

```json
{
  "name": "Asha Patel",
  "email": "asha@example.com",
  "password": "replace-with-a-strong-password"
}
```

On success, returns `201 Created` with `user` and `token` fields and sets the
authentication cookie. The user object includes `systemUser` (`false` for
regular registrations). The response also includes the legacy `emailL`
property; use the returned `token` for bearer authentication.

Duplicate email returns `422 Unprocessable Entity`.

### Log in

`POST /api/auth/login`

No authentication required.

Request:

```json
{
  "email": "asha@example.com",
  "password": "replace-with-a-strong-password"
}
```

On success, returns `200 OK` with `user` and `token` fields and sets the
HTTP-only authentication cookie. The user object includes a `systemUser`
boolean so clients can route the provisioned system operator to its restricted
funding console. Invalid credentials return `401 Unauthorized`.

### Get the current user

`GET /api/auth/me`

Requires the authenticated user's token. Returns the current user's `_id`,
`email`, `name`, and `systemUser` flag in a `user` object.

### List accounts

`GET /api/accounts`

Requires the authenticated user's token. Returns only that user's accounts,
ordered by creation time, with `_id`, saved `name`, `status`, `currency`,
ledger-derived `balance`, `createdAt`, and `updatedAt`.

### Create an account

`POST /api/accounts`

Requires a regular user's token. The server associates the new account with
the authenticated user; do not send a user ID in the request body.

Request:

```json
{
  "name": "Everyday spending"
}
```

`name` is optional for API compatibility; it must be 1–40 characters when
provided. If omitted, the server assigns a generated ledger-account name.

On success, returns `201 Created` with an `account` object. Save its `_id` as
the `fromAccount` for a transfer and as a recipient's `toAccount` when sending
funds to that account.

### Rename an account

`PATCH /api/accounts/:accountId`

Requires the authenticated account owner. Request:

```json
{
  "name": "Travel savings"
}
```

Names must contain 1–40 non-whitespace characters. The endpoint returns
`404 Not Found` when the account does not belong to the authenticated user.

### List transactions

`GET /api/transactions`

Requires the authenticated user's token. Returns up to the latest 100
transactions involving one or more of the user's accounts, ordered newest
first. Each record includes its transaction and account IDs, amount, status,
idempotency key, direction (`credit`, `debit`, or `internal`), account name,
description, category label, and timestamps. There is no pagination or
individual-transaction endpoint.

### Create a transfer

`POST /api/transactions`

Requires a regular user's token. The sender account must belong to the
authenticated user, and both accounts must be active.

Request:

```json
{
  "fromAccount": "SENDER_ACCOUNT_ID",
  "toAccount": "RECIPIENT_ACCOUNT_ID",
  "amount": 250,
  "idempotencyKey": "unique-client-generated-key"
}
```

`amount` must be a JSON number greater than zero. The idempotency key must be
a non-empty string and must be unique for a new transaction. Retrying the
same request with the same key and same account IDs/amount returns the
existing transaction instead of transferring again. Do not reuse a key for a
different request.

Successful new transfers return `201 Created`; a matching retry returns
`200 OK`. Other possible responses include `400 Bad Request` for invalid
fields, inactive accounts, or insufficient balance; `404 Not Found` if an
account is unavailable to the caller; and `409 Conflict` if a key was reused
for a different request or the existing transaction is not complete.

### Add initial funds

`POST /api/transactions/system/initial-funds`

Requires the provisioned system user's token. This credits the recipient by
creating a transfer from the system user's account. Do not use a normal user's
token for this endpoint.

Request:

```json
{
  "toAccount": "RECIPIENT_ACCOUNT_ID",
  "amount": 1000,
  "idempotencyKey": "unique-client-generated-key"
}
```

`amount` must be a JSON number greater than zero. The system user and its
account must already be provisioned. New transactions return `201 Created`;
a matching retry returns `200 OK`. Other possible responses include `400`
for invalid fields or inactive accounts, `401` for missing/invalid
authentication, `403` if the token belongs to a non-system user, `404` if the
recipient or system account is missing, and `409` for a conflicting reused
idempotency key. After a new initial-funds transaction completes, the backend
sends a credit notification email to the recipient account owner when that
user record has an email address. Email delivery failures do not reverse the
ledger transaction.

Provision the system user once by setting `SYSTEM_USER_NAME`,
`SYSTEM_USER_EMAIL`, and `SYSTEM_USER_PASSWORD` in `.env` and running:

```powershell
npm run setup:system-user
```

Log in with the configured system-user credentials at `/api/auth/login` and
use the returned token as a bearer token for this endpoint.

## Example requests (Windows PowerShell)

Use `curl.exe` explicitly in PowerShell. First register or log in and copy the
`token` value from the JSON response:

```powershell
$baseUrl = "http://localhost:3000"
$token = "PASTE_TOKEN_HERE"
```

Create an account:

```powershell
curl.exe -X POST "$baseUrl/api/accounts" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d "{}"
```

Transfer funds (replace both IDs and use a new idempotency key):

```powershell
curl.exe -X POST "$baseUrl/api/transactions" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"fromAccount":"SENDER_ACCOUNT_ID","toAccount":"RECIPIENT_ACCOUNT_ID","amount":250,"idempotencyKey":"transfer-20261007-001"}'
```

Add initial funds (use the system-user token and a recipient account ID):

```powershell
curl.exe -X POST "$baseUrl/api/transactions/system/initial-funds" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"toAccount":"RECIPIENT_ACCOUNT_ID","amount":1000,"idempotencyKey":"initial-funds-20261007-001"}'
```

## Not currently provided

The API does not currently expose endpoints for profile changes, logout,
recipient discovery, category management, notifications, generic income or
expense entries, reports, transaction export, pagination, or individual
transaction details. Account balances are derived from ledger entries and are
included in the account-list response.
