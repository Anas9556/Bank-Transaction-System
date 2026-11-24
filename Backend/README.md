# Bank Transaction System

A simple backend banking application built with Node.js, Express, and MongoDB. The project supports user authentication, account creation, and transaction processing for a basic ledger-style banking workflow.

## Features

- User registration and login
- JWT-based authentication
- Cookie-based token storage
- Account creation tied to users
- Transaction endpoint integration
- MongoDB database connection
- Email service support for registration notifications

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- Nodemailer for email sending
- dotenv for environment configuration

## Project Structure

```bash
.
├── src/
│   ├── app.js
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── account.controller.js
│   │   ├── auth.controller.js
│   │   └── transaction.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── models/
│   │   ├── account.model.js
│   │   ├── ledger.model.js
│   │   ├── transaction.model.js
│   │   └── user.model.js
│   ├── routes/
│   │   ├── account.routes.js
│   │   ├── auth.routes.js
│   │   └── transaction.routes.js
│   └── services/
│       └── email.service.js
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## Prerequisites

Before running the project, make sure you have:

- Node.js installed
- MongoDB running or access to a MongoDB Atlas cluster
- A Gmail or SMTP email account for email notifications

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Anas9556/Bank-Transaction-System.git
cd Bank-Transaction-System
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root using `.env.example` as a template:

```bash
cp .env.example .env
```

4. Update the environment variables inside `.env` with your credentials:

```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>
DATABASE_NAME=your_database_name
JWT_SECRET=your_jwt_secret_here
CLIENT_ID=your_google_oauth_client_id
CLIENT_SECRET=your_google_oauth_client_secret
REFRESH_TOKEN=your_google_oauth_refresh_token
EMAIL_USER=your_email@example.com
SYSTEM_USER_NAME=System User
SYSTEM_USER_EMAIL=system@example.com
SYSTEM_USER_PASSWORD=replace_with_a_secure_password
```

Set the system-user values to private credentials before provisioning. Do not
use the system-user email or password for a regular account.

5. Create the system user and its account:

```bash
npm run setup:system-user
```

This command is safe to rerun: it creates the system user and account only if
they do not already exist. It does not reset an existing user's password.

## Seed monthly dashboard demo history

`npm run seed:monthly-demo` adds 84 synthetic completed transfers (42 each in
October and November 2026). On a test/e2e/demo database it uses two existing
active accounts owned by non-system users with `.test` email domains; it does
not create users or accounts there. It refuses other database names by default.
Transfers are stored with their matching debit and credit ledger entries in
MongoDB transactions. Each transfer pair reverses the same amount the next
morning, so monthly activity does not change either demo account's final
balance.

The seed is repeatable: it uses a fixed idempotency-key namespace and verifies
existing entries and their ledger rows instead of inserting duplicates. It
checks transaction dates, ledger references, duplicate keys, and final account
balances before reporting success. The two account owners' latest-100 API feeds
must have enough room to show all seeded rows.

Use the documented synthetic website database (or another dedicated test/demo
database) in `Backend/.env`, then run from `Backend/`:

```powershell
$env:DATABASE_NAME = "bank_transaction_system_e2e_20261105"
npm run seed:monthly-demo
```

If you explicitly opt in to `BackendLedger`, the script creates two clearly
named synthetic `.test` users and accounts if they do not already exist. It
prints newly generated passwords once; save them for signing in to the demo
users. If both demo accounts are empty, it records a ₹500 opening credit to the
sender through the system account using the same completed-transaction and
ledger-entry pattern as the initial-funds flow. The account pair then finishes
with the same balances they had before the October/November transfers.

Use this explicit main-database opt-in only when you intend to create these
synthetic demo records in `BackendLedger`:

```powershell
$env:ALLOW_MAIN_DATABASE_DEMO_SEED = "yes"
npm run seed:monthly-demo
Remove-Item Env:ALLOW_MAIN_DATABASE_DEMO_SEED
```

The main-database opt-in does not select or write to other users' accounts.

The selected accounts must use INR, be active, and have enough existing balance
for the first transfer in each pair. The script will not adjust balances to
make the seed run. October and November entries are spread over the first 22
days of each month so they fit the report's same-day-of-month comparison and
remain within the API's latest-100 record limit.

## Running the App

Start the development server:

```bash
npm run dev
```

Or run the server directly:

```bash
npm start
```

The API will run on the port defined in `.env` or default to `3123`.

## Tests

For the retained live website test database and synthetic account walkthrough,
see [the website test database guide](./docs/TEST_DATABASE_GUIDE.md).

Run the backend HTTP tests with:

```bash
npm test
```

The HTTP test runs without a database and verifies authentication guards and
API error responses. Database tests are skipped unless `TEST_MONGO_URI` is
set. They use a fresh database named
`bank_transaction_test_<process-id>_<random-suffix>` and drop only that
database after each test. The supplied URI must have permission to create and
drop databases. Use a disposable test MongoDB deployment; the suite never
falls back to `MONGO_URI`. Email delivery is stubbed in integration tests.

Registration, login, password hashing, and account isolation tests work with a
standalone MongoDB server. The funding, transfer, idempotency, and ledger
balance tests require a replica set or sharded cluster because MongoDB
transactions are used; they are skipped automatically on standalone servers.

In PowerShell, set the test connection only for the test process:

```powershell
$env:TEST_MONGO_URI = "mongodb://localhost:27017/?replicaSet=rs0"
npm test
Remove-Item Env:TEST_MONGO_URI
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in an existing user

### Accounts

- `POST /api/accounts` - Create an account for the authenticated user

### Transactions

- `POST /api/transactions` - Create a new transaction for an authenticated user
- `POST /api/transactions/system/initial-funds` - Create an initial-funds
  transaction using the provisioned system user's account

Both transaction endpoints require a JSON `amount` greater than zero and a
unique `idempotencyKey`. Regular transactions also require `fromAccount`; the
sender account must belong to the authenticated user. Initial-funds requests
require a system-user token and `toAccount`.

For request and response examples, authentication instructions, and
PowerShell commands, see the [API guide](./docs/API.md).

## Example Environment Setup

This project expects the following variables to be available:

- `PORT`
- `MONGO_URI`
- `DATABASE_NAME`
- `JWT_SECRET`
- `CLIENT_ID`
- `CLIENT_SECRET`
- `REFRESH_TOKEN`
- `EMAIL_USER`
- `SYSTEM_USER_NAME`
- `SYSTEM_USER_EMAIL`
- `SYSTEM_USER_PASSWORD`

## Notes

- Keep your real `.env` file local and do not commit it to Git.
- This project is a backend-focused application and is intended for learning and extension.
- Transfers are recorded as a debit and credit in a MongoDB transaction. The
  MongoDB deployment must support transactions (for example, a replica set or
  MongoDB Atlas).

## License

This project is licensed under the ISC License.
