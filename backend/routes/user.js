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

module.exports = router;
