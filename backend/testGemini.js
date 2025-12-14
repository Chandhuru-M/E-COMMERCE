
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, 'config/config.env') });

async function testGemini() {
  console.log("Testing Gemini API...");
  console.log("API Key present:", !!process.env.GEMINI_API_KEY);

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // const prompt = "Hello, are you working?";
    // console.log(`Sending prompt: "${prompt}"`);

    // const result = await model.generateContent(prompt);
    // const response = await result.response;
    // const text = response.text();

    // console.log("Response received:");
    // console.log(text);
    // console.log("✅ Gemini API is working correctly.");

    // List models
    console.log("Listing available models...");
    // Note: The SDK might not expose listModels directly on the instance easily without looking at docs, 
    // but usually it's on the class or a manager. 
    // Actually, for GoogleGenerativeAI, it's not directly on the client instance in the simple usage.
    // Let's try to just use a known stable model "gemini-1.0-pro" or "gemini-1.5-flash-001"
    
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" }); 
    // Wait, I tried gemini-1.5-flash and it failed. 
    // Let's try "gemini-1.5-flash-latest"
    
    const result = await model.generateContent("test");
    console.log(result.response.text());

  } catch (error) {
    console.error("❌ Gemini API Error:", error.message);
    // ...
  }
}

testGemini();
