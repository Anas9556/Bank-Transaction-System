import mongoose from 'mongoose';
import transactionModel from '../models/transaction.model.js';
import accountModel from '../models/account.model.js';
import ledgerModel from '../models/ledger.model.js';
import emailService from '../services/email.service.js';

async function createTransaction(req, res) {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  /**
   * Validate Request
   */

  if(!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: 'Missing required fields'
    });
  }

  const fromUserAccount = await accountModel.findOne({
    _id: fromAccount
  })

  const toUserAccount = await accountModel.findOne({
    _id: toAccount
  })

  if(!fromUserAccount || !toUserAccount) {
    return res.status(404).json({
      message: 'One or both accounts not found'
    });
  }

  /**
   * Validate Idempotency Key
   */

  const isTransactionAlreadyExists = await transactionModel.findOne({
    idempotencyKey: idempotencyKey
  });

  if(isTransactionAlreadyExists) {
    if(isTransactionAlreadyExists.status === 'SUCCESS') {
      return res.status(200).json({
        message: 'Transaction already processed successfully',
        transaction: isTransactionAlreadyExists
      });
    }

    if(isTransactionAlreadyExists.status === 'PENDING') {
      return res.status(200).json({
        message: 'Transaction is still pending'
      });
    }

    if(isTransactionAlreadyExists.status === 'FAILED') {
      return res.status(500).json({
        message: 'Transaction has failed previously'
      });
    }

    if(isTransactionAlreadyExists.status === 'REVERSED') {
      return res.status(500).json({
        message: 'Transaction has been reversed previously'
      });
    }
  }

  /**
   * Check Account Status
   */

  if(fromUserAccount.status !== 'ACTIVE' || toUserAccount.status !== 'ACTIVE') {
    return res.status(400).json({
      message: 'One or both accounts are not active'
    });
  }

  /**
   * Derive sender Balance from Ledger
   */

  const balance = await fromUserAccount.getBalance();

  if(balance < amount) {
    return res.status(400).json({
      message: `Insufficient balance in sender account ${fromUserAccount._id}. Current balance is ${balance}`
    })  
  }

  /**
   * Create Transaction
   */

  const session = await mongoose.startSession();
  session.startSession();

  const transaction = new transactionModel.create({
    fromAccount,
    toAccount,
    amount,
    idempotencyKey,
    status: 'PENDING'
  }, { session });

  const debitLedgerEntry = new ledgerModel.create({
    account: fromAccount,
    amount: amount,
    transaction: transaction._id,
    type: 'DEBIT'
  }, { session });
  
  const creditLedgerEntry = new ledgerModel.create({
    account: toAccount,
    amount: amount,
    transaction: transaction._id,
    type: 'CREDIT'
  }, { session });

  await session.commitTransaction();
  session.endSession();

  /**
   * Send Transaction Email
   */

  await emailService.sendTransactionEmail(req,user.email, req.email.name, amount, toAccount);

  return res.status(201).json({
    message: 'Transaction created successfully',
    transaction: transaction
  });
  
}

export default { createTransaction };