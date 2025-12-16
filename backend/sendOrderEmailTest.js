const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config', 'config.env') });

const { sendOrderReceiptEmail } = require('./services/emailService');

(async () => {
  try {
    const mockOrder = {
      _id: 'testorder1234567890',
      createdAt: Date.now(),
      orderItems: [
        { name: 'WRISTIO HD, Bluetooth Calling Smart Watch', product: { _id: '693f9d81fe22e5fba6558d88' }, quantity: 1, price: 150.32 }
      ],
      itemsPrice: 150.32,
      taxPrice: 2.00,
      shippingPrice: 5.00,
      totalPrice: 157.32,
      shippingInfo: { address: '123 Street', city: 'Mumbai', postalCode: '400001', country: 'India', phone: '9999999999' }
    };

    const mockUser = { name: 'anish', email: process.argv[2] || process.env.EMAIL_USER };
    if (!mockUser.email) {
      console.error('No recipient email provided via arg or EMAIL_USER env');
      process.exit(1);
    }

    console.log('Sending order receipt to', mockUser.email);
    const ok = await sendOrderReceiptEmail(mockOrder, mockUser);
    console.log('sendOrderReceiptEmail result:', ok);
    process.exit(ok ? 0 : 2);
  } catch (err) {
    console.error('Error sending order email:', err?.message || err);
    process.exit(3);
  }
})();
