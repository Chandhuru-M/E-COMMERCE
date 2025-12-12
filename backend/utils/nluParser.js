// // utils/nluParser.js
// // Simple rule-based NLP: extracts intent, category, color, price filters, quantity.
// // Extend dictionaries as you go.

// const COLORS = ["white","black","blue","red","green","yellow","brown","pink","gray","grey"];
// const CATEGORIES = [
//   "shirt","tshirt","t-shirt","pants","jeans","watch","shoe","shoes","sneakers","jacket","hoodie","dress","bag","phone","laptop"
// ];

// function extractPriceTokens(text) {
//   const result = {};
//   const lower = text.toLowerCase();
//   // match "under 500", "< 500", "below 500", "max 500"
//   const under = lower.match(/(?:under|below|<|less than|max)\s*₹?\s*([0-9,]+)/);
//   if (under) result.maxPrice = Number(under[1].replace(/,/g,""));
//   const above = lower.match(/(?:above|greater than|>|\bmin\b)\s*₹?\s*([0-9,]+)/);
//   if (above) result.minPrice = Number(above[1].replace(/,/g,""));
//   // match exact price "₹500"
//   const exact = lower.match(/₹\s*([0-9,]+)/);
//   if (exact) result.exactPrice = Number(exact[1].replace(/,/g,""));
//   return result;
// }

// function findInList(words, list) {
//   for (const token of list) {
//     if (words.includes(token)) return token;
//   }
//   return null;
// }

// function normalize(text = "") {
//   return text.normalize("NFKD").replace(/[^a-z0-9₹\s\-]/gi,' ').toLowerCase();
// }

// function parseMessage(text) {
//   const norm = normalize(text);
//   const words = norm.split(/\s+/).filter(Boolean);
//   const color = findInList(words, COLORS);
//   // find categories using simple exact or substring
//   let category = null;
//   for (const c of CATEGORIES) {
//     if (norm.includes(c)) { category = c; break; }
//   }
//   const priceTokens = extractPriceTokens(text);

//   // intent detection: simple heuristics
//   let intent = "unknown";
//   if (/\b(buy|purchase|i want|add to cart|checkout|checkout now|order)\b/.test(norm)) {
//     intent = "purchase";
//   } else if (/\b(show|find|search|look|looking|show me|find me)\b/.test(norm)) {
//     intent = "search";
//   } else if (/\b(return|refund|replace|track|status)\b/.test(norm)) {
//     intent = "postpurchase";
//   }

//   // build query text
//   let queryParts = [];
//   if (color) queryParts.push(color);
//   if (category) queryParts.push(category);
//   // fallback: whole phrase as query if no category/color
//   if (!queryParts.length) queryParts = [text];

//   return {
//     intent,
//     query: queryParts.join(" "),
//     category,
//     color,
//     filters: {
//       minPrice: priceTokens.minPrice ?? null,
//       maxPrice: priceTokens.maxPrice ?? (priceTokens.exactPrice ?? null)
//     }
//   };
// }

// module.exports = { parseMessage };

// utils/nluParser.js
// Improved rule-based NLU for product search
// - plural/singular handling
// - synonyms
// - better price parsing
// - returns a compact query + filters object

const COLORS = ["white","black","blue","red","green","yellow","brown","pink","gray","grey","navy"];
const CATEGORIES = [
  "shirt","tshirt","t-shirt","pants","jeans","watch","shoe","shoes","sneakers",
  "jacket","hoodie","dress","bag","phone","laptop","backpack","saree","kurta","trousers"
];

const SYNONYMS = {
  "sneakers": ["shoe","shoes","sneaker"],
  "tshirt": ["tee","t-shirt","t shirt"],
  "mobile": ["phone","cellphone","smartphone"],
  "bag": ["backpack","purse"]
};

function normalizeText(text = "") {
  return text.normalize("NFKD")
             .replace(/[\u0300-\u036f]/g, "") // remove diacritics
             .replace(/[^a-z0-9₹\s\-\._]/gi, " ")
             .toLowerCase()
             .trim();
}

function cleanNumber(s) {
  if (!s) return null;
  const n = Number(String(s).replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function extractPriceTokens(text) {
  const result = {};
  const lower = text.toLowerCase();

  const under = lower.match(/(?:under|below|<|less than|max)\s*₹?\s*([0-9,]+)/);
  if (under) result.maxPrice = cleanNumber(under[1]);

  const above = lower.match(/(?:above|greater than|>|\bmin\b)\s*₹?\s*([0-9,]+)/);
  if (above) result.minPrice = cleanNumber(above[1]);

  const exact = lower.match(/(?:₹|\b)([0-9,]{2,})\b/);
  if (exact) result.exactPrice = cleanNumber(exact[1]);

  return result;
}

function singularize(word) {
  if (!word) return word;
  if (word.endsWith("ies")) return word.slice(0,-3) + "y";
  if (word.endsWith("es") && word.length > 3) return word.slice(0,-2);
  if (word.endsWith("s") && word.length > 2) return word.slice(0,-1);
  return word;
}

function findCategory(norm) {
  // synonyms
  for (const [canonical, syns] of Object.entries(SYNONYMS)) {
    for (const s of syns) {
      if (norm.includes(s)) return canonical;
    }
  }
  // categories list
  for (const c of CATEGORIES) {
    if (norm.includes(` ${c} `) || norm.includes(`${c}s`) || norm.includes(c)) {
      return singularize(c);
    }
  }
  return null;
}

function findInList(words, list) {
  for (const token of list) {
    if (words.includes(token)) return token;
  }
  return null;
}

function parseMessage(text = "") {
  const norm = normalizeText(text);
  const words = norm.split(/\s+/).filter(Boolean);

  const color = findInList(words, COLORS);
  const category = findCategory(` ${norm} `);
  const priceTokens = extractPriceTokens(text);

  let intent = "unknown";
  if (/\b(buy|purchase|i want|add to cart|checkout|order|pay)\b/.test(norm)) {
    intent = "purchase";
  } else if (/\b(show|find|search|look|looking|show me|find me|list)\b/.test(norm)) {
    intent = "search";
  } else if (/\b(return|refund|replace|track|status)\b/.test(norm)) {
    intent = "postpurchase";
  } else if (/\b(help|hi|hello|hey)\b/.test(norm)) {
    intent = "greeting";
  }

  let queryParts = [];
  if (category) queryParts.push(category);
  if (color) queryParts.push(color);

  // if we produced something concise, use it, otherwise fallback to the full text
  const query = queryParts.length ? queryParts.join(" ") : text.trim();

  return {
    intent,
    query: query || text.trim(),
    category,
    color,
    filters: {
      minPrice: priceTokens.minPrice ?? null,
      maxPrice: priceTokens.maxPrice ?? priceTokens.exactPrice ?? null,
      exactPrice: priceTokens.exactPrice ?? null
    }
  };
}

module.exports = { parseMessage };
