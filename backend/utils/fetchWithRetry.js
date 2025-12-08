// utils/fetchWithRetry.js
const axios = require("axios");

async function fetchWithRetry(url, { retries = 3, timeout = 3000 } = {}) {
  let lastErr = null;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.get(url, { timeout });
      return res.data;
    } catch (err) {
      lastErr = err;
      // exponential backoff
      const backoff = 200 * Math.pow(2, i);
      await new Promise(r => setTimeout(r, backoff));
    }
  }
  throw lastErr;
}

module.exports = fetchWithRetry;
