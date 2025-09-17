const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');
const { validateChatMessage } = require('../middleware/validation');

router.post('/', validateChatMessage, async (req, res, next) => {
  try {
    const response = await chatService.processMessage(req.body);
    res.status(200).json(response);
  } catch (error) {
    // Pass error to the central error handler in app.js
    next(error);
  }
});

module.exports = router;