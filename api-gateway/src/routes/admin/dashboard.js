const express = require('express');
const router = express.Router();
const dashboardAggregator = require('../../services/aggregator/dashboardAggregator');
const logger = require('../../config/logger');

/**
 * GET /v1/admin/dashboard/stats
 * Get aggregated dashboard statistics from all services
 * 
 * @access Admin only
 * @returns {Object} Aggregated stats with KPIs and detailed data
 */
router.get('/stats', async (req, res) => {
  const requestId = req.id || 'unknown';
  const startTime = Date.now();
  
  try {
    logger.info('Fetching dashboard stats', {
      requestId,
      userId: req.user?.id,
      userEmail: req.user?.email,
    });

    const stats = await dashboardAggregator.getDashboardStats();
    
    const responseTime = Date.now() - startTime;
    
    logger.info('Dashboard stats retrieved successfully', {
      requestId,
      responseTime,
      fromCache: stats.fromCache,
      partial: stats.partial,
    });

    res.json({
      success: true,
      data: stats,
      meta: {
        requestId,
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Failed to get dashboard stats', {
      requestId,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      responseTime,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics',
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
 * POST /v1/admin/dashboard/refresh
 * Force refresh dashboard stats (invalidate cache)
 * 
 * @access Admin only
 * @returns {Object} Confirmation message
 */
router.post('/refresh', async (req, res) => {
  const requestId = req.id || 'unknown';
  
  try {
    logger.info('Force refresh dashboard stats requested', {
      requestId,
      userId: req.user?.id,
      userEmail: req.user?.email,
    });

    // Invalidate cache
    const deletedKeys = await dashboardAggregator.invalidateCache('admin:stats:*');
    
    logger.info('Dashboard cache invalidated', {
      requestId,
      deletedKeys,
    });

    res.json({
      success: true,
      message: 'Dashboard cache invalidated successfully',
      data: {
        deletedKeys,
        action: 'cache_invalidated',
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to refresh dashboard', {
      requestId,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to refresh dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /v1/admin/dashboard/cache-stats
 * Get cache statistics
 * 
 * @access Admin only
 * @returns {Object} Cache statistics
 */
router.get('/cache-stats', async (req, res) => {
  const requestId = req.id || 'unknown';
  
  try {
    logger.debug('Fetching cache stats', { requestId });

    const cacheStats = await dashboardAggregator.getCacheStats();
    
    res.json({
      success: true,
      data: cacheStats,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to get cache stats', {
      requestId,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cache statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

module.exports = router;