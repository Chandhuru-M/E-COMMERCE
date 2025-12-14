# POS System Testing Guide

## Prerequisites

### 1. Backend Setup
```bash
cd backend
npm install
npm start
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 3. Database Setup
Ensure MongoDB is running and connected.

### 4. Generate Product Barcodes
```bash
cd backend
node scripts/addBarcodesToProducts.js
```

This will generate barcodes for existing products (PRD0001 - PRD0011).

## Test Scenarios

### Test 1: User Authentication

**Steps:**
1. Open browser: `http://localhost:3000/login`
2. Login with merchant/staff/admin account
3. Verify successful login and JWT token

**Expected Result:**
- ✅ Login successful
- ✅ User redirected to home page
- ✅ JWT token stored in cookie

---

### Test 2: Access POS System

**Steps:**
1. Navigate to: `http://localhost:3000/pos`
2. Verify POS interface loads

**Expected Result:**
- ✅ POS page loads
- ✅ Merchant ID input visible
- ✅ Scanner controls visible
- ✅ Cart section visible

---

### Test 3: Camera Barcode Scanning

**Steps:**
1. In POS page, enter Merchant ID: `merchant_001`
2. Click "Scan Barcode" button
3. Allow camera permissions when prompted
4. Point camera at barcode (PRD0001 - PRD0011)
5. Wait for scan result

**Expected Result:**
- ✅ Camera opens
- ✅ Barcode detected
- ✅ Product added to cart
- ✅ Scanner stops automatically
- ✅ Success toast notification
- ✅ Cart updates with product

**Common Issues:**
- **Camera permission denied**: Grant camera access in browser settings
- **No camera found**: Use "Upload Barcode Image" instead
- **Barcode not recognized**: Ensure proper lighting and distance

---

### Test 4: Image Upload Scanning

**Steps:**
1. In POS page, click "Upload Barcode Image"
2. Select barcode image file (from `backend/uploads/barcodes/`)
3. Wait for processing

**Expected Result:**
- ✅ File picker opens
- ✅ Image uploaded successfully
- ✅ Barcode decoded
- ✅ Product added to cart
- ✅ Success notification
- ✅ Cart updates

---

### Test 5: Duplicate Product Scan

**Steps:**
1. Scan product with barcode PRD0001
2. Scan same product again (PRD0001)
3. Check cart

**Expected Result:**
- ✅ Product quantity incremented to 2
- ✅ No duplicate cart items
- ✅ Total price updated (price × 2)

---

### Test 6: Remove Item from Cart

**Steps:**
1. Add 2-3 products to cart
2. Click "×" button on one item
3. Verify cart updates

**Expected Result:**
- ✅ Item removed from cart
- ✅ Cart total recalculated
- ✅ Success notification
- ✅ Cart UI updates

---

### Test 7: Out of Stock Product

**Steps:**
1. Set a product's stock to 0 in database
2. Try to scan that product's barcode
3. Check response

**Expected Result:**
- ✅ Error notification: "Product is out of stock"
- ✅ Product NOT added to cart
- ✅ Cart remains unchanged

---

### Test 8: Successful Checkout

**Steps:**
1. Add 2-3 products to cart
2. Click "Checkout" button
3. Wait for processing

**Expected Result:**
- ✅ Order created successfully
- ✅ Success notification with order total
- ✅ Cart cleared
- ✅ Stock reduced for all items
- ✅ Order saved in database

**Verification:**
```javascript
// Check in MongoDB
db.orders.find({ merchantId: "merchant_001" })

// Verify:
- user: null (walk-in customer)
- merchantId: "merchant_001"
- orderItems: array of products
- totalPrice: sum of (price × quantity)
- paymentInfo.status: "cash"
- orderStatus: "Processing"
```

---

### Test 9: Empty Cart Checkout

**Steps:**
1. Ensure cart is empty
2. Click "Checkout" button

**Expected Result:**
- ✅ Error notification: "Cart is empty"
- ✅ No order created
- ✅ User remains on POS page

---

### Test 10: Invalid Barcode

**Steps:**
1. Scan barcode that doesn't exist in database (e.g., "INVALID123")
2. Check response

**Expected Result:**
- ✅ Error notification: "Product not found"
- ✅ Nothing added to cart

---

### Test 11: Authentication Check

**Steps:**
1. Logout from application
2. Try to access `/pos` directly
3. Verify redirection

**Expected Result:**
- ✅ Redirected to login page
- ✅ Error: "Please login to access this resource"

---

### Test 12: Role Authorization

**Steps:**
1. Login with regular user account (not merchant/staff/admin)
2. Try to access POS endpoints via Postman/API

**Expected Result:**
- ✅ 403 Forbidden error
- ✅ Message: "Role not authorized"

---

### Test 13: Merchant Isolation

**Steps:**
1. Merchant A: Login and add products to cart with merchantId: "merchant_A"
2. Merchant B: Login with different account
3. Merchant B: Try to access merchantId: "merchant_A" cart

**Expected Result:**
- ✅ Merchant B can only see their own cart
- ✅ No access to other merchant's cart data
- ✅ Separate cart instances maintained

---

### Test 14: Stock Reduction Verification

