# Barcode Scanning System

## Overview
Complete barcode scanning system integrated with AI Shopping Assistant for real-time product lookup via camera.

## Features
- 📷 Camera-based barcode/QR code scanning using html5-qrcode
- 🔍 Real-time product lookup by barcode
- 💬 Integrated with chat assistant for seamless UX
- 🎯 Support for Code128 and other barcode formats
- 📦 Automatic product card display after scan

## Architecture

### Backend Components

#### 1. Product Model
**File:** `backend/models/productModel.js`
- Added `barcode` field (unique, indexed)
- Added `sizes` field for size variants

#### 2. Product Service
**File:** `backend/services/productService.js`
- `findByBarcode(code)` - Lookup product by barcode
- `toPublic(product)` - Format product for API response

#### 3. Barcode Controller
**File:** `backend/controllers/barcodeController.js`
- `getByCode` - GET endpoint to fetch product by barcode code

#### 4. Barcode Routes
**File:** `backend/routes/barcodeRoutes.js`
- Route: `GET /api/v1/barcode/:code`

#### 5. Assistant Controller Enhancement
**File:** `backend/controllers/assistantController.js`
- Handles barcode_scan event type
- Returns product details with reply message

#### 6. Chat Assistant Agent
**File:** `backend/agents/chatAssistantAgent.js`
- Centralized message handling logic
- Intent detection and routing
- Barcode scan event processing

### Frontend Components

#### 1. ChatAssistant Component
**File:** `frontend/src/components/assistant/ChatAssistant.js`

**New Functions:**
- `openScanner()` - Initialize html5-qrcode camera scanner
- `sendBarcodeToChatAssistant(code)` - Alternative method using assistant API

**Features:**
- 📷 Scan button in chat header
- Camera permission handling
- Auto-stop after successful scan
- Error handling for failed scans
- Product card display after scan

### Utilities

#### Barcode Generator Script
**File:** `backend/scripts/generateBarcode.js`

Generate barcodes for products:
```bash
node backend/scripts/generateBarcode.js <productId> <outputPath>
```

**Example:**
```bash
node backend/scripts/generateBarcode.js PRD1023 ./backend/uploads/barcodes/PRD1023.png
```

## Installation

### Backend Dependencies
```bash
cd backend
npm install bwip-js
```

### Frontend Dependencies
```bash
cd frontend
npm install html5-qrcode
```

## Usage

### 1. Generate Barcodes for Products
```bash
# Create barcode directory
mkdir backend/uploads/barcodes

# Generate barcode for a product
node backend/scripts/generateBarcode.js PRODUCT_ID ./backend/uploads/barcodes/PRODUCT_ID.png
```

### 2. Add Barcode to Product
Update product in MongoDB with barcode field:
```javascript
await Product.findByIdAndUpdate(productId, {
  barcode: "PRODUCT_ID"
});
```

### 3. Use Scanner in Chat
1. Open AI Shopping Assistant
2. Click 📷 **Scan** button
3. Allow camera permissions
4. Point camera at barcode
5. Product details appear in chat automatically

### 4. Direct API Access
```javascript
// Lookup product by barcode
GET /api/v1/barcode/:code

// Response
{
  "success": true,
  "product": {
    "_id": "...",
    "name": "Product Name",
    "price": 999,
    "barcode": "PRODUCT_ID",
    "image": "...",
    "stock": 10
  }
}
```

## API Endpoints

### Barcode Lookup
```
GET /api/v1/barcode/:code
```
**Response:**
```json
{
  "success": true,
  "product": {
    "_id": "64abc123...",
    "name": "Laptop XYZ",
    "price": 45000,
    "barcode": "PRD1023",
    "image": "https://...",
    "stock": 5
  }
}
```

### Assistant with Barcode Event
```
POST /api/v1/assistant
```
**Request:**
```json
{
  "message": {
    "type": "barcode_scan",
    "data": "PRD1023"
  }
}
```
**Response:**
```json
{
  "success": true,
  "reply": "Here is what I found for barcode PRD1023:",
  "product": { ... }
}
```

## Supported Barcode Formats
- Code128 (recommended)
- QR Code
- EAN-13
- UPC-A
- Code39
- And more via html5-qrcode

## Camera Permissions
The scanner requires camera access. Users will see a browser permission prompt on first use.

**Troubleshooting:**
- Ensure HTTPS (or localhost) - Camera API requires secure context
- Check browser camera permissions
- Verify camera is not in use by another application

## Database Schema

### Product Schema Update
```javascript
{
  // ... existing fields
  barcode: {
    type: String,
    unique: true,
    sparse: true,  // Allows products without barcodes
    index: true    // Fast lookup
  },
  sizes: {
    type: [String],
    default: []
  }
}
```

## Flow Diagram

```
User clicks Scan button
    ↓
Camera opens (html5-qrcode)
    ↓
User scans barcode
    ↓
Frontend: GET /api/v1/barcode/:code
    ↓
Backend: Product.findOne({ barcode: code })
    ↓
Response with product data
    ↓
Display product card in chat
    ↓
User can Add to Cart
```

## Example Product Setup

```javascript
// Add barcode to existing product
const product = await Product.findById('64abc123...');
product.barcode = 'PRD1023';
product.sizes = ['S', 'M', 'L', 'XL'];
await product.save();

// Generate barcode image
node backend/scripts/generateBarcode.js PRD1023 ./backend/uploads/barcodes/PRD1023.png
```

## Security Notes
- Barcode field has unique constraint to prevent duplicates
- Sparse index allows products without barcodes
- Input sanitization via encodeURIComponent
- Camera access requires user permission

## Future Enhancements
- [ ] Bulk barcode generation for all products
- [ ] Print barcode labels feature
- [ ] Barcode history/analytics
- [ ] Multi-barcode support per product
- [ ] Inventory tracking via barcode scans
- [ ] POS system integration

## Testing

### Test Barcode Lookup
```bash
curl http://localhost:8000/api/v1/barcode/PRD1023
```

### Test Assistant with Barcode
```bash
curl -X POST http://localhost:8000/api/v1/assistant \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "barcode_scan",
      "data": "PRD1023"
    }
  }'
```

## Troubleshooting

### Scanner not opening
- Check camera permissions in browser
- Ensure HTTPS or localhost
- Verify html5-qrcode is installed

### Product not found
- Verify barcode exists in database
- Check barcode string matches exactly
- Ensure Product model has barcode index

### Camera frozen
- Close other apps using camera
- Refresh page
- Check browser console for errors

## Support
For issues or questions, contact support@aura.com
