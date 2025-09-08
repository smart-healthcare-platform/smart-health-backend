const express = require('express');
const router = express.Router();
const { getConversationHistory } = require('../services/historyService');

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const history = await getConversationHistory(userId, parseInt(limit), parseInt(offset));
    
    res.status(200).json({
      userId,
      conversations: history
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve conversation history',
      details: error.message
    });
  }
});

module.exports = router;