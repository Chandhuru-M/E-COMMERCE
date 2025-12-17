const Config = require('../models/configModel');
const catchAsyncError = require('../middlewares/catchAsyncError');
const ErrorHandler = require('../utils/errorHandler');

// Update or Create Gemini API Key - /api/v1/admin/config/gemini
exports.updateGeminiApiKey = catchAsyncError(async (req, res, next) => {
    const { geminiApiKey } = req.body;

    if (!geminiApiKey) {
        return next(new ErrorHandler('Please provide the Gemini API Key', 400));
    }

    // We assume there is only one config document.
    // Try to find one, if not create it.
    let config = await Config.findOne();

    if (!config) {
        config = await Config.create({ geminiApiKey });
    } else {
        config.geminiApiKey = geminiApiKey;
        config.updatedAt = Date.now();
        await config.save();
    }

    res.status(200).json({
        success: true,
        message: 'Gemini API Key updated successfully'
    });
});

// Get Config Status (Admin) - /api/v1/admin/config
exports.getConfig = catchAsyncError(async (req, res, next) => {
    const config = await Config.findOne();

    res.status(200).json({
        success: true,
        hasGeminiKey: !!config && !!config.geminiApiKey
    });
});
