# How to Generate Product Barcodes

## 🚨 Camera Permission Issue
**Error:** "NotAllowedError: Permission dismissed"

**Solution:**
1. **Allow camera access** in your browser
2. Click the 🔒 lock icon in address bar
3. Find "Camera" permission → Set to "Allow"
4. Refresh the page and try scanning again

**Alternative:** Use HTTPS instead of HTTP (cameras require secure context)

---

## 📦 Generate Barcodes for ALL Products

### Option 1: Automatic Bulk Generation (Recommended)

Run this script to add barcodes to all products at once:

```bash
cd backend
node scripts/addBarcodesToProducts.js
```

This will:
- ✅ Connect to your MongoDB database
- ✅ Find all products without barcodes
- ✅ Generate unique barcode codes (PRD0001, PRD0002, etc.)
- ✅ Create barcode PNG images in `backend/uploads/barcodes/`
- ✅ Update products in database with barcode field

**Output:**
```
✅ Connected to database
📦 Found 25 products without barcodes

✅ 1. Laptop XYZ -> PRD0001
✅ 2. Phone ABC -> PRD0002
✅ 3. Headphones DEF -> PRD0003
...

🎉 Successfully added barcodes to 25 products!
📁 Barcode images saved to: C:\...\backend\uploads\barcodes
```

---

### Option 2: Generate Single Product Barcode

For individual products:

```bash
node scripts/generateBarcode.js <BARCODE_CODE> <OUTPUT_PATH>
```

**Example:**
```bash
node scripts/generateBarcode.js PRD0001 ./uploads/barcodes/PRD0001.png
```

Then manually update the product in MongoDB:
```javascript
db.products.updateOne(
  { _id: ObjectId("...") },
  { $set: { barcode: "PRD0001" } }
)
```

---

## 🔍 Test Barcode Scanning

### 1. Print or Display Barcode
- Open the generated PNG file: `backend/uploads/barcodes/PRD0001.png`
- Display it on your phone or print it

### 2. Use in ChatBot
1. Open AI Shopping Assistant
2. Click 📷 **Scan** button
3. Allow camera permissions
4. Point camera at the barcode
5. Product appears in chat!

### 3. Test API Directly
```bash
curl http://localhost:8000/api/v1/barcode/PRD0001
```

Response:
```json
{
  "success": true,
  "product": {
    "_id": "693b9cf1472d38d4a496c4b3",
    "name": "Mens Cotton Jacket",
    "price": 55.99,
    "barcode": "PRD0001",
    "stock": 20
  }
}
```

---

## 🎯 Your Current Product
From the screenshot, your product has:
- **ID:** `693b9cf1472d38d4a496c4b3`
- **Name:** "Mens Cotton Jacket"
- **Price:** $55.99

### To add barcode to this specific product:

**Method 1: Using the bulk script**
```bash
node scripts/addBarcodesToProducts.js
```

**Method 2: Manually**
```bash
# Generate barcode image
node scripts/generateBarcode.js JACKET001 ./uploads/barcodes/JACKET001.png

# Then update in MongoDB Compass or Shell:
db.products.updateOne(
  { _id: ObjectId("693b9cf1472d38d4a496c4b3") },
  { $set: { barcode: "JACKET001" } }
)
```

---

## 📁 Where Barcodes are Stored

### Generated Images:
```
backend/uploads/barcodes/
├── PRD0001.png
├── PRD0002.png
├── PRD0003.png
└── ...
```

### Database:
Each product document now has:
```javascript
{
  _id: "...",
  name: "Product Name",
  price: 99.99,
  barcode: "PRD0001",  // ← New field
  sizes: ["S", "M", "L"],  // ← New field
  // ... other fields
}
```

---

## 🛠️ Troubleshooting

### Camera not working?
1. **Browser Settings:** chrome://settings/content/camera
2. **HTTPS Required:** Cameras only work on HTTPS or localhost
3. **Check other apps:** Close apps using camera
4. **Browser support:** Use Chrome, Edge, or Safari

### Barcode not found?
1. **Check database:** Product must have `barcode` field
2. **Run script:** `node scripts/addBarcodesToProducts.js`
3. **Verify code:** Barcode code must match exactly

### Script errors?
1. **Install dependencies:** `npm install bwip-js`
2. **Check MongoDB:** Ensure database is running
3. **Config file:** Verify `config/config.env` has DB_LOCAL_URI

---

## 📝 Custom Barcode Formats

Edit `addBarcodesToProducts.js` to customize barcode format:

```javascript
// Current format: PRD0001, PRD0002
const barcodeCode = `PRD${String(count + 1).padStart(4, '0')}`;

// Alternative formats:
const barcodeCode = `SHOP-${product._id.toString().slice(-8)}`;  // SHOP-96c4b3
const barcodeCode = `${product.category.substring(0,3).toUpperCase()}${count}`;  // ELE1, ELE2
const barcodeCode = Date.now() + count;  // Timestamp-based
```

---

## ✅ Quick Start Checklist

- [ ] Install dependencies: `npm install bwip-js`
- [ ] Run: `node scripts/addBarcodesToProducts.js`
- [ ] Check: `backend/uploads/barcodes/` for PNG files
- [ ] Verify: Products have `barcode` field in database
- [ ] Allow camera permissions in browser
- [ ] Open ChatBot → Click 📷 Scan
- [ ] Scan a barcode → See product appear!

---

Need help? The barcode generation scripts are at:
- **Generator:** `backend/scripts/generateBarcode.js`
- **Bulk Add:** `backend/scripts/addBarcodesToProducts.js`
