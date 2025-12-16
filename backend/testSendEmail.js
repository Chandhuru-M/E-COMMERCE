// Quick test script to send email using existing emailService
// Loads config.env and calls sendNotificationEmail

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config', 'config.env') });

const { sendNotificationEmail } = require('./services/emailService');

(async () => {
  try {
    const to = process.env.EMAIL_USER || 'you@yourdomain.test';
    const subject = 'Mailtrap test from HIcart';
    const message = 'This is a test email sent using Mailtrap SMTP settings.';

    console.log('Using SMTP host:', process.env.SMTP_HOST);
    const ok = await sendNotificationEmail(to, subject, message);
    console.log('sendNotificationEmail result:', ok);
    process.exit(ok ? 0 : 1);
  } catch (err) {
    console.error('Test send error:', err?.message || err);
    process.exit(2);
  }
})();
