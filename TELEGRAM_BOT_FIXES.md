# Telegram Bot Fixes - Summary

## Issues Fixed

### 1. **Multiple Polling Instances (409 Conflict Error)**
**Problem:** 
```
ETELEGRAM: 409 Conflict: terminated by other getUpdates request; make sure that only one bot instance is running
```

**Root Cause:** The bot was starting polling immediately on module load, and if the server restarted or multiple instances were created, it would cause conflicts.

**Solution:**
- Modified `telegramBot.js` to use `polling: false` initially
- Added `startPolling()` function that can be called explicitly
- Added `pollingStarted` flag to prevent duplicate polling
- Server now explicitly calls `startPolling()` after initialization
- Added graceful shutdown handlers (SIGINT, SIGTERM)

**Files Changed:**
- `backend/telegram/telegramBot.js` - Lines 20-50
- `backend/server.js` - Added bot initialization after server starts
- `backend/app.js` - Changed to import only the startPolling function

---

### 2. **Invalid External Image URLs (400 Bad Request)**
**Problem:**
```
[IMAGE] Error sending photo: ETELEGRAM: 400 Bad Request: invalid file HTTP URL specified: Wrong port number specified in the URL
```

**Root Cause:** External URLs from fakestoreapi.com were being sent directly to Telegram Bot API, which:
1. Doesn't accept URLs with incorrect port specifications
2. May reject URLs if the server is unreachable or returns wrong content-type

**Solution:**
- Created `safeSendPhoto()` function with fallback mechanism:
  1. Tries to send photo from URL
  2. If URL fails, checks if it's a local file path and tries that
  3. Falls back to text-only message if both fail
- Updated `buildProductCard()` to handle both external URLs and local paths
- Refactored all photo sending to use the new `safeSendPhoto()` wrapper

**Files Changed:**
- `backend/telegram/telegramBot.js`:
  - New function: `safeSendPhoto()` (Lines ~45-80)
  - Updated: `buildProductCard()` (Lines ~108-150)
  - Updated: `handleProductSearch()` (Lines ~185-210)
  - Updated: callback_query handler for `details_` (Lines ~490-495)
  - Updated: message handler AI response (Lines ~730-740)

---

### 3. **User Not Found Errors**
**Problem:**
```
User not found: 69365f3c1fb137998ebaa8fe
```

**Root Cause:** Invalid user IDs being passed via `/start` command with poor error messaging

**Solution:**
- Improved error message in `/start` command to provide actionable solutions
- Added console error logs for debugging
- Better validation of payload length and format
- User-friendly error message explaining the issue and solutions

**Files Changed:**
- `backend/telegram/telegramBot.js`:
  - Enhanced `/start` command handler (Lines ~415-450)
  - Better error messages and logging

---

## How to Use the Fixed Code

### Starting the Server
```bash
# The bot will automatically start polling when the server starts
npm start
# or
node server.js
```

### Stopping the Server Gracefully
```bash
# Press Ctrl+C to stop the server
# The bot will stop polling before exiting
```

### Environment Variables Needed
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
BACKEND_URL=http://127.0.0.1:8000
FRONTEND_URL=http://127.0.0.1:3000
```

---

## Testing Checklist

- [ ] Server starts without duplicate polling errors
- [ ] Telegram bot receives `/start` command
- [ ] User can connect Telegram from website
- [ ] Product images display (local files)
- [ ] Product images with external URLs show as text fallback
- [ ] User receives proper error message for invalid connect links
- [ ] Bot stops gracefully when server is stopped (Ctrl+C)
- [ ] No "User not found" errors for valid connections

---

## Prevention of Future Issues

1. **Polling Control:** Bot polling is now explicitly controlled, preventing accidental multiple instances
2. **Image Fallback:** Even if images fail to load, users still see product information
3. **Better Logging:** Enhanced console logs help identify issues quickly
4. **Graceful Shutdown:** Proper cleanup on server stop prevents bot conflicts on restart

