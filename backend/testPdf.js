const fs = require('fs');
const PdfService = require('./services/pdfService');

(async () => {
  const mockOrder = {
    _id: '6940edcbdeeaf2908f74c365',
    createdAt: Date.now(),
    orderItems: [
      { name: 'WRISTIO HD, Bluetooth Calling Smart Watch', product: { _id: '693f9d81fe22e5fba6558d88' }, quantity: 1, price: 150.32 }
    ],
    itemsPrice: 150.32,
    taxPrice: 0,
    shippingPrice: 0,
    totalPrice: 150.32,
    shippingInfo: { address: '123 Street', city: 'Mumbai', postalCode: '400001', country: 'India' }
  };

  const mockUser = { name: 'anish', email: 'test@example.com' };

  try {
    const { buffer, filename, path: savedPath } = await PdfService.generateOrderPdf(mockOrder, mockUser);
    console.log('PDF generated:', filename, 'saved to', savedPath || '(no saved copy)');
  } catch (err) {
    console.error('PDF generation failed:', err);
    process.exit(1);
  }
})();
