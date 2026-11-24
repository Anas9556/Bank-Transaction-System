import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import accountModel from '../src/models/account.model.js';
import ledgerModel from '../src/models/ledger.model.js';
import transactionModel from '../src/models/transaction.model.js';
import userModel from '../src/models/user.model.js';

// Seeds synthetic dashboard history for existing .test users on demo databases.
// Main-database account creation is available only with an explicit opt-in.
const SEED_KEY_PREFIX = 'monthly-dashboard-demo:2026-v1:';
const OPENING_FUNDING_KEY = 'monthly-dashboard-demo-funding:2026-v1:opening';
const MAIN_DEMO_USERS = [
  {
    email: 'monthly-dashboard-sender@example.test',
    name: 'Monthly Demo Sender',
    accountName: 'Monthly Dashboard Demo Account'
  },
  {
    email: 'monthly-dashboard-recipient@example.test',
    name: 'Monthly Demo Recipient',
    accountName: 'Monthly Dashboard Demo Account'
  }
];
const OPENING_FUNDING_AMOUNT = 500;
const MONTHS = [
  {
    number: 10,
    label: 'October',
    amountMin: 70,
    amountMax: 155,
    firstDirectionCategories: {
      Food: 5, Transport: 3, Shopping: 4, Bills: 3, Health: 1,
      Entertainment: 2, Education: 1, Other: 1, Transfer: 1
    },
    reverseDirectionCategories: {
      Food: 3, Transport: 4, Shopping: 2, Bills: 3, Health: 1,
      Entertainment: 2, Education: 2, Other: 3, Transfer: 1
    }
  },
  {
    number: 11,
    label: 'November',
    amountMin: 105,
    amountMax: 210,
    firstDirectionCategories: {
      Food: 3, Transport: 3, Shopping: 2, Bills: 6, Health: 2,
      Entertainment: 2, Education: 1, Other: 1, Transfer: 1
    },
    reverseDirectionCategories: {
      Food: 2, Transport: 3, Shopping: 2, Bills: 5, Health: 3,
      Entertainment: 2, Education: 1, Other: 2, Transfer: 1
    }
  }
];
const PAIRS_PER_MONTH = 21;
const NOTE_BY_CATEGORY = {
  Food: 'Demo groceries',
  Transport: 'Demo metro and ride fare',
  Shopping: 'Demo household purchase',
  Bills: 'Demo utility payment',
  Health: 'Demo pharmacy purchase',
  Entertainment: 'Demo event booking',
  Education: 'Demo course materials',
  Transfer: 'Demo savings transfer',
  Other: 'Demo personal expense'
};

function makeRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function expandAndShuffle(counts, random) {
  const values = Object.entries(counts).flatMap(([category, count]) =>
    Array.from({ length: count }, () => category)
  );
  if (values.length !== PAIRS_PER_MONTH) {
    throw new Error(`Expected ${PAIRS_PER_MONTH} category entries, got ${values.length}`);
  }
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values;
}

function buildSeedPlan(firstAccount, secondAccount) {
  const plan = [];
  for (const month of MONTHS) {
    const random = makeRandom(20261000 + month.number);
    const firstCategories = expandAndShuffle(month.firstDirectionCategories, random);
    const reverseCategories = expandAndShuffle(month.reverseDirectionCategories, random);

    for (let pair = 0; pair < PAIRS_PER_MONTH; pair += 1) {
      const amount = month.amountMin + Math.floor(random() * (month.amountMax - month.amountMin + 1));
      const day = pair + 1;
      const monthKey = `2026${String(month.number).padStart(2, '0')}`;
      const pairKey = String(pair + 1).padStart(2, '0');
      const forwardDate = new Date(Date.UTC(2026, month.number - 1, day, 4, 0));
      const reverseDate = new Date(Date.UTC(2026, month.number - 1, day + 1, 0, 0));

      plan.push({
        fromAccount: firstAccount._id,
        toAccount: secondAccount._id,
        amount,
        category: firstCategories[pair],
        note: NOTE_BY_CATEGORY[firstCategories[pair]],
        createdAt: forwardDate,
        idempotencyKey: `${SEED_KEY_PREFIX}${monthKey}:${pairKey}:forward`
      });
      plan.push({
        fromAccount: secondAccount._id,
        toAccount: firstAccount._id,
        amount,
        category: reverseCategories[pair],
        note: NOTE_BY_CATEGORY[reverseCategories[pair]],
        createdAt: reverseDate,
        idempotencyKey: `${SEED_KEY_PREFIX}${monthKey}:${pairKey}:reverse`
      });
    }
  }
  return plan.sort((left, right) => left.createdAt - right.createdAt);
}

