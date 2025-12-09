// utils/nluParser.js
// Simple rule-based NLP: extracts intent, category, color, price filters, quantity.
// Extend dictionaries as you go.

const COLORS = ["white","black","blue","red","green","yellow","brown","pink","gray","grey"];
const CATEGORIES = [
  "shirt","tshirt","t-shirt","pants","jeans","watch","shoe","shoes","sneakers","jacket","hoodie","dress","bag","phone","laptop"
];

function extractPriceTokens(text) {
  const result = {};
  const lower = text.toLowerCase();
  // match "under 500", "< 500", "below 500", "max 500"
  const under = lower.match(/(?:under|below|<|less than|max)\s*₹?\s*([0-9,]+)/);
  if (under) result.maxPrice = Number(under[1].replace(/,/g,""));
  const above = lower.match(/(?:above|greater than|>|\bmin\b)\s*₹?\s*([0-9,]+)/);
  if (above) result.minPrice = Number(above[1].replace(/,/g,""));
  // match exact price "₹500"
  const exact = lower.match(/₹\s*([0-9,]+)/);
  if (exact) result.exactPrice = Number(exact[1].replace(/,/g,""));
  return result;
}

function findInList(words, list) {
  for (const token of list) {
    if (words.includes(token)) return token;
  }
  return null;
}

function normalize(text = "") {
  return text.normalize("NFKD").replace(/[^a-z0-9₹\s\-]/gi,' ').toLowerCase();
}

function parseMessage(text) {
  const norm = normalize(text);
  const words = norm.split(/\s+/).filter(Boolean);
  const color = findInList(words, COLORS);
  // find categories using simple exact or substring
  let category = null;
  for (const c of CATEGORIES) {
    if (norm.includes(c)) { category = c; break; }
  }
  const priceTokens = extractPriceTokens(text);

  // intent detection: simple heuristics
  let intent = "unknown";
  if (/\b(buy|purchase|i want|add to cart|checkout|checkout now|order)\b/.test(norm)) {
    intent = "purchase";
  } else if (/\b(show|find|search|look|looking|show me|find me)\b/.test(norm)) {
    intent = "search";
  } else if (/\b(return|refund|replace|track|status)\b/.test(norm)) {
    intent = "postpurchase";
  }

  // build query text
  let queryParts = [];
  if (color) queryParts.push(color);
  if (category) queryParts.push(category);
  // fallback: whole phrase as query if no category/color
  if (!queryParts.length) queryParts = [text];

  return {
    intent,
    query: queryParts.join(" "),
    category,
    color,
    filters: {
      minPrice: priceTokens.minPrice ?? null,
      maxPrice: priceTokens.maxPrice ?? (priceTokens.exactPrice ?? null)
    }
  };
}

module.exports = { parseMessage };
