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
CLIENT_ID=your_google_client_id
CLIENT_SECRET=your_google_client_secret
REFRESH_TOKEN=your_google_refresh_token
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
