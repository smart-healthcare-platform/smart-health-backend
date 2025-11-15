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

/**
 * GET /v1/admin/dashboard/appointments/trends
 * Get appointment trends data
 * 
 * @query period - Time period: 'daily', 'weekly', or 'monthly' (default: 'daily')
 * @query days - Number of days to look back (default: 30)
 * @access Admin only
 * @returns {Object} Appointment trends data
 */
router.get('/appointments/trends', async (req, res) => {
  const requestId = req.id || 'unknown';
  const startTime = Date.now();
  
  try {
    const { period = 'daily', days = 30 } = req.query;
    
    logger.info('Fetching appointment trends', {
      requestId,
      period,
      days,
      userId: req.user?.id,
    });

    const trends = await dashboardAggregator.getAppointmentTrends(period, parseInt(days));
    
    const responseTime = Date.now() - startTime;
    
    logger.info('Appointment trends retrieved successfully', {
      requestId,
      responseTime,
      fromCache: trends?.fromCache,
    });

    res.json({
      success: true,
      data: trends,
      meta: {
        requestId,
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Failed to get appointment trends', {
      requestId,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      responseTime,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointment trends',
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
 * GET /v1/admin/dashboard/appointments/distribution
 * Get appointment status distribution
 * 
 * @access Admin only
 * @returns {Object} Status distribution data
 */
router.get('/appointments/distribution', async (req, res) => {
  const requestId = req.id || 'unknown';
  const startTime = Date.now();
  
  try {
    logger.info('Fetching appointment distribution', {
      requestId,
      userId: req.user?.id,
    });

    const distribution = await dashboardAggregator.getAppointmentDistribution();
    
    const responseTime = Date.now() - startTime;
    
    logger.info('Appointment distribution retrieved successfully', {
      requestId,
      responseTime,
      fromCache: distribution?.fromCache,
    });

    res.json({
      success: true,
      data: distribution,
      meta: {
        requestId,
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Failed to get appointment distribution', {
      requestId,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      responseTime,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointment distribution',
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
 * GET /v1/admin/dashboard/appointments/recent
 * Get recent appointments
 * 
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10)
 * @access Admin only
 * @returns {Object} Recent appointments data
 */
router.get('/appointments/recent', async (req, res) => {
  const requestId = req.id || 'unknown';
  const startTime = Date.now();
  
  try {
    const { page = 1, limit = 10 } = req.query;
    
    logger.info('Fetching recent appointments', {
      requestId,
      page,
      limit,
      userId: req.user?.id,
    });

    const recent = await dashboardAggregator.getRecentAppointments(parseInt(page), parseInt(limit));
    
    const responseTime = Date.now() - startTime;
    
    logger.info('Recent appointments retrieved successfully', {
      requestId,
      responseTime,
      fromCache: recent?.fromCache,
    });

    res.json({
      success: true,
      data: recent,
      meta: {
        requestId,
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Failed to get recent appointments', {
      requestId,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      responseTime,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent appointments',
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
 * GET /v1/admin/dashboard/patients/growth
 * Get patient growth trends
 * 
 * @query period - Time period: 'daily', 'weekly', or 'monthly' (default: 'daily')
 * @query days - Number of days to look back (default: 30)
 * @access Admin only
 * @returns {Object} Patient growth data
 */
router.get('/patients/growth', async (req, res) => {
  const requestId = req.id || 'unknown';
  const startTime = Date.now();
  
  try {
    const { period = 'daily', days = 30 } = req.query;
    
    logger.info('Fetching patient growth', {
      requestId,
      period,
      days,
      userId: req.user?.id,
    });

    const growth = await dashboardAggregator.getPatientGrowth(period, parseInt(days));
    
    const responseTime = Date.now() - startTime;
    
    logger.info('Patient growth retrieved successfully', {
      requestId,
      responseTime,
      fromCache: growth?.fromCache,
    });

    res.json({
      success: true,
      data: growth,
      meta: {
        requestId,
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Failed to get patient growth', {
      requestId,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      responseTime,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve patient growth',
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
 * GET /v1/admin/dashboard/patients/demographics
 * Get patient demographics
 * 
 * @access Admin only
 * @returns {Object} Patient demographics data
 */
router.get('/patients/demographics', async (req, res) => {
  const requestId = req.id || 'unknown';
  const startTime = Date.now();
  
  try {
    logger.info('Fetching patient demographics', {
      requestId,
      userId: req.user?.id,
    });

    const demographics = await dashboardAggregator.getPatientDemographics();
    
    const responseTime = Date.now() - startTime;
    
    logger.info('Patient demographics retrieved successfully', {
      requestId,
      responseTime,
      fromCache: demographics?.fromCache,
    });

    res.json({
      success: true,
      data: demographics,
      meta: {
        requestId,
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Failed to get patient demographics', {
      requestId,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      responseTime,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve patient demographics',
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
 * GET /v1/admin/dashboard/patients/recent
 * Get recent patients
 * 
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10)
 * @access Admin only
 * @returns {Object} Recent patients data
 */
router.get('/patients/recent', async (req, res) => {
  const requestId = req.id || 'unknown';
  const startTime = Date.now();
  
  try {
    const { page = 1, limit = 10 } = req.query;
    
    logger.info('Fetching recent patients', {
      requestId,
      page,
      limit,
      userId: req.user?.id,
    });

    const recent = await dashboardAggregator.getRecentPatients(parseInt(page), parseInt(limit));
    
    const responseTime = Date.now() - startTime;
    
    logger.info('Recent patients retrieved successfully', {
      requestId,
      responseTime,
      fromCache: recent?.fromCache,
    });

    res.json({
      success: true,
      data: recent,
      meta: {
        requestId,
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Failed to get recent patients', {
      requestId,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      responseTime,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent patients',
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
 * GET /v1/admin/dashboard/doctors/stats
 * Get overall doctor statistics
 * 
 * @access Admin only
 * @returns {Object} Doctor statistics data
 */
router.get('/doctors/stats', async (req, res) => {
  const requestId = req.id || 'unknown';
  const startTime = Date.now();
  
  try {
    logger.info('Fetching doctor statistics', {
      requestId,
      userId: req.user?.id,
    });

    const stats = await dashboardAggregator.getDoctorStats();
    
    const responseTime = Date.now() - startTime;
    
    logger.info('Doctor stats retrieved successfully', {
      requestId,
      responseTime,
      fromCache: stats?.fromCache,
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
    
    logger.error('Failed to get doctor stats', {
      requestId,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      responseTime,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctor statistics',
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
 * GET /v1/admin/dashboard/doctors/top
 * Get top doctors by various metrics
 * 
 * @query limit - Number of top doctors to return (default: 10)
 * @access Admin only
 * @returns {Object} Top doctors data
 */
router.get('/doctors/top', async (req, res) => {
  const requestId = req.id || 'unknown';
  const startTime = Date.now();
  
  try {
    const { limit = 10 } = req.query;
    
    logger.info('Fetching top doctors', {
      requestId,
      limit,
      userId: req.user?.id,
    });

    const topDoctors = await dashboardAggregator.getTopDoctors(parseInt(limit));
    
    const responseTime = Date.now() - startTime;
    
    logger.info('Top doctors retrieved successfully', {
      requestId,
      responseTime,
      fromCache: topDoctors?.fromCache,
    });

    res.json({
      success: true,
      data: topDoctors,
      meta: {
        requestId,
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Failed to get top doctors', {
      requestId,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      responseTime,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve top doctors',
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
 * GET /v1/admin/dashboard/doctors/departments/performance
 * Get department/specialty performance metrics
 * 
 * @access Admin only
 * @returns {Object} Department performance data
 */
router.get('/doctors/departments/performance', async (req, res) => {
  const requestId = req.id || 'unknown';
  const startTime = Date.now();
  
  try {
    logger.info('Fetching department performance', {
      requestId,
      userId: req.user?.id,
    });

    const performance = await dashboardAggregator.getDepartmentPerformance();
    
    const responseTime = Date.now() - startTime;
    
    logger.info('Department performance retrieved successfully', {
      requestId,
      responseTime,
      fromCache: performance?.fromCache,
    });

    res.json({
      success: true,
      data: performance,
      meta: {
        requestId,
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Failed to get department performance', {
      requestId,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      responseTime,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve department performance',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      meta: {
        requestId,
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// ==================== Revenue Analytics Routes ====================

/**
 * GET /api/admin/dashboard/revenue/analytics
 * Get comprehensive revenue analytics (stats, distribution, trends, payment methods)
 */
router.get('/revenue/analytics', async (req, res) => {
  const requestId = req.id || Math.random().toString(36).substring(7);
  const startTime = Date.now();

  try {
    logger.info('Admin dashboard: Get revenue analytics', {
      requestId,
      userId: req.user?.id,
      userEmail: req.user?.email,
    });

    const analytics = await dashboardAggregator.getRevenueAnalytics();
    const responseTime = Date.now() - startTime;

    logger.info('Revenue analytics retrieved successfully', {
      requestId,
      responseTime,
      fromCache: analytics.fromCache,
    });

    res.json({
      success: true,
      data: analytics,
      meta: {
        requestId,
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Failed to retrieve revenue analytics', {
      requestId,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      responseTime,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve revenue analytics',
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
 * GET /api/admin/dashboard/revenue/stats
 * Get revenue statistics only
 */
router.get('/revenue/stats', async (req, res) => {
  const requestId = req.id || Math.random().toString(36).substring(7);
  const startTime = Date.now();

  try {
    logger.info('Admin dashboard: Get revenue stats', {
      requestId,
      userId: req.user?.id,
    });

    const stats = await dashboardAggregator.getRevenueStats();
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: stats,
      meta: {
        requestId,
        responseTime,
        fromCache: stats.fromCache,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Failed to retrieve revenue stats', {
      requestId,
      error: error.message,
      responseTime,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve revenue stats',
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
 * GET /api/admin/dashboard/revenue/distribution
 * Get revenue distribution by payment methods, types, and status
 */
router.get('/revenue/distribution', async (req, res) => {
  const requestId = req.id || Math.random().toString(36).substring(7);
  const startTime = Date.now();

  try {
    logger.info('Admin dashboard: Get revenue distribution', {
      requestId,
      userId: req.user?.id,
    });

    const distribution = await dashboardAggregator.getRevenueDistribution();
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: distribution,
      meta: {
        requestId,
        responseTime,
        fromCache: distribution.fromCache,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Failed to retrieve revenue distribution', {
      requestId,
      error: error.message,
      responseTime,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve revenue distribution',
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
 * GET /api/admin/dashboard/revenue/trends
 * Get revenue trends over time
 * Query params: period (DAILY/WEEKLY/MONTHLY/YEARLY), days (number)
 */
router.get('/revenue/trends', async (req, res) => {
  const requestId = req.id || Math.random().toString(36).substring(7);
  const startTime = Date.now();

  try {
    const { period = 'DAILY', days = 30 } = req.query;

    logger.info('Admin dashboard: Get revenue trends', {
      requestId,
      userId: req.user?.id,
      period,
      days,
    });

    const trends = await dashboardAggregator.getRevenueTrends(period, parseInt(days));
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: trends,
      meta: {
        requestId,
        responseTime,
        fromCache: trends.fromCache,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Failed to retrieve revenue trends', {
      requestId,
      error: error.message,
      responseTime,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve revenue trends',
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
 * GET /api/admin/dashboard/payment-methods/stats
 * Get payment method statistics
 */
router.get('/payment-methods/stats', async (req, res) => {
  const requestId = req.id || Math.random().toString(36).substring(7);
  const startTime = Date.now();

  try {
    logger.info('Admin dashboard: Get payment method stats', {
      requestId,
      userId: req.user?.id,
    });

    const stats = await dashboardAggregator.getPaymentMethodStats();
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: stats,
      meta: {
        requestId,
        responseTime,
        fromCache: stats.fromCache,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Failed to retrieve payment method stats', {
      requestId,
      error: error.message,
      responseTime,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment method stats',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      meta: {
        requestId,
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

module.exports = router;