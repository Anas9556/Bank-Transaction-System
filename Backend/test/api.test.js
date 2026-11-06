import 'dotenv/config';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { after, test } from 'node:test';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'bank-transaction-system-test-secret';

let app;
let emailService;

async function loadApp() {
  if (!app) {
    [{ default: app }, { default: emailService }] = await Promise.all([
      import('../src/app.js'),
      import('../src/services/email.service.js'),
    ]);

    emailService.sendRegistrationEmail = async () => {};
    emailService.sendTransactionEmail = async () => {};
    emailService.sendTransactionFailureEmail = async () => {};
  }

  return app;
}

async function startServer() {
  const application = await loadApp();
  const server = application.listen(0, '127.0.0.1');
  await once(server, 'listening');

  return {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    }),
  };
}

async function request(baseUrl, method, path, { token, body, rawBody } = {}) {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined || rawBody !== undefined) {
    headers['content-type'] = 'application/json';
  }

  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
}

test('API rejects unauthenticated and malformed requests', async () => {
  const server = await startServer();

  try {
    const protectedRequests = [
      ['GET', '/api/auth/me'],
      ['GET', '/api/accounts'],
      ['GET', '/api/transactions'],
      ['POST', '/api/transactions/system/initial-funds', {}],
    ];

    for (const [method, path, body] of protectedRequests) {
      const response = await request(server.baseUrl, method, path, { body });
      assert.equal(response.status, 401, `${method} ${path}`);
    }

    const invalidToken = jwt.sign(
      { userID: new mongoose.Types.ObjectId() },
      'not-the-test-secret'
    );
    const invalidTokenResponse = await request(
      server.baseUrl,
      'GET',
      '/api/auth/me',
      { token: invalidToken }
    );
    assert.equal(invalidTokenResponse.status, 401);

    const invalidJsonResponse = await request(
      server.baseUrl,
      'POST',
      '/api/auth/login',
      { rawBody: '{' }
    );
    assert.equal(invalidJsonResponse.status, 400);

    const notFoundResponse = await request(
      server.baseUrl,
      'GET',
      '/api/not-a-route'
    );
    assert.equal(notFoundResponse.status, 404);
  } finally {
    await server.close();
  }
});

const databaseTestEnabled = Boolean(process.env.TEST_MONGO_URI);
const testDatabaseNames = new Set();

after(async () => {
  if (!databaseTestEnabled || testDatabaseNames.size === 0) return;

  const cleanupConnection = await mongoose.createConnection(
    process.env.TEST_MONGO_URI,
    { serverSelectionTimeoutMS: 5000 }
  ).asPromise();

  try {
    for (const databaseName of testDatabaseNames) {
      if (!databaseName.startsWith('bank_transaction_test_')) {
        throw new Error(`Refusing to drop unexpected test database: ${databaseName}`);
      }
      await cleanupConnection.useDb(databaseName).dropDatabase();
    }

    const result = await cleanupConnection.db.admin().listDatabases({ nameOnly: true });
    const remainingDatabases = result.databases
      .map(({ name }) => name)
      .filter((name) => testDatabaseNames.has(name));
    assert.deepEqual(remainingDatabases, [], 'Temporary test databases must be removed');
  } finally {
    await cleanupConnection.close();
  }
});

