const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Generate a PDF receipt for an order and return a buffer + filename + path
async function generateOrderPdf(order, user, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];
      const uploadsDir = path.join(__dirname, '..', 'uploads', 'receipts');

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        const filename = `receipt_${order._id}.pdf`;
        const filePath = path.join(uploadsDir, filename);
        // Save a copy to uploads/receipts for inspection
        try {
          fs.writeFileSync(filePath, pdfData);
        } catch (writeErr) {
          // non-fatal
          console.warn('Could not write receipt copy to uploads:', writeErr.message);
        }
        resolve({ buffer: pdfData, filename, path: filePath });
      });

      // Header with optional logo (uses backend/images/Auralogo.png if exists)
      const logoPath = path.join(__dirname, '..', 'images', 'Auralogo.png');
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, doc.page.width - 140, 30, { width: 100 });
        } catch (e) {
          // ignore image errors
        }
      }

      doc.fontSize(20).text('Aura Receipt', { align: 'left' });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Order ID: ${order._id}`);
      doc.text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleString()}`);
      doc.moveDown(0.5);

      // Billing / Shipping
      doc.fontSize(12).text('Billing & Shipping', { underline: true });
      doc.fontSize(10).text(`${user.name || 'Customer'}`);
      if (order.shippingInfo) {
        const s = order.shippingInfo;
        if (s.address) doc.text(s.address);
        const line2 = [s.city, s.state, s.postalCode].filter(Boolean).join(' ');
        if (line2) doc.text(line2);
        if (s.country) doc.text(s.country);
        if (s.phone) doc.text(`Phone: ${s.phone}`);
      }

      doc.moveDown(0.5);

      // Items Table
      doc.fontSize(12).text('Items', { underline: true });
      doc.moveDown(0.2);
      const items = order.orderItems || [];

      items.forEach((it, idx) => {
        const name = it.name || (it.product && it.product.name) || 'Product';
        const id = (it.product && it.product._id) ? String(it.product._id) : (it.product || 'N/A');
        const qty = it.quantity || it.qty || 1;
        const priceNum = (typeof it.price === 'number') ? it.price : Number(it.price) || 0;
        const lineTotal = priceNum * qty;
        doc.fontSize(10).text(`${idx + 1}. ${name}`);
        doc.fontSize(9).text(`   ID: ${id}    Qty: ${qty}    Unit: ₹${priceNum.toFixed(2)}    Line: ₹${lineTotal.toFixed(2)}`);
        doc.moveDown(0.2);
      });

      doc.moveDown(0.5);
      doc.fontSize(12).text('Summary', { underline: true });
      doc.moveDown(0.2);

      const itemsTotal = Number(order.itemsPrice || 0);
      const tax = Number(order.taxPrice || 0);
      const shipping = Number(order.shippingPrice || 0);
      const grand = Number(order.totalPrice || itemsTotal + tax + shipping);

      doc.fontSize(10).text(`Items Total: ₹${itemsTotal.toFixed(2)}`);
      doc.text(`Tax: ₹${tax.toFixed(2)}`);
      doc.text(`Shipping: ₹${shipping.toFixed(2)}`);
      doc.moveDown(0.2);
      doc.fontSize(14).text(`Grand Total: ₹${grand.toFixed(2)}`, { continued: false });

      doc.moveDown(1);
      doc.fontSize(10).text('Thank you for shopping with Aura!', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateOrderPdf };
