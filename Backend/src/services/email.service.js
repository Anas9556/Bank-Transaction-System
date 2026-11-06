import nodemailer from 'nodemailer';
import 'dotenv/config';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

if (process.env.NODE_ENV !== 'test') {
  transporter.verify((error) => {
    if (error) {
      console.error('Error connecting to email server:', error);
    } else {
      console.log('Email server is ready to send messages');
    }
  });
}

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Backend Ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const formatAmount = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}).format(Number(amount) || 0);

async function sendRegistrationEmail(userName, userEmail) {
  const subject = 'Welcome to Backend Ledger!';

  const text = `Hello ${userName},\n\nThank you for registering with Backend Ledger! We're excited to have you on board.\n\nBest regards,\nThe Backend Ledger Team`;

  const html = `<p>Hello ${userName},</p><p>Thank you for registering with Backend Ledger! We're excited to have you on board.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  const subject = 'Transaction Notification';
  const formattedAmount = formatAmount(amount);

  const text = `Hello ${name},\n\nA transaction of ${formattedAmount} has been made to account ${toAccount}.\n\nBest regards,\nThe Backend Ledger Team`;

  const html = `<p>Hello ${name},</p><p>A transaction of ${formattedAmount} has been made to account ${toAccount}.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

  await sendEmail(userEmail, subject, text, html);
}

async function sendInitialFundsEmail(userEmail, name, amount, accountId) {
  const subject = 'Funds credited to your account';
  const formattedAmount = formatAmount(amount);
  const greeting = name ? `Hello ${name}` : 'Hello';
  const text = `${greeting},\n\n${formattedAmount} has been credited to your account ${accountId} as an initial-funds deposit.\n\nBest regards,\nThe Ledgerly Team`;
  const html = `<p>${greeting},</p><p><strong>${formattedAmount}</strong> has been credited to your account <code>${accountId}</code> as an initial-funds deposit.</p><p>Best regards,<br>The Ledgerly Team</p>`;

  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
  const subject = 'Transaction Failure Notification';
  const formattedAmount = formatAmount(amount);

  const text = `Hello ${name},\n\nA transaction of ${formattedAmount} to account ${toAccount} has failed.\n\nBest regards,\nThe Backend Ledger Team`;

  const html = `<p>Hello ${name},</p><p>A transaction of ${formattedAmount} to account ${toAccount} has failed.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

  await sendEmail(userEmail, subject, text, html);
}

export default { sendRegistrationEmail, sendTransactionEmail, sendInitialFundsEmail, sendTransactionFailureEmail };
