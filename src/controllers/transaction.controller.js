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
}