**Steps:**
1. Note initial stock of product PRD0001: e.g., 100 units
2. Add 5 units to cart
3. Checkout
4. Check product stock after checkout

**Expected Result:**
- ✅ Stock reduced from 100 to 95
- ✅ Product still available if stock > 0
- ✅ Accurate inventory tracking

**Verification Query:**
```javascript
db.products.findOne({ barcode: "PRD0001" })
// Check: stock field
```

---

### Test 15: Socket.IO Events

**Steps:**
1. Open browser console
2. Listen for Socket.IO events
3. Perform scan, remove, checkout operations
4. Monitor console

**Expected Result:**
- ✅ `pos_event` emitted on scan
- ✅ `pos_event` emitted on remove
- ✅ `pos_event` emitted on checkout
- ✅ Event contains type, merchantId, and data

**Console Code:**
```javascript
// In browser console
socket.on('pos_event', (data) => {
  console.log('POS Event:', data);
});
```

---

## API Testing with Postman

### 1. Scan Barcode
```
POST http://localhost:8000/api/v1/pos/scan
Headers: 
  Cookie: token=<your_jwt_token>
Body (JSON):
{
  "barcode": "PRD0001",
  "merchantId": "merchant_001"
}
```

### 2. Remove Item
```
POST http://localhost:8000/api/v1/pos/remove
Headers: 
  Cookie: token=<your_jwt_token>
Body (JSON):
{
  "productId": "<product_id>",
  "merchantId": "merchant_001"
}
```

### 3. Checkout
```
POST http://localhost:8000/api/v1/pos/checkout
Headers: 
  Cookie: token=<your_jwt_token>
Body (JSON):
{
  "merchantId": "merchant_001",
  "paymentMethod": "cash"
}
```

---

## Performance Testing

### Load Test: Multiple Scans
1. Rapidly scan 10 different products
2. Verify all added correctly
3. Check for duplicate prevention
4. Verify cart totals

**Expected Result:**
- ✅ All scans processed
- ✅ No duplicates
- ✅ Accurate totals
- ✅ No performance degradation

---

## Database Verification Queries

### Check POS Cart
```javascript
db.poscarts.find({ merchantId: "merchant_001" }).pretty()
```

### Check Created Orders
```javascript
db.orders.find({ merchantId: "merchant_001" }).sort({ createdAt: -1 }).pretty()
```

### Check Product Stock
```javascript
db.products.find({ barcode: { $exists: true } }, { name: 1, barcode: 1, stock: 1 }).pretty()
```

### Check Merchants
```javascript
db.merchants.find().pretty()
```

---

## Error Scenarios to Test

1. **Network Error**: Disconnect internet, try operations
2. **Invalid Merchant ID**: Use non-existent merchant ID
3. **Corrupted Barcode Image**: Upload invalid image
4. **Concurrent Checkouts**: Two merchants checkout simultaneously
5. **Database Connection Lost**: Stop MongoDB, try operations
6. **Expired JWT Token**: Use old token, verify rejection
7. **Missing Required Fields**: Send incomplete request body

---

## Cleanup After Testing

### Clear Test Cart
```javascript
db.poscarts.deleteMany({ merchantId: "merchant_001" })
```

### Delete Test Orders
```javascript
db.orders.deleteMany({ merchantId: "merchant_001" })
```

### Reset Product Stock
```javascript
db.products.updateMany(
  { barcode: { $exists: true } },
  { $set: { stock: 100 } }
)
```

---

## Success Criteria

✅ All 15 test scenarios pass
✅ No console errors
✅ Accurate cart management
✅ Correct stock updates
✅ Proper authentication
✅ Role-based authorization
✅ Merchant isolation
✅ Order creation
✅ Error handling
✅ Socket.IO events

---

## Troubleshooting

### Issue: "Product not found"
- Check if barcode exists in database
- Verify barcode format (Code128)
- Check database connection

### Issue: "Camera not working"
- Grant camera permissions
- Check if camera is available
- Try image upload instead

### Issue: "Authentication failed"
- Login again
- Check JWT token in cookies
- Verify user role

### Issue: "Cart not updating"
- Check merchantId matches
- Verify Socket.IO connection
- Check network requests

### Issue: "Stock not reducing"
- Check checkout process completed
- Verify order created in database
- Check Product.findByIdAndUpdate logs

---

## Test Report Template

```
Date: ___________
Tester: ___________
Environment: Development / Staging / Production

Test Results:
[ ] Test 1: User Authentication
[ ] Test 2: Access POS System
[ ] Test 3: Camera Scanning
[ ] Test 4: Image Upload
[ ] Test 5: Duplicate Scan
[ ] Test 6: Remove Item
[ ] Test 7: Out of Stock
[ ] Test 8: Checkout
[ ] Test 9: Empty Cart
[ ] Test 10: Invalid Barcode
[ ] Test 11: Authentication Check
[ ] Test 12: Role Authorization
[ ] Test 13: Merchant Isolation
[ ] Test 14: Stock Reduction
[ ] Test 15: Socket.IO Events

Issues Found:
1. ___________
2. ___________
3. ___________

Notes:
___________
___________
```

---

**Last Updated**: 2024
**Status**: Ready for Testing ✅
