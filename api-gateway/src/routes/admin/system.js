const express = require('express');
const router = express.Router();
const dashboardAggregator = require('../../services/aggregator/dashboardAggregator');
const logger = require('../../config/logger');

/**
 * GET /v1/admin/system/health
 * Get health status of all microservices
 * 
 * @access Admin only
 * @returns {Object} Health status for all services
 */
router.get('/health', async (req, res) => {
  const requestId = req.id || 'unknown';
  const startTime = Date.now();
  
  try {
    logger.debug('Fetching system health', {
      requestId,
      userId: req.user?.id,
    });

    const health = await dashboardAggregator.getSystemHealth();
    
    const responseTime = Date.now() - startTime;
    
    // Set appropriate HTTP status based on overall health
    let statusCode = 200;
    if (health.overall === 'critical') {
      statusCode = 503; // Service Unavailable
    } else if (health.overall === 'degraded') {
      statusCode = 207; // Multi-Status
    }

    logger.info('System health retrieved', {
      requestId,
      responseTime,
      overall: health.overall,
      healthyCount: health.healthyCount,
      totalCount: health.totalCount,
    });

    res.status(statusCode).json({
      success: true,
      data: health,
      meta: {
        requestId,
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Failed to get system health', {
      requestId,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      responseTime,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system health',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      meta: {
        requestId,
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /v1/admin/system/info
 * Get system information and configuration
 * 
 * @access Admin only
 * @returns {Object} System information
 */
router.get('/info', async (req, res) => {
  const requestId = req.id || 'unknown';
  
  try {
    const config = require('../../config');
    
    const systemInfo = {
      gateway: {
        name: config.gatewayName,
        version: '1.0.0',
        environment: config.env,
        port: config.port,
        nodeVersion: process.version,
      },
      services: Object.keys(config.services).map(name => ({
        name,
        url: config.services[name].url,
        timeout: config.services[name].timeout,
      })),
      cache: {
        enabled: true,
        host: config.redis.host,
        port: config.redis.port,
        db: config.redis.db,
      },
      uptime: {
        seconds: process.uptime(),
        formatted: formatUptime(process.uptime()),
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    };

    res.json({
      success: true,
      data: systemInfo,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to get system info', {
      requestId,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system information',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Helper function to format uptime
 * @param {number} seconds - Uptime in seconds
 * @returns {string} Formatted uptime string
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

module.exports = router;