function assertMatchingSeedTransaction(transaction, expected) {
  const sameValue =
    transaction.fromAccount.toString() === expected.fromAccount.toString() &&
    transaction.toAccount.toString() === expected.toAccount.toString() &&
    transaction.amount === expected.amount &&
    transaction.category === expected.category &&
    transaction.note === expected.note &&
    transaction.status === 'COMPLETED' &&
    new Date(transaction.createdAt).getTime() === expected.createdAt.getTime();
  if (!sameValue) {
    throw new Error(`Seed key ${expected.idempotencyKey} already exists with different transaction data`);
  }
}

function verifyLedgerEntries(transaction, expected, entries) {
  if (entries.length !== 2) {
    throw new Error(`Transaction ${transaction.idempotencyKey} has ${entries.length} ledger entries; expected 2`);
  }

  const debit = entries.filter((entry) => entry.type === 'DEBIT');
  const credit = entries.filter((entry) => entry.type === 'CREDIT');
  if (
    debit.length !== 1 ||
    credit.length !== 1 ||
    debit[0].account.toString() !== expected.fromAccount.toString() ||
    credit[0].account.toString() !== expected.toAccount.toString() ||
    debit[0].amount !== expected.amount ||
    credit[0].amount !== expected.amount
  ) {
    throw new Error(`Transaction ${transaction.idempotencyKey} has ledger entries that do not match its transfer`);
  }
}

async function createCompletedTransfer(expected) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const transaction = new transactionModel({
        ...expected,
        status: 'PENDING',
        createdAt: expected.createdAt,
        updatedAt: expected.createdAt
      });
      await transaction.save({ session });

      await ledgerModel.create([
        {
          account: expected.fromAccount,
          amount: expected.amount,
          transaction: transaction._id,
          type: 'DEBIT'
        },
        {
          account: expected.toAccount,
          amount: expected.amount,
          transaction: transaction._id,
          type: 'CREDIT'
        }
      ], { session, ordered: true });

      transaction.status = 'COMPLETED';
      await transaction.save({ session });
      return transaction;
    });
  } finally {
    await session.endSession();
  }
}

async function verifyTransactionLedger(transaction, expected) {
  const entries = await ledgerModel.find({ transaction: transaction._id }).lean();
  verifyLedgerEntries(transaction, expected, entries);
}

async function selectDemoAccounts() {
  const demoUsers = await userModel
    .find({ email: /\.test$/i })
    .select('+systemUser')
    .sort({ email: 1 });
  const eligibleUsers = demoUsers.filter((user) => !user.systemUser);
  const accountByUser = new Map();
  const activeAccounts = await accountModel
    .find({ user: { $in: eligibleUsers.map((user) => user._id) }, status: 'ACTIVE' })
    .sort({ createdAt: 1, _id: 1 });

  for (const account of activeAccounts) {
    const userId = account.user.toString();
    if (!accountByUser.has(userId)) accountByUser.set(userId, account);
  }

  const accountOwners = eligibleUsers
    .map((user) => ({ user, account: accountByUser.get(user._id.toString()) }))
    .filter((row) => row.account);
  if (accountOwners.length < 2) {
    throw new Error('Need active accounts for at least two existing non-system .test users; no accounts or users will be created.');
  }

  const chosen = accountOwners.slice(0, 2).map((row) => row.account);
  if (chosen[0].currency !== 'INR' || chosen[1].currency !== 'INR') {
    throw new Error('The selected demo accounts must both use INR to match the dashboard currency formatting.');
  }

  return chosen;
}

