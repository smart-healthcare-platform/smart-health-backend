const express = require('express');
const router = express.Router();
const { checkHealth } = require('../services/healthService');

router.get('/', async (req, res) => {
  try {
    const healthStatus = await checkHealth();
    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;