
// const InventoryService = require("../services/inventoryService");

// module.exports = {
//   checkStock: async (req, res) => {
//     const { productId, qty } = req.body;
//     const result = await InventoryService.checkStock(productId, qty);
//     res.json(result);
//   },

//   reserveStock: async (req, res) => {
//     const { userId, items } = req.body;
//     const result = await InventoryService.reserveStock(userId, items);
//     res.json(result);
//   },

//   confirmReservation: async (req, res) => {
//     const { reservationId, orderId } = req.body;
//     const result = await InventoryService.confirmReservation(reservationId, orderId);
//     res.json(result);
//   },

//   releaseReservation: async (req, res) => {
//     const { reservationId } = req.body;
//     const result = await InventoryService.releaseReservation(reservationId);
//     res.json(result);
//   },
// };


// const inventoryService = require("../services/inventoryService");

// exports.reserveStockController = async (req, res) => {
//   try {
//     const { userId, items } = req.body;

//     if (!userId || !items?.length) {
//       return res.status(400).json({
//         success: false,
//         message: "userId and items are required"
//       });
//     }

//     const result = await inventoryService.reserveStock(userId, items);

//     if (!result.success) {
//       return res.status(400).json(result);
//     }

//     res.status(200).json(result);

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };


const inventoryService = require("../services/inventoryService");

exports.reserveStockController = async (req, res) => {
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
