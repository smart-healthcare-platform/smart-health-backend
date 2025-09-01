const express = require('express');
const router = express.Router();
const { processMessage } = require('../services/chatService');
const { validateChatMessage } = require('../middleware/validation');

router.post('/', validateChatMessage, async (req, res) => {
  try {
    const { message, userId, sessionId, language } = req.body;
    
    const response = await processMessage({
      message,
      userId,
      sessionId,
      language
    });

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router;