// Usage: node sendEmailToUser.js <userId|email>
// Loads config.env, finds the user by id or email, and sends a test notification email

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config', 'config.env') });

const mongoose = require('mongoose');
const User = require('./models/userModel');
const { sendNotificationEmail } = require('./services/emailService');

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: node sendEmailToUser.js <userId|email>');
    process.exit(1);
  }

  // connect to DB using config.database if available
  const dbUri = process.env.DB_LOCAL_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/HIcart';
  await mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true });

  let user = null;
  if (/^[0-9a-fA-F]{24}$/.test(arg)) {
    user = await User.findById(arg);
  } else if (/^\S+@\S+\.\S+$/.test(arg)) {
    user = await User.findOne({ email: arg });
  } else {
    console.error('Argument must be a 24-char userId or an email address');
    process.exit(1);
  }

  if (!user) {
    console.error('User not found for:', arg);
    process.exit(2);
  }

  const to = user.email;
  const subject = 'Test email to user ' + (user.name || user._id);
  const html = `<p>Hello ${user.name || 'Customer'},</p><p>This is a test email sent to your account (ID: ${user._id}).</p>`;

  console.log('Sending test email to:', to);
  const ok = await sendNotificationEmail(to, subject, html);
  console.log('sendNotificationEmail result:', ok);
  await mongoose.disconnect();
  process.exit(ok ? 0 : 3);
}

main().catch(err => {
  console.error('Error:', err?.message || err);
  process.exit(99);
});
