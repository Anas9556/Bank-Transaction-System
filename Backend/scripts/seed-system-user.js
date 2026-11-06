import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import accountModel from '../src/models/account.model.js';
import userModel from '../src/models/user.model.js';

async function setupSystemUser() {
  const { SYSTEM_USER_EMAIL, SYSTEM_USER_PASSWORD, SYSTEM_USER_NAME } = process.env;
  if (!SYSTEM_USER_EMAIL || !SYSTEM_USER_PASSWORD || !SYSTEM_USER_NAME) {
    throw new Error(
      'SYSTEM_USER_EMAIL, SYSTEM_USER_PASSWORD, and SYSTEM_USER_NAME must be set'
    );
  }

  const systemUserEmail = SYSTEM_USER_EMAIL.trim().toLowerCase();
  await connectDB();

  try {
    let user = await userModel.findOne({
      email: systemUserEmail
    }).select('+systemUser');

    if (user && !user.systemUser) {
      throw new Error(
        'The configured system-user email belongs to a non-system user'
      );
    }

    if (!user) {
      user = await userModel.create({
        email: systemUserEmail,
        password: SYSTEM_USER_PASSWORD,
        name: SYSTEM_USER_NAME,
        systemUser: true
      });
    }

    let account = await accountModel.findOne({ user: user._id });
    if (!account) {
      account = await accountModel.create({ user: user._id });
    }

    console.log(`System user is ready. User ID: ${user._id}; account ID: ${account._id}`);
  } finally {
    await mongoose.disconnect();
  }
}

setupSystemUser().catch((error) => {
  console.error('System-user setup failed:', error.message);
  process.exitCode = 1;
});
