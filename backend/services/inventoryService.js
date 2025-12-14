
const Reservation = require("../models/reservationModel");
const Product = require("../models/productModel");

/**
 * Reserve stock before payment
 * items = [{ productId, quantity }]
 */
exports.reserveStock = async (userId, items) => {
  try {
    if (!userId || !items?.length) {
      return { success: false, message: "userId and items required" };
    }

    // 1️⃣ Check stock for each item
    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return { success: false, message: `Product not found: ${item.productId}` };
      }

      if (product.stock < item.quantity) {
        return {
          success: false,
          message: `Insufficient stock for product ${product.name}`
        };
      }
    }

    // 2️⃣ Reduce stock temporarily (reserve)
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    // 3️⃣ Create Reservation entry
    const reservation = await Reservation.create({
      user: userId,
      items,
      status: "reserved",
      createdAt: new Date()
    });

    return {
      success: true,
      message: "Stock reserved successfully",
      reservationId: reservation._id,
      reservation
    };

  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Confirm reservation after payment
 */
exports.confirmReservation = async (reservationId, orderId) => {
  try {
    const reservation = await Reservation.findById(reservationId);
    
    if (!reservation) {
      return { success: false, message: "Reservation not found" };
    }

    if (reservation.status === "confirmed") {
      return { success: true, message: "Already confirmed" };
    }

    reservation.status = "confirmed";
    reservation.orderId = orderId;
    await reservation.save();

    return {
      success: true,
      message: "Inventory confirmed successfully"
    };

  } catch (error) {
    return { success: false, message: error.message };
  }
};
