const express = require('express');
const router = express.Router();
const sessionService = require('../services/sessionService');

router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    await sessionService.deleteSession(sessionId);
    
    res.status(200).json({
      message: 'Session deleted successfully',
      sessionId
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete session',
      details: error.message
    });
  }
});

module.exports = router;