const express = require("express");
const router = express.Router();

router.get("/connect", (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).send("Missing userId");
  }

  const botUsername = process.env.TELEGRAM_BOT_USERNAME; // add in .env

  if (!botUsername) {
    return res.status(500).send("Bot username not configured");
  }

  const link = `https://t.me/${botUsername}?start=${userId}`;

  res.send(`
    <html>
      <head>
        <title>Connect Telegram</title>
      </head>
      <body style="font-family: Arial; padding: 40px;">
        <h2>Connect Your Telegram</h2>
        <a href="${link}" style="
          background:#0088cc; 
          padding: 12px 20px; 
          color: white; 
          text-decoration:none; 
          border-radius:5px;
          font-size:18px;">
          Connect Telegram
        </a>
      </body>
    </html>
  `);
});

module.exports = router;
