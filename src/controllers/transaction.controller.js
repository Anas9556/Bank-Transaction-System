import mongoose from 'mongoose';
import transactionModel from '../models/transaction.model.js';
import accountModel from '../models/account.model.js';
import ledgerModel from '../models/ledger.model.js';
import emailService from '../services/email.service.js';

function validateRequest({ fromAccount, toAccount, amount, idempotencyKey }, requireFromAccount) {
  if (
    (requireFromAccount && (typeof fromAccount !== 'string' || !mongoose.isObjectIdOrHexString(fromAccount))) ||
    typeof toAccount !== 'string' ||
    !mongoose.isObjectIdOrHexString(toAccount) ||
    typeof amount !== 'number' ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    typeof idempotencyKey !== 'string' ||
    !idempotencyKey.trim()
  ) {
    return false;
  }

  return true;
}

function respondToExistingTransaction(transaction, fromAccount, toAccount, amount, res) {
  const sameRequest =
    transaction.fromAccount.toString() === fromAccount.toString() &&
    transaction.toAccount.toString() === toAccount.toString() &&
    transaction.amount === amount;

  if (!sameRequest) {
    res.status(409).json({
      message: 'Idempotency key has already been used for a different transaction'
    });
    return true;
  }

  if (transaction.status === 'COMPLETED') {
    res.status(200).json({
      message: 'Transaction already processed successfully',
      transaction
    });
    return true;
  }

  if (transaction.status === 'PENDING') {
    res.status(202).json({
      message: 'Transaction is still pending',
      transaction
    });
    return true;
  }

  res.status(409).json({
    message: `Transaction has status ${transaction.status}`,
    transaction
  });
  return true;
}

async function createLedgerTransaction(
  fromAccount,
  toAccount,
  amount,
  idempotencyKey,
  checkSenderBalance = false
) {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      if (checkSenderBalance) {
        const lockResult = await accountModel.updateOne(
          { _id: fromAccount, status: 'ACTIVE' },
          { $inc: { __v: 1 } },
          { session }
        );

        if (lockResult.matchedCount !== 1) {
          const error = new Error('Sender account is not active');
          error.statusCode = 400;
          throw error;
        }

        const senderAccount = await accountModel.findById(fromAccount).session(session);
        const balance = await senderAccount.getBalance(session);

        if (balance < amount) {
          const error = new Error(
            `Insufficient balance in sender account ${fromAccount}. Current balance is ${balance}`
          );
          error.statusCode = 400;
          throw error;
        }
      }

      const transaction = new transactionModel({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: 'PENDING'
      });

      await transaction.save({ session });

      await ledgerModel.create([
        {
          account: fromAccount,
          amount,
          transaction: transaction._id,
          type: 'DEBIT'
        },
        {
          account: toAccount,
          amount,
          transaction: transaction._id,
          type: 'CREDIT'
        }
      ], { session });

      transaction.status = 'COMPLETED';
      await transaction.save({ session });

      return transaction;
    });
  } finally {
    await session.endSession();
  }
}

async function createOrRespondToDuplicate(
  fromAccount,
  toAccount,
  amount,
  idempotencyKey,
  res,
  checkSenderBalance = false
) {
  try {
    return {
      transaction: await createLedgerTransaction(
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        checkSenderBalance
      )
    };
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }

    const existingTransaction = await transactionModel.findOne({ idempotencyKey });

    if (!existingTransaction) {
      throw error;
    }

    respondToExistingTransaction(
      existingTransaction,
      fromAccount,
      toAccount,
      amount,
      res
    );
    return { responded: true };
  }
}

async function createTransaction(req, res) {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body ?? {};

  if (!validateRequest({ fromAccount, toAccount, amount, idempotencyKey }, true)) {
    return res.status(400).json({
      message: 'Invalid or missing transaction fields'
    });
  }

  const fromUserAccount = await accountModel.findOne({
    _id: fromAccount,
    user: req.user._id
  });
  const toUserAccount = await accountModel.findById(toAccount);

  if (!fromUserAccount || !toUserAccount) {
    return res.status(404).json({
      message: 'Sender account not found for this user or recipient account not found'
    });
  }

  const normalizedIdempotencyKey = idempotencyKey.trim();
  const existingTransaction = await transactionModel.findOne({
    idempotencyKey: normalizedIdempotencyKey
  });

  if (existingTransaction) {
    return respondToExistingTransaction(
      existingTransaction,
      fromUserAccount._id,
      toUserAccount._id,
      amount,
      res
    );
  }

  if (fromUserAccount.status !== 'ACTIVE' || toUserAccount.status !== 'ACTIVE') {
    return res.status(400).json({
      message: 'One or both accounts are not active'
    });
  }

  let result;
  try {
    result = await createOrRespondToDuplicate(
      fromUserAccount._id,
      toUserAccount._id,
      amount,
      normalizedIdempotencyKey,
      res,
      true
    );
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }

  if (result.responded) {
    return;
  }

  const { transaction } = result;

  await emailService.sendTransactionEmail(
    req.user.email,
    req.user.name,
    amount,
    toUserAccount._id
  );

  return res.status(201).json({
    message: 'Transaction created successfully',
    transaction
  });
}

async function createInitialFundsTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body ?? {};

  if (!validateRequest({ toAccount, amount, idempotencyKey }, false)) {
    return res.status(400).json({
      message: 'Invalid or missing transaction fields'
    });
  }

  const toUserAccount = await accountModel.findById(toAccount);
  const fromSystemAccount = await accountModel.findOne({
    user: req.user._id
  });

  if (!toUserAccount) {
    return res.status(404).json({
      message: 'Recipient account not found'
    });
  }

  if (!fromSystemAccount) {
    return res.status(404).json({
      message: 'System user account not found; run the system-user setup command'
    });
  }

  const normalizedIdempotencyKey = idempotencyKey.trim();
  const existingTransaction = await transactionModel.findOne({
    idempotencyKey: normalizedIdempotencyKey
  });

  if (existingTransaction) {
    return respondToExistingTransaction(
      existingTransaction,
      fromSystemAccount._id,
      toUserAccount._id,
      amount,
      res
    );
  }

  if (fromSystemAccount.status !== 'ACTIVE' || toUserAccount.status !== 'ACTIVE') {
    return res.status(400).json({
      message: 'System or recipient account is not active'
    });
  }

  const result = await createOrRespondToDuplicate(
    fromSystemAccount._id,
    toUserAccount._id,
    amount,
    normalizedIdempotencyKey,
    res
  );

  if (result.responded) {
    return;
  }

  return res.status(201).json({
    message: 'Initial funds transaction created successfully',
    transaction: result.transaction
  });
}

export default { createTransaction, createInitialFundsTransaction };
