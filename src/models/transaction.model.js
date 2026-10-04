import mongoose from "mongoose";


const transactionSchema = new mongoose.Schema({
  fromAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'account',
    required: [true, 'Transaction must be associated with a from account'],
    index: true
  },
  toAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'account',
    required: [true, 'Transaction must be associated with a to account'],
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
      message: "Status can be either PENDING, COMPLETED, FAILED or REVERSED"
    },
    default: "PENDING"
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required for creating a transaction'],
    min: [1, 'Amount must be greater than 0']
  },
  idempotencyKey: {
    type: String,
    required: [true, 'Idempotency key is required for creating a transaction'],
    unique: [true, 'Idempotency key already exists']
  }
},{ timestamps: true
});


const transactionModel = mongoose.model('transaction', transactionSchema);

export default transactionModel;