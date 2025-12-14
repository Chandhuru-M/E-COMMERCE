# Point of Sale (POS) System - Documentation

## Overview
The POS system allows merchants and staff to scan product barcodes and process walk-in customer purchases through a dedicated interface.

## Features

### 1. Barcode Scanning
- **Camera Scanning**: Use device camera to scan barcodes in real-time
- **Image Upload**: Upload barcode images for scanning
- **Supported Formats**: Code128, EAN-13, EAN-8, UPC-A, UPC-E

### 2. Merchant-Based Cart Management
- Each merchant has their own isolated cart
- Products are added by scanning barcodes
- Quantity automatically increments for duplicate scans
- Real-time cart updates

### 3. Stock Management
- Automatic stock verification before adding items
- Stock reduction on successful checkout
- Out-of-stock prevention

### 4. Order Processing
- Walk-in customer orders (no user account required)
- Multiple payment methods (cash, card, etc.)
- Automatic order creation on checkout

## Backend API Endpoints

### 1. Scan Barcode
**POST** `/api/v1/pos/scan`

**Headers:**
- Authentication required
- Roles: `merchant_admin`, `staff`, `admin`

**Request Body:**
```json
{
  "barcode": "PRD0001",
  "merchantId": "merchant_123"
}
```

**Response:**
```json
{
  "success": true,
  "product": { "name": "Product Name", "price": 99.99, ... },
  "cart": {
    "merchantId": "merchant_123",
    "items": [
      {
        "productId": "...",
        "quantity": 1,
        "price": 99.99
      }
    ]
  }
}
```

### 2. Remove Item
**POST** `/api/v1/pos/remove`

**Headers:**
- Authentication required
- Roles: `merchant_admin`, `staff`, `admin`

**Request Body:**
```json
{
  "productId": "product_id_here",
  "merchantId": "merchant_123"
}
```

**Response:**
```json
{
  "success": true,
  "cart": { ... }
}
```

### 3. Checkout
**POST** `/api/v1/pos/checkout`

**Headers:**
- Authentication required
- Roles: `merchant_admin`, `staff`, `admin`

**Request Body:**
```json
{
  "merchantId": "merchant_123",
  "paymentMethod": "cash"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "_id": "...",
    "orderItems": [...],
    "totalPrice": 199.98,
    "paymentInfo": { "status": "cash" },
    ...
  }
}
```

## Frontend Usage

### Accessing the POS System
Navigate to `/pos` in your application.

### Setup
1. Enter your Merchant ID (stored in localStorage)
2. Click "Scan Barcode" to start camera scanning
3. Alternatively, click "Upload Barcode Image" to scan from a file

### Workflow
1. **Scan Products**: Use camera or upload images to add products to cart
2. **Review Cart**: See all scanned items with quantities and prices
3. **Remove Items**: Click the × button to remove unwanted items
4. **Checkout**: Click "Checkout" button to complete the sale

### Features
- Real-time cart updates
- Running total display
- Stock verification
- Error handling with user-friendly messages

## Database Models

### POSCart Model
```javascript
{
  merchantId: String (required),
  items: [
    {
      productId: ObjectId (ref: 'Product'),
      quantity: Number (default: 1),
      price: Number (required)
    }
  ],
  createdAt: Date
}
```

### Merchant Model
```javascript
{
  storeName: String,
  email: String,
  status: String (default: 'ACTIVE'),
  createdAt: Date
}
```

### Order Model
Extended with:
- `merchantId`: To track which merchant processed the order
- `user`: Set to null for walk-in customers
- `paymentInfo.status`: Contains payment method (e.g., "cash")

## Security & Authentication

### Role-Based Access
- Only users with roles `merchant_admin`, `staff`, or `admin` can access POS endpoints
- Middleware: `isAuthenticatedUser` and `authorizeRoles`

### Merchant Isolation
- Each merchant can only access their own cart
- Cart data is isolated by merchantId

## Real-Time Updates (Socket.IO)

The system emits Socket.IO events for:
- **pos_event**: Broadcasted on scan, remove, and checkout operations
  ```javascript
  {
    type: 'scan' | 'remove' | 'checkout',
    merchantId: '...',
    product: {...}, // on scan
    order: {...}    // on checkout
  }
  ```

## Error Handling

### Common Errors
- **400**: Missing required fields (merchantId, barcode, paymentMethod)
- **404**: Product not found or out of stock
- **500**: Server errors (database issues, etc.)

### Frontend Error Handling
- Camera permission denied
- No camera found
- Camera in use by another app
- Network errors
- Invalid barcode format

## Installation & Setup

### Backend Dependencies
Already included in your project:
- mongoose
- express
- socket.io

### Frontend Dependencies
Already included in your project:
- html5-qrcode
- axios
- react-toastify

### Generate Barcodes for Products
Use the existing barcode generation scripts:
```bash
cd backend
node scripts/addBarcodesToProducts.js
```

## Testing the POS System

1. **Start Backend**: `npm start` in backend directory
2. **Start Frontend**: `npm start` in frontend directory
3. **Login**: Use an account with merchant_admin or staff role
4. **Navigate**: Go to `/pos`
5. **Enter Merchant ID**: Enter your test merchant ID
6. **Scan**: Scan a product barcode (PRD0001 - PRD0011 available)
7. **Checkout**: Complete the purchase

## Troubleshooting

### Camera not working
- Grant camera permissions in browser
- Check if camera is being used by another application
- Try uploading an image instead

### Product not found
- Verify the product has a barcode in the database
- Check if barcode format matches (Code128)
- Ensure product stock > 0

### Authentication errors
- Ensure user is logged in
- Verify user has correct role (merchant_admin/staff/admin)
- Check if JWT token is valid

## Future Enhancements

Possible improvements:
- Receipt printing
- Multiple payment methods (split payments)
- Customer loyalty integration
- Sales analytics dashboard
- Barcode generation for new products
- Offline mode support
- Refund/return processing
