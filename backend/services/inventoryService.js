
// const axios = require("axios");
// const Redis = require("ioredis");
// const Product = require("../models/productModel");
// const Reservation = require("../models/reservationModel");

// const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

// const LOCK_TTL = 5000;

// // ====================== REDIS LOCK ====================== //
// async function acquireLock(key, ttl = LOCK_TTL) {
//   const token = `${Date.now()}_${Math.random()}`;
//   const ok = await redis.set(key, token, "PX", ttl, "NX");
//   return ok ? token : null;
// }

// async function releaseLock(key, token) {
//   const lua = `
//     if redis.call("get",KEYS[1]) == ARGV[1] then
//       return redis.call("del",KEYS[1])
//     else
//       return 0
//     end
//   `;
//   await redis.eval(lua, 1, key, token);
// }

// // ========= FAKESTORE API FALLBACK ========== //
// async function fetchFromFakeStore(productId) {
//   try {
//     const resp = await axios.get(`https://fakestoreapi.com/products/${productId}`);
//     const p = resp.data;

//     const newProduct = await Product.create({
//       name: p.title,
//       description: p.description,
//       price: p.price,
//       category: p.category,
//       stock: 20,
//       images: [{ url: p.image }],
//     });

//     return newProduct;
//   } catch (err) {
//     return null;
//   }
// }

// // ====================== MAIN SERVICE ====================== //
// module.exports = {
//   // --------- DB → FakeStore fallback --------- //
//   getProduct: async (productId) => {
//     let product = await Product.findById(productId);

//     if (!product) {
//       console.log("⚠ Product missing → Fetching from FakeStore...");
//       product = await fetchFromFakeStore(productId);
//     }

//     return product;
//   },

//   // --------- Check Stock --------- //
//   checkStock: async (productId, qty) => {
//     const product = await module.exports.getProduct(productId);

//     if (!product) {
//       return { success: false, message: "Product not found" };
//     }

//     if (product.stock < qty) {
//       return {
//         success: true,
//         inStock: false,
//         availableStock: product.stock,
//       };
//     }

//     return {
//       success: true,
//       inStock: true,
//       availableStock: product.stock,
//     };
//   },

//   // --------- Reserve Stock (NO TRANSACTIONS!) --------- //
//   reserveStock: async (userId, items) => {
//     try {
//       // Create reservation FIRST
//       const reservation = await Reservation.create({
//         user: userId,
//         items,
//         status: "RESERVED",
//         expiresAt: new Date(Date.now() + 15 * 60 * 1000),
//       });

//       // Lock & reduce stock per item
//       for (const it of items) {
//         const lockKey = `lock:product:${it.productId}`;
//         const token = await acquireLock(lockKey);

//         if (!token) throw new Error("⚠ High load, try again");

//         try {
//           let product = await module.exports.getProduct(it.productId);

//           if (!product) throw new Error("Product missing");

//           if (product.stock < it.qty)
//             throw new Error(`Not enough stock for ${product._id}`);

//           // reduce stock
//           product.stock -= it.qty;
//           await product.save();

//         } finally {
//           await releaseLock(lockKey, token);
//         }
//       }

//       return {
//         success: true,
//         reservationId: reservation._id,
//         expiresAt: reservation.expiresAt,
//       };

//     } catch (err) {
//       return { success: false, message: err.message };
//     }
//   },

//   // ------------ Confirm Reservation ------------ //
//   confirmReservation: async (reservationId, orderId) => {
//     const r = await Reservation.findById(reservationId);
//     if (!r) return { success: false, message: "Reservation not found" };

//     if (r.status !== "RESERVED")
//       return { success: false, message: "Cannot confirm" };

//     r.status = "CONFIRMED";
//     r.orderId = orderId;
//     await r.save();

//     return { success: true };
//   },

//   // ------------ Release Reservation ------------ //
//   releaseReservation: async (reservationId) => {
//     try {
//       const r = await Reservation.findById(reservationId);
//       if (!r) return { success: false, message: "Reservation not found" };

//       if (r.status !== "RESERVED") {
//         return { success: false, message: "Not cancellable" };
//       }

//       // Add stock back
//       for (const it of r.items) {
//         const product = await Product.findById(it.productId);
//         if (product) {
//           product.stock += it.qty;
//           await product.save();
//         }
//       }

//       r.status = "CANCELLED";
//       await r.save();

//       return { success: true };

//     } catch (err) {
//       return { success: false, message: err.message };
//     }
//   },
// };
const Product = require("../models/productModel");

async function reserveStock(userId, items) {
  let reserved = [];

  for (let it of items) {
    const product = await Product.findById(it.productId);

    if (!product) {
      return {
        success: false,
        message: `Product with ID ${it.productId} not found in DB`
      };
    }

    if (product.stock < it.qty) {
      return {
        success: false,
        message: `${product.name} is out of stock`
      };
    }

    // Deduct stock
    product.stock -= it.qty;
    await product.save({ validateBeforeSave: false });

    reserved.push({
      productId: product._id,
      name: product.name,
      qty: it.qty,
      price: product.price,
      remainingStock: product.stock
    });
  }

  return { success: true, reserved };
}

module.exports = {
  reserveStock
};