async function ensureMainDemoAccounts() {
  const accountCreationDate = new Date(Date.UTC(2026, 8, 30, 0, 0));
  const accounts = [];

  for (const definition of MAIN_DEMO_USERS) {
    let user = await userModel.findOne({ email: definition.email }).select('+systemUser');
    if (user) {
      if (user.systemUser || user.name !== definition.name) {
        throw new Error(`Reserved demo email ${definition.email} is already used by a different account.`);
      }
    } else {
      const password = randomBytes(18).toString('base64url');
      user = await userModel.create({
        email: definition.email,
        name: definition.name,
        password,
        createdAt: accountCreationDate,
        updatedAt: accountCreationDate
      });
      console.log(`Created synthetic demo login: ${definition.email} / ${password}`);
    }

    let account = await accountModel.findOne({ user: user._id, name: definition.accountName });
    if (account && (account.status !== 'ACTIVE' || account.currency !== 'INR')) {
      throw new Error(`Reserved demo account for ${definition.email} must be active and use INR.`);
    }
    if (!account) {
      account = await accountModel.create({
        user: user._id,
        name: definition.accountName,
        status: 'ACTIVE',
        currency: 'INR',
        createdAt: accountCreationDate,
        updatedAt: accountCreationDate
      });
    }
    accounts.push(account);
  }

  return accounts;
}

async function getMainSystemAccount() {
  const systemUser = await userModel.findOne({ systemUser: true }).select('+systemUser');
  if (!systemUser) throw new Error('A provisioned system user is required to fund the synthetic demo account.');
  const systemAccount = await accountModel.findOne({ user: systemUser._id, status: 'ACTIVE', currency: 'INR' });
  if (!systemAccount) throw new Error('An active INR system account is required to fund the synthetic demo account.');
  return systemAccount;
}

async function ensureMainDemoOpeningFunds(senderAccount, recipientAccount, systemAccount) {
  const existingFunding = await transactionModel.findOne({ idempotencyKey: OPENING_FUNDING_KEY });
  const expectedFunding = {
    fromAccount: systemAccount._id,
    toAccount: senderAccount._id,
    amount: OPENING_FUNDING_AMOUNT,
    category: 'Income',
    note: 'Monthly dashboard demo opening funds',
    createdAt: new Date(Date.UTC(2026, 9, 1, 0, 0)),
    idempotencyKey: OPENING_FUNDING_KEY
  };

  if (existingFunding) {
    assertMatchingSeedTransaction(existingFunding, expectedFunding);
    await verifyTransactionLedger(existingFunding, expectedFunding);
    return 'existing';
  }

  const [senderBalance, recipientBalance] = await Promise.all([
    senderAccount.getBalance(),
    recipientAccount.getBalance()
  ]);
  if (senderBalance >= Math.max(...MONTHS.map((month) => month.amountMax))) return 'not-needed';
  if (senderBalance !== 0 || recipientBalance !== 0) {
    throw new Error(
      'The reserved demo accounts have partial balances but no opening-funding record. ' +
      'The script will not top them up or adjust existing balances.'
    );
  }

  const senderHistory = await transactionModel.countDocuments({
    $or: [{ fromAccount: senderAccount._id }, { toAccount: senderAccount._id }]
  });
  const recipientHistory = await transactionModel.countDocuments({
    $or: [{ fromAccount: recipientAccount._id }, { toAccount: recipientAccount._id }]
  });
  if (senderHistory || recipientHistory) {
    throw new Error('The reserved demo accounts have prior transactions; refusing to add opening funds automatically.');
  }

  let funding;
  let created = true;
  try {
    funding = await createCompletedTransfer(expectedFunding);
  } catch (error) {
    if (error.code !== 11000) throw error;
    funding = await transactionModel.findOne({ idempotencyKey: OPENING_FUNDING_KEY });
    if (!funding) throw error;
    created = false;
  }
  assertMatchingSeedTransaction(funding, expectedFunding);
  await verifyTransactionLedger(funding, expectedFunding);
  return created ? 'created' : 'existing';
}

function assertDemoDatabase() {
  const databaseName = mongoose.connection.name || '';
  const isDemoDatabase = /(?:^|[_-])(test|e2e|demo)(?:[_-]|$)/i.test(databaseName);
  const explicitlyAllowedMain = databaseName === 'BackendLedger' &&
    process.env.ALLOW_MAIN_DATABASE_DEMO_SEED === 'yes';
  if (!isDemoDatabase && !explicitlyAllowedMain) {
    throw new Error(
      `Refusing to seed database "${databaseName || '(unknown)'}". ` +
      'Use a test/e2e/demo database, or explicitly set ALLOW_MAIN_DATABASE_DEMO_SEED=yes for BackendLedger.'
    );
  }
  return explicitlyAllowedMain;
}