test('MongoDB registration, authentication, and account flows', {
  skip: databaseTestEnabled ? false : 'Set TEST_MONGO_URI to run database integration tests',
}, async () => {
  const databaseName = `bank_transaction_test_${process.pid}_${randomUUID().slice(0, 8)}`;
  testDatabaseNames.add(databaseName);
  let server;

  try {
    await mongoose.connect(process.env.TEST_MONGO_URI, {
      dbName: databaseName,
      serverSelectionTimeoutMS: 5000,
    });

    const { default: userModel } = await import('../src/models/user.model.js');
    server = await startServer();
    await Promise.all(
      Object.values(mongoose.connection.models).map((model) => model.init())
    );

    const suffix = randomUUID();
    const email = `account-test-${suffix}@example.test`;
    const password = 'Test-Password-1';
    const registration = await request(server.baseUrl, 'POST', '/api/auth/register', {
      body: { email, name: 'Database Test User', password },
    });
    assert.equal(registration.status, 201);
    const registrationResult = await registration.json();
    assert.ok(registrationResult.token);
    assert.match(registration.headers.get('set-cookie') || '', /token=/i);

    const storedUser = await userModel.findById(registrationResult.user._id).select('+password');
    assert.ok(storedUser);
    assert.notEqual(storedUser.password, password);
    assert.equal(await storedUser.comparePassword(password), true);

    const duplicateRegistration = await request(server.baseUrl, 'POST', '/api/auth/register', {
      body: { email, name: 'Duplicate User', password },
    });
    assert.equal(duplicateRegistration.status, 422);

    const login = await request(server.baseUrl, 'POST', '/api/auth/login', {
      body: { email, password },
    });
    assert.equal(login.status, 200);
    const loginResult = await login.json();
    assert.ok(loginResult.token);

    const invalidLogin = await request(server.baseUrl, 'POST', '/api/auth/login', {
      body: { email, password: 'wrong-password' },
    });
    assert.equal(invalidLogin.status, 401);

    const createAccount = () => request(server.baseUrl, 'POST', '/api/accounts', {
      token: loginResult.token,
      body: {},
    });
    const firstAccountResponse = await createAccount();
    const secondAccountResponse = await createAccount();
    assert.equal(firstAccountResponse.status, 201);
    assert.equal(secondAccountResponse.status, 201);
    const firstAccount = (await firstAccountResponse.json()).account;
    const secondAccount = (await secondAccountResponse.json()).account;
    assert.notEqual(firstAccount._id, secondAccount._id);

    const accountsResponse = await request(server.baseUrl, 'GET', '/api/accounts', {
      token: loginResult.token,
    });
    assert.equal(accountsResponse.status, 200);
    const accounts = (await accountsResponse.json()).accounts;
    assert.equal(accounts.length, 2);
    assert.deepEqual(accounts.map((account) => account.balance), [0, 0]);

    const otherUser = await request(server.baseUrl, 'POST', '/api/auth/register', {
      body: {
        email: `other-${suffix}@example.test`,
        name: 'Other Database User',
        password,
      },
    });
    assert.equal(otherUser.status, 201);
    const otherUserResult = await otherUser.json();
    const isolatedAccountsResponse = await request(
      server.baseUrl,
      'GET',
      '/api/accounts',
      { token: otherUserResult.token }
    );
    assert.equal(isolatedAccountsResponse.status, 200);
    assert.deepEqual((await isolatedAccountsResponse.json()).accounts, []);
  } finally {
    try {
      if (server) await server.close();
    } finally {
      try {
        if (mongoose.connection.readyState === 1) {
          await mongoose.connection.dropDatabase();
        }
      } finally {
        if (mongoose.connection.readyState !== 0) {
          await mongoose.disconnect();
        }
      }
    }
  }
});

