

const Reservation = require("../models/reservationModel");
const Product = require("../models/productModel");
const inventoryService = require("../services/inventoryService");

/**
 * POST /api/v1/inventory/reserve
 * Reserve stock before payment
 */
exports.reserveStock = async (req, res) => {
    try {
        const { userId, items } = req.body;

        if (!userId || !items?.length) {
            return res.status(400).json({
                success: false,
                message: "userId and items are required"
            });
        }

        const result = await inventoryService.reserveStock(userId, items);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(200).json(result);

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * POST /api/v1/inventory/confirm
 * Confirm inventory after payment
 */
exports.confirmInventory = async (req, res) => {
    try {
        const { orderId, reservationId } = req.body;

        const reservation = await Reservation.findById(reservationId);
        if (!reservation) 
            return res.status(404).json({ success: false, message: "Reservation not found" });

        if (reservation.status === "confirmed")
            return res.json({ success: true, message: "Already confirmed" });

        for (const item of reservation.items) {
            await Product.updateOne(
                { _id: item.productId },
                { $inc: { stock: -item.quantity } }
            );
        }

        reservation.status = "confirmed";
        reservation.orderId = orderId;
        await reservation.save();

        return res.json({
            success: true,
            message: "Inventory confirmed and stock updated"
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
