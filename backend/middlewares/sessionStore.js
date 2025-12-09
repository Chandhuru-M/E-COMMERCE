// middlewares/sessionStore.js
// In-memory session store for multi-turn chat. Replace with Redis in production.

const { v4: uuidv4 } = require("uuid");
const TTL_MS = 1000 * 60 * 60 * 4; // 4 hours

const store = new Map();

function createSession(userId, initialContext = {}) {
  const id = uuidv4();
  const payload = { userId, context: initialContext, createdAt: Date.now(), updatedAt: Date.now() };
  store.set(id, payload);
  return id;
}

function getSession(sessionId) {
  const s = store.get(sessionId);
  if (!s) return null;
  if (Date.now() - s.updatedAt > TTL_MS) {
    store.delete(sessionId);
    return null;
  }
  return s;
}

function updateSession(sessionId, patch = {}) {
  const s = getSession(sessionId);
  if (!s) return null;
  s.context = { ...s.context, ...patch };
  s.updatedAt = Date.now();
  store.set(sessionId, s);
  return s;
}

function destroySession(sessionId) {
  store.delete(sessionId);
}

module.exports = { createSession, getSession, updateSession, destroySession };
