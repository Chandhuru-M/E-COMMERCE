const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, 'config/config.env') });

console.log("Checking Environment Variables...");
console.log("GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY) {
    console.log("GEMINI_API_KEY length:", process.env.GEMINI_API_KEY.length);
    console.log("GEMINI_API_KEY starts with:", process.env.GEMINI_API_KEY.substring(0, 4));
} else {
    console.log("GEMINI_API_KEY is MISSING!");
}
