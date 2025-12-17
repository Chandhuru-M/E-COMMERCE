const express = require('express');
const router = express.Router();
const { updateGeminiApiKey, getConfig } = require('../controllers/configController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');

router.route('/admin/config/gemini').put(isAuthenticatedUser, authorizeRoles('admin'), updateGeminiApiKey);
router.route('/admin/config').get(isAuthenticatedUser, authorizeRoles('admin'), getConfig);

module.exports = router;
