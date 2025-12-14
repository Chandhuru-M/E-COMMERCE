const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name : {
        type: String,
        required: [true, "Please enter product name"],
        trim: true,
        maxLength: [100, "Product name cannot exceed 100 characters"]
    },
    price: {
        type: Number,
        required: true,
        default: 0.0
    },
    description: {
        type: String,
        required: [true, "Please enter product description"]
    },
    ratings: {
        type: String,
        default: 0
    },
    images: [
        {
            image: {
                type: String,
                required: true
            }
        }
    ],
    category: {
        type: String,
        required: [true, "Please enter product category"],
        enum: {
            values: [
                'Electronics',
                'Mobile Phones',
                'Laptops',
                'Accessories',
                'Headphones',
                'Food',
                'Books',
                'Clothes/Shoes',
                'Beauty/Health',
                'Sports',
                'Outdoor',
                'Home'
            ],
            message : "Please select correct category"
        }
    },
    seller: {
        type: String,
        required: [true, "Please enter product seller"]
    },
    stock: {
        type: Number,
        required: [true, "Please enter product stock"],
        maxLength: [20, 'Product stock cannot exceed 20']
    },
    sizes: {
        type: [String],
        default: []
    },
    barcode: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    numOfReviews: {
        type: Number,
        default: 0
    },
    reviews: [
        {
            user:{
                type:mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            rating: {
                type: String,
                required: true
            },
            comment: {
                type: String,
                required: true
            }
        }
    ],
    user: {
        type : mongoose.Schema.Types.ObjectId
    }
    ,
    createdAt:{
        type: Date,
        default: Date.now()
    },
    merchantId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Merchant",
  required: true
}

})

let schema = mongoose.model('Product', productSchema)

module.exports = schema

function buildProductCard(product) {
  let image = product.images && product.images[0] ? product.images[0].image : null;
  
  // Debug log
  console.log(`[IMAGE] Original path: ${image}`);
  
  // Convert relative path to full URL for Telegram
  if (image && !image.startsWith('http')) {
    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    // Ensure path starts with /
    if (!image.startsWith('/')) {
      image = `/${image}`;
    }
    image = `${backendUrl}${image}`;
    console.log(`[IMAGE] Full URL: ${image}`);
  }
  
  const stock = product.stock > 0 ? `✅ In Stock (${product.stock})` : "❌ Out of Stock";
  const price = product.price ? `$${product.price.toFixed(2)}` : "Price not available";
  
  let text = `*${product.name}*\n\n`;
  text += `💰 Price: ${price}\n`;
  text += `📦 ${stock}\n`;
  text += `📁 Category: ${product.category}\n`;
  if (product.ratings) text += `⭐ Rating: ${product.ratings}\n`;
  text += `\n_${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}_`;

  return {
    text,
    image,
    keyboard: {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🛒 Add to Cart", callback_data: `addcart_${product._id}` },
            { text: "📖 Details", callback_data: `details_${product._id}` }
          ]
        ]
      }
    }
  };
}