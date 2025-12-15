const express = require("express");
const { 
    registerUser, 
    loginUser, 
    logout, 
    forgotPassword, 
    resetPassword, 
    getUserDetails,
    lookupUser 
} = require("../controllers/userController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/authenticate");

const router = express.Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset/:token").put(resetPassword);
router.route("/logout").get(logout);
router.route("/me").get(isAuthenticatedUser, getUserDetails);
router.route("/lookup").get(isAuthenticatedUser, authorizeRoles('admin', 'merchant_admin', 'staff'), lookupUser);
router.route("/telegram/clear-cart").put(isAuthenticatedUser, async (req, res) => {
    try {
        const user = await require('../models/userModel').findById(req.user.id);
        console.log(`[SYNC] clear-cart called for user: ${user ? user._id : 'unknown'}`);
        user.telegramCart = [];
        await user.save();
        return res.json({ success: true, telegramCart: user.telegramCart });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Sync website cart to Telegram
router.route("/telegram/sync-cart").put(isAuthenticatedUser, async (req, res) => {
    try {
        const user = await require('../models/userModel').findById(req.user.id);
        const { items } = req.body; // items from website cart

        console.log(`[SYNC] sync-cart called for user: ${user ? user._id : 'unknown'}, items: ${items ? items.length : 0}`);

        user.telegramCart = (items || []).map(item => ({
            product: item.product,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        }));
        await user.save();
        return res.json({ success: true, telegramCart: user.telegramCart });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