test('MongoDB authentication, account, and ledger flows', {
  skip: databaseTestEnabled ? false : 'Set TEST_MONGO_URI to run database integration tests',
}, async (context) => {
  const topologyConnection = await mongoose.createConnection(
    process.env.TEST_MONGO_URI,
    { serverSelectionTimeoutMS: 5000 }
  ).asPromise();
  let supportsTransactions;

  try {
    const topology = await topologyConnection.db.admin().command({ hello: 1 });
    supportsTransactions = Boolean(topology.setName || topology.msg === 'isdbgrid');
  } finally {
    await topologyConnection.close();
  }

  if (!supportsTransactions) {
    context.skip('MongoDB transactions require a replica set or sharded cluster');
    return;
  }

  const databaseName = `bank_transaction_test_${process.pid}_${randomUUID().slice(0, 8)}`;
  testDatabaseNames.add(databaseName);
  let server;
  try {
    await mongoose.connect(process.env.TEST_MONGO_URI, {
      dbName: databaseName,
      serverSelectionTimeoutMS: 5000,
    });

    const [
      { default: userModel },
      { default: accountModel },
      { default: ledgerModel },
    ] = await Promise.all([
      import('../src/models/user.model.js'),
      import('../src/models/account.model.js'),
      import('../src/models/ledger.model.js'),
    ]);
    server = await startServer();
    await Promise.all(
      Object.values(mongoose.connection.models).map((model) => model.init())
    );

    const suffix = randomUUID();
    const password = 'Test-Password-1';
    const registerUser = async (email, name) => request(
      server.baseUrl,
      'POST',
      '/api/auth/register',
      { body: { email, name, password } }
    );

    const registration = await registerUser(
      `sender-${suffix}@example.test`,
      'Test Sender'
    );
    assert.equal(registration.status, 201);
    const registered = await registration.json();
    assert.ok(registered.user?._id);
    assert.ok(registered.token);
    assert.match(registration.headers.get('set-cookie') || '', /token=/i);

    const duplicateRegistration = await registerUser(
      `sender-${suffix}@example.test`,
      'Test Sender'
    );
    assert.equal(duplicateRegistration.status, 422);

    const login = await request(server.baseUrl, 'POST', '/api/auth/login', {
      body: { email: `sender-${suffix}@example.test`, password },
    });
    assert.equal(login.status, 200);
    const loginResult = await login.json();
    assert.ok(loginResult.token);

    const badLogin = await request(server.baseUrl, 'POST', '/api/auth/login', {
      body: { email: `sender-${suffix}@example.test`, password: 'wrong-password' },
    });
    assert.equal(badLogin.status, 401);

    const currentUser = await request(server.baseUrl, 'GET', '/api/auth/me', {
      token: loginResult.token,
    });
    assert.equal(currentUser.status, 200);
    assert.equal((await currentUser.json()).user._id, registered.user._id);

    const recipientRegistration = await registerUser(
      `recipient-${suffix}@example.test`,
      'Test Recipient'
    );
    assert.equal(recipientRegistration.status, 201);
    const recipient = await recipientRegistration.json();

    const createAccount = (token) => request(server.baseUrl, 'POST', '/api/accounts', {
      token,
      body: {},
    });
    const senderAccountResponse = await createAccount(loginResult.token);
    const recipientAccountResponse = await createAccount(recipient.token);
    assert.equal(senderAccountResponse.status, 201);
    assert.equal(recipientAccountResponse.status, 201);
    const senderAccount = (await senderAccountResponse.json()).account;
    const recipientAccount = (await recipientAccountResponse.json()).account;

    const systemUser = await userModel.create({
      email: `system-${suffix}@example.test`,
      name: 'Test System User',
      password,
      systemUser: true,
    });
    const systemAccount = await accountModel.create({ user: systemUser._id });
    const systemToken = jwt.sign(
      { userID: systemUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '3d' }
    );

    const regularInitialFundsAttempt = await request(
      server.baseUrl,
      'POST',
      '/api/transactions/system/initial-funds',
      {
        token: loginResult.token,
        body: {
          toAccount: senderAccount._id,
          amount: 1000,
          idempotencyKey: `forbidden-${suffix}`,
        },
      }
    );
    assert.equal(regularInitialFundsAttempt.status, 403);

    const fundingBody = {
      toAccount: senderAccount._id,
      amount: 1000,
      idempotencyKey: `funding-${suffix}`,
    };
    const funding = await request(
      server.baseUrl,
      'POST',
      '/api/transactions/system/initial-funds',
      { token: systemToken, body: fundingBody }
    );
    const fundingResponseBody = await funding.text();
    assert.equal(funding.status, 201, fundingResponseBody);
    const fundingResult = JSON.parse(fundingResponseBody);
    assert.equal(fundingResult.transaction.status, 'COMPLETED');

    const fundingRetry = await request(
      server.baseUrl,
      'POST',
      '/api/transactions/system/initial-funds',
      { token: systemToken, body: fundingBody }
    );
    assert.equal(fundingRetry.status, 200);

    const invalidTransfer = await request(
      server.baseUrl,
      'POST',
      '/api/transactions',
      {
        token: loginResult.token,
        body: {
          fromAccount: senderAccount._id,
          toAccount: recipientAccount._id,
          amount: '250',
          idempotencyKey: `invalid-${suffix}`,
        },
      }
    );
    assert.equal(invalidTransfer.status, 400);

    const transactionBody = {
      fromAccount: senderAccount._id,
      toAccount: recipientAccount._id,
      amount: 250,
      idempotencyKey: `transfer-${suffix}`,
      category: 'Food',
      note: 'test transfer',
    };
    const transfer = await request(server.baseUrl, 'POST', '/api/transactions', {
      token: loginResult.token,
      body: transactionBody,
    });
    assert.equal(transfer.status, 201);
    const transferResult = await transfer.json();
    assert.equal(transferResult.transaction.status, 'COMPLETED');
    assert.equal(transferResult.transaction.category, 'Food');
    assert.equal(transferResult.transaction.note, 'test transfer');

    const transferRetry = await request(server.baseUrl, 'POST', '/api/transactions', {
      token: loginResult.token,
      body: transactionBody,
    });
    assert.equal(transferRetry.status, 200);
    assert.equal(
      (await transferRetry.json()).transaction._id,
      transferResult.transaction._id
    );

    const conflictingRetry = await request(
      server.baseUrl,
      'POST',
      '/api/transactions',
      {
        token: loginResult.token,
        body: { ...transactionBody, amount: 251 },
      }
    );
    assert.equal(conflictingRetry.status, 409);

    const insufficientTransfer = await request(
      server.baseUrl,
      'POST',
      '/api/transactions',
      {
        token: loginResult.token,
        body: {
          ...transactionBody,
          amount: 751,
          idempotencyKey: `insufficient-${suffix}`,
        },
      }
    );
    assert.equal(insufficientTransfer.status, 400);

    const senderAccountsResponse = await request(
      server.baseUrl,
      'GET',
      '/api/accounts',
      { token: loginResult.token }
    );
    assert.equal(senderAccountsResponse.status, 200);
    const senderAccounts = (await senderAccountsResponse.json()).accounts;
    assert.equal(senderAccounts.length, 1);
    assert.equal(senderAccounts[0].balance, 750);

    const recipientAccountsResponse = await request(
      server.baseUrl,
      'GET',
      '/api/accounts',
      { token: recipient.token }
    );
    assert.equal(recipientAccountsResponse.status, 200);
    const recipientAccounts = (await recipientAccountsResponse.json()).accounts;
    assert.equal(recipientAccounts.length, 1);
    assert.equal(recipientAccounts[0].balance, 250);

    const senderTransactionsResponse = await request(
      server.baseUrl,
      'GET',
      '/api/transactions',
      { token: loginResult.token }
    );
    assert.equal(senderTransactionsResponse.status, 200);
    const senderTransactions = (await senderTransactionsResponse.json()).transactions;
    assert.equal(senderTransactions.length, 2);
    assert.deepEqual(
      new Set(senderTransactions.map((transaction) => transaction.direction)),
      new Set(['credit', 'debit'])
    );
    const senderSummary = senderTransactions.reduce(
      (summary, transaction) => {
        summary[transaction.direction] += transaction.amount;
        return summary;
      },
      { credit: 0, debit: 0 }
    );
    assert.deepEqual(senderSummary, { credit: 1000, debit: 250 });

    const senderLedgerEntries = await ledgerModel.find({
      account: senderAccount._id,
    }).lean();
    assert.equal(
      senderLedgerEntries
        .filter((entry) => entry.type === 'CREDIT')
        .reduce((total, entry) => total + entry.amount, 0),
      1000
    );
    assert.equal(
      senderLedgerEntries
        .filter((entry) => entry.type === 'DEBIT')
        .reduce((total, entry) => total + entry.amount, 0),
      250
    );

    const recipientTransactionsResponse = await request(
      server.baseUrl,
      'GET',
      '/api/transactions',
      { token: recipient.token }
    );
    assert.equal(recipientTransactionsResponse.status, 200);
    const recipientTransactions = (await recipientTransactionsResponse.json()).transactions;
    assert.equal(recipientTransactions.length, 1);
    assert.equal(recipientTransactions[0].direction, 'credit');
  } finally {
    try {
      if (server) await server.close();
    } finally {
      try {
        if (mongoose.connection.readyState === 1) {
          await mongoose.connection.dropDatabase();
        }
      } finally {
        if (mongoose.connection.readyState !== 0) {
          await mongoose.disconnect();
        }
      }
    }
  }
});
