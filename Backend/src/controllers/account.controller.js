import accountModel from "../models/account.model.js";

async function listAccountsController(req, res) {
  const accounts = await accountModel.find({ user: req.user._id }).sort({ createdAt: 1 });

  const accountsWithBalances = await Promise.all(
    accounts.map(async (account, index) => ({
      _id: account._id,
      name: account.name || `Ledger Account ${index + 1}`,
      status: account.status,
      currency: account.currency,
      balance: await account.getBalance(),
      createdAt: account.createdAt,
      updatedAt: account.updatedAt
    }))
  );

  res.status(200).json({
    accounts: accountsWithBalances
  });
}

async function createAccountController(req, res) {
  const { name } = req.body ?? {};
  if (name !== undefined && (typeof name !== 'string' || !name.trim() || name.trim().length > 40)) {
    return res.status(400).json({ message: 'Account name must be between 1 and 40 characters' });
  }
  const user = req.user;
  const existingCount = await accountModel.countDocuments({ user: user._id });
  const account = await accountModel.create({
    user: user._id,
    name: name?.trim() || `Ledger Account ${existingCount + 1}`
  })

  res.status(201).json({
    account
  });
}

async function renameAccountController(req, res) {
  const { accountId } = req.params;
  const { name } = req.body ?? {};
  if (!/^[a-f\d]{24}$/i.test(accountId)) {
    return res.status(400).json({ message: 'Invalid account ID' });
  }
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 40) {
    return res.status(400).json({ message: 'Account name must be between 1 and 40 characters' });
  }

  const account = await accountModel.findOneAndUpdate(
    { _id: accountId, user: req.user._id },
    { $set: { name: name.trim() } },
    { new: true, runValidators: true }
  );
  if (!account) {
    return res.status(404).json({ message: 'Account not found for this user' });
  }
  return res.status(200).json({ account });
}

export default { listAccountsController, createAccountController, renameAccountController }
