const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
    geminiApiKey: {
        type: String,
        required: [true, 'Please enter the Gemini API Key'],
        select: false // Security: don't return it in normal queries unless explicitly asked
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Config', configSchema);