async function assertVisibleInLatestFeed(accounts, plan) {
  const oldestSeedDate = plan[0].createdAt;
  const seedKeys = new Set(plan.map((entry) => entry.idempotencyKey));
  for (const account of accounts) {
    const ownerAccounts = await accountModel.find({ user: account.user }).select('_id').lean();
    const ownerAccountIds = ownerAccounts.map((row) => row._id);
    const candidateRows = await transactionModel.find({
      $or: [
        { fromAccount: { $in: ownerAccountIds } },
        { toAccount: { $in: ownerAccountIds } }
      ],
      createdAt: { $gte: oldestSeedDate }
    }).select('idempotencyKey').lean();
    const otherNewerRows = candidateRows.filter((row) => !seedKeys.has(row.idempotencyKey));
    if (otherNewerRows.length + plan.length > 100) {
      throw new Error(
        `The latest-100 API feed for account ${account._id} would omit seeded records. ` +
        `Found ${otherNewerRows.length} other newer transactions; the script needs at most ${100 - plan.length}.`
      );
    }
  }
}

async function seedMonthlyDemoTransactions() {
  await connectDB();
  try {
    const isMainDatabase = assertDemoDatabase();
    const systemAccount = isMainDatabase ? await getMainSystemAccount() : null;
    const systemBalanceBefore = isMainDatabase ? await systemAccount.getBalance() : null;
    const accounts = isMainDatabase ? await ensureMainDemoAccounts() : await selectDemoAccounts();
    if (accounts[0].user.toString() === accounts[1].user.toString()) {
      throw new Error('The selected demo accounts must belong to two different users.');
    }

    const openingFundingStatus = isMainDatabase
      ? await ensureMainDemoOpeningFunds(accounts[0], accounts[1], systemAccount)
      : 'not-applicable';
    const [balanceOne, balanceTwo] = await Promise.all(accounts.map((account) => account.getBalance()));

    // The larger existing balance sends the first leg. Each pair reverses the
    // same amount the following morning, leaving both account balances intact.
    const firstIndex = balanceTwo > balanceOne ? 1 : 0;
    const firstAccount = accounts[firstIndex];
    const secondAccount = accounts[1 - firstIndex];
    const firstBalance = Math.max(balanceOne, balanceTwo);
    const largestPlannedAmount = Math.max(...MONTHS.map((month) => month.amountMax));
    if (firstAccount.status !== 'ACTIVE' || secondAccount.status !== 'ACTIVE' || firstBalance < largestPlannedAmount) {
      throw new Error(
        `Selected accounts must be active and the first account must have at least INR ${largestPlannedAmount} available. ` +
        'Balances will not be changed to make the seed run.'
      );
    }

    const beforeBalances = new Map(accounts.map((account, index) => [account._id.toString(), [balanceOne, balanceTwo][index]]));
    const plan = buildSeedPlan(firstAccount, secondAccount);
    await assertVisibleInLatestFeed(accounts, plan);

    let inserted = 0;
    let alreadyPresent = 0;
    for (const expected of plan) {
      let transaction = await transactionModel.findOne({ idempotencyKey: expected.idempotencyKey });
      if (transaction) {
        assertMatchingSeedTransaction(transaction, expected);
        alreadyPresent += 1;
        continue;
      }

      try {
        transaction = await createCompletedTransfer(expected);
      } catch (error) {
        // A concurrent run may have won the unique-key race. Accept it only
        // after checking that both the transfer and immutable ledger match.
        if (error.code !== 11000) throw error;
        transaction = await transactionModel.findOne({ idempotencyKey: expected.idempotencyKey });
        if (!transaction) throw error;
        assertMatchingSeedTransaction(transaction, expected);
        alreadyPresent += 1;
        continue;
      }

      assertMatchingSeedTransaction(transaction, expected);
      inserted += 1;
    }

    const seedRows = await transactionModel.find({
      idempotencyKey: { $regex: `^${SEED_KEY_PREFIX}` }
    }).sort({ createdAt: 1 }).lean();
    if (seedRows.length !== plan.length) {
      throw new Error(`Found ${seedRows.length} seed transactions; expected exactly ${plan.length}`);
    }

    const seedKeySet = new Set(seedRows.map((row) => row.idempotencyKey));
    if (seedKeySet.size !== plan.length) {
      throw new Error('Duplicate monthly demo idempotency keys were found.');
    }
    const seedByKey = new Map(seedRows.map((row) => [row.idempotencyKey, row]));
    const entriesByTransaction = new Map();
    const allLedgerEntries = await ledgerModel.find({
      transaction: { $in: seedRows.map((row) => row._id) }
    }).lean();
    for (const entry of allLedgerEntries) {
      const transactionId = entry.transaction.toString();
      const entries = entriesByTransaction.get(transactionId) || [];
      entries.push(entry);
      entriesByTransaction.set(transactionId, entries);
    }

    const outgoingTotals = new Map(accounts.map((account) => [
      account._id.toString(), { October: 0, November: 0, categories: { October: {}, November: {} } }
    ]));
    const monthCounts = Object.fromEntries(MONTHS.map((month) => [month.label, 0]));
    for (const expected of plan) {
      const transaction = seedByKey.get(expected.idempotencyKey);
      if (!transaction) throw new Error(`Missing expected seed key ${expected.idempotencyKey}`);
      assertMatchingSeedTransaction(transaction, expected);
      verifyLedgerEntries(
        transaction,
        expected,
        entriesByTransaction.get(transaction._id.toString()) || []
      );

      const date = new Date(transaction.createdAt);
      const month = date.getUTCMonth() === 9 ? 'October' : 'November';
      monthCounts[month] += 1;
      const totals = outgoingTotals.get(transaction.fromAccount.toString());
      if (totals) {
        totals[month] += transaction.amount;
        totals.categories[month][transaction.category] =
          (totals.categories[month][transaction.category] || 0) + transaction.amount;
      }
    }

    for (const [accountId, totals] of outgoingTotals) {
      if (totals.November < totals.October * 1.1) {
        throw new Error(`Seeded outgoing activity for account ${accountId} does not show a meaningful November increase.`);
      }
      const categoryNames = new Set([
        ...Object.keys(totals.categories.October),
        ...Object.keys(totals.categories.November)
      ]);
      const increased = [...categoryNames].some((category) =>
        (totals.categories.November[category] || 0) > (totals.categories.October[category] || 0)
      );
      const decreased = [...categoryNames].some((category) =>
        (totals.categories.November[category] || 0) < (totals.categories.October[category] || 0)
      );
      if (!increased || !decreased) {
        throw new Error(`Seeded category totals for account ${accountId} do not show changes in both directions.`);
      }
    }

    const afterBalances = await Promise.all(accounts.map((account) => account.getBalance()));
    afterBalances.forEach((balance, index) => {
      const before = beforeBalances.get(accounts[index]._id.toString());
      if (Math.abs(balance - before) > 0.000001) {
        throw new Error(`Seed changed account ${accounts[index]._id} balance from ${before} to ${balance}`);
      }
    });

    const dates = seedRows.map((row) => new Date(row.createdAt));
    for (const date of dates) {
      if (date.getUTCFullYear() !== 2026 || ![9, 10].includes(date.getUTCMonth())) {
        throw new Error(`Seed transaction date ${date.toISOString()} falls outside October/November 2026`);
      }
    }

    console.log(`Monthly demo seed verified in ${mongoose.connection.name}.`);
    console.log(`Transactions: ${plan.length} total (${monthCounts.October} October, ${monthCounts.November} November); inserted ${inserted}, already present ${alreadyPresent}.`);
    console.log(`Monthly transfer ledger entries: ${plan.length * 2}; all completed transfers have one matching debit and credit.`);
    if (isMainDatabase) {
      const systemBalanceAfter = await systemAccount.getBalance();
      if (openingFundingStatus === 'created') {
        console.log(`Opening funding: INR ${OPENING_FUNDING_AMOUNT} was credited to the synthetic sender from system account ${systemAccount._id}. System balance: INR ${systemBalanceBefore} -> INR ${systemBalanceAfter}.`);
        console.log('Opening funding ledger entries: 2 (one system-account debit and one demo-account credit).');
      } else {
        console.log(`Opening funding: ${openingFundingStatus}; system balance remains INR ${systemBalanceAfter}.`);
      }
    }
    for (const [accountId, totals] of outgoingTotals) {
      const change = ((totals.November - totals.October) / totals.October) * 100;
      console.log(`Outgoing comparison for ${accountId}: October INR ${totals.October}; November INR ${totals.November} (+${change.toFixed(1)}%).`);
    }
    console.log(`Demo account balances after monthly transfers: ${accounts.map((account, index) => `${account._id} INR ${afterBalances[index]}`).join('; ')}`);
  } finally {
    await mongoose.disconnect();
  }
}

seedMonthlyDemoTransactions().catch((error) => {
  console.error(`Monthly demo seed failed: ${error.message}`);
  process.exitCode = 1;
});
