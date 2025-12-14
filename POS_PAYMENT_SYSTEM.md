# POS Payment System Documentation

## Overview
The Point of Sale (POS) payment system is a separate payment flow from the normal e-commerce Stripe integration. It allows merchants to process in-store payments directly through Cash or UPI methods.

## Key Features

### 1. **Separate Payment Flow**
- **E-commerce orders**: Use Stripe integration, payment status = `"succeeded"`
- **POS orders**: Use in-store payment (Cash/UPI), payment status = `"PAID"`

### 2. **Payment Methods**
- **Cash**: Physical cash payment
- **UPI**: Digital UPI payment
- Payment method is stored in `order.paymentInfo.method`

### 3. **Payment Modal**
When merchant clicks "Proceed to Payment" in POS:
1. Payment modal appears with order summary
2. Merchant selects payment method (Cash or UPI)
3. Merchant enters amount received from customer
4. System calculates change (for cash payments)
5. Payment is confirmed and order is created with status `"PAID"`

### 4. **Order Visibility**

#### For Customers:
- Orders appear in "My Orders" section
- Shows as **PAID** (green badge)
- Displays payment method (CASH/UPI)
- Shows "In-Store Purchase" indicator
- No shipping info required (in-store pickup)

#### For Merchants:
- Orders appear in "Merchant Dashboard > Orders"
- Shows payment status with colored badges:
  - ✅ **PAID** (green) - Payment completed
  - ❌ **NOT PAID** (red) - Payment pending
- Shows payment method (CASH/UPI)
- Real-time order tracking

## Payment Flow

```
1. Customer brings items to checkout
2. Merchant scans items → Cart updated
3. [Optional] Merchant enters customer email → Links to account
4. Merchant clicks "Proceed to Payment"
5. Payment Modal Opens:
   ├─ Select Payment Method: Cash or UPI
   ├─ Enter Amount Received
   └─ Confirm Payment
6. Order Created with:
   ├─ paymentInfo.status = "PAID"
   ├─ paymentInfo.method = "CASH" or "UPI"
   ├─ paymentInfo.id = "CASH_timestamp" or "UPI_timestamp"
   └─ paidAt = current timestamp
7. Order visible to:
   ├─ Customer (if email linked)
   └─ Merchant dashboard
```

## Backend Implementation

### Updated posController.js
```javascript
exports.checkoutPOS = async (req, res) => {
  const { merchantId, paymentMethod, customerId, customerEmail, amountReceived } = req.body;
  
  // Verify payment amount
  if (amountReceived < total) {
    return res.status(400).json({ message: 'Insufficient payment' });
  }
  
  // Create order with PAID status
  const order = await Order.create({
    paymentInfo: {
      id: paymentMethod === 'cash' ? `CASH_${Date.now()}` : `UPI_${Date.now()}`,
      status: 'PAID', // ← Immediate payment
      method: paymentMethod.toUpperCase(),
      amountReceived: amountReceived
    },
    paidAt: Date.now(),
    // ... rest of order data
  });
  
  // Return change amount for cash payments
  return res.json({ 
    order, 
    change: amountReceived - total 
  });
};
```

## Frontend Implementation

### Payment Modal Features
1. **Order Summary**: Shows items count and total amount
2. **Customer Info**: Displays linked customer (if any)
3. **Payment Method Selection**: Radio buttons for Cash/UPI
4. **Amount Input**: Pre-filled with total, editable for cash payments
5. **Change Calculation**: Auto-calculates change for overpayment
6. **Confirmation Button**: Processes payment and creates order

### Payment Status Display
All components now check for both payment statuses:

```javascript
// Works for both e-commerce and POS orders
const isPaid = (
  paymentInfo.status === 'succeeded' ||  // E-commerce (Stripe)
  paymentInfo.status === 'PAID'          // POS (Cash/UPI)
);
```

### Components Updated:
- ✅ `OrderDetail.js` - Shows payment status and method
- ✅ `MerchantOrders.js` - Green/red badges for payment status
- ✅ `MerchantAnalytics.js` - Payment status in recent orders
- ✅ `UpdateOrder.js` - Admin order update page

## Database Schema

### Order Model - paymentInfo
```javascript
paymentInfo: {
  id: String,        // "CASH_1234567890" or "UPI_1234567890"
  status: String,    // "PAID" for POS orders
  method: String,    // "CASH" or "UPI" (optional)
  amountReceived: Number  // Amount received from customer
}
```

## Usage Example

### Merchant Workflow:
1. Login as merchant/staff
2. Navigate to "POS System"
3. Scan customer's items (barcode scanner or upload)
4. [Optional] Enter customer email for loyalty
5. Click "Proceed to Payment"
6. Select Cash or UPI
7. Enter amount received (e.g., $50 for $45.67 order)
8. System shows change: $4.33
9. Click "Confirm Payment"
10. Order created with PAID status
11. Print receipt / Email to customer

### Customer Experience:
1. Provides items at checkout
2. Makes payment (cash or UPI)
3. Receives confirmation
4. [If registered] Order appears in "My Orders" as PAID
5. Can view order details anytime

## Testing Checklist

- [ ] Cash payment with exact amount
- [ ] Cash payment with change calculation
- [ ] UPI payment
- [ ] Order appears in customer's order list (if email linked)
- [ ] Order appears in merchant dashboard
- [ ] Payment status shows as PAID (green)
- [ ] Payment method displays correctly
- [ ] Walk-in sale (no customer email)
- [ ] Linked customer sale
- [ ] Admin can view POS orders
- [ ] Stock reduces correctly after payment

## Important Notes

⚠️ **Critical Differences from E-commerce Orders:**
1. **No Stripe integration** - POS payments are offline/direct
2. **No shipping info required** - Orders are in-store pickup
3. **Immediate payment** - No "Processing" state for payment
4. **Optional customer linking** - Can be walk-in sales
5. **Merchant isolation** - Each merchant sees only their orders

## Security Considerations

1. **Authentication Required**: Only authenticated merchants/staff can access POS
2. **Merchant Verification**: Orders are filtered by merchantId
3. **Payment Validation**: Backend verifies amount received ≥ total
4. **Stock Validation**: Checks stock availability before checkout
5. **Role-Based Access**: Only `merchant_admin`, `staff`, and `admin` roles

## Future Enhancements

- [ ] Receipt printing functionality
- [ ] Email receipt to customer
- [ ] Loyalty points calculation
- [ ] Refund/return processing for POS orders
- [ ] Daily sales report generation
- [ ] Cash drawer management
- [ ] Multiple payment methods (split payment)
- [ ] Barcode generation for new products
