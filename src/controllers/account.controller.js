import accountModel from "../models/account.model.js";

async function createAccountController(req, res) {

  const user = req.user;

  const account = await accountModel.create({
    user: user._id,
  })

  res.status(201).json({
    account
  });
}

export default { createAccountController }