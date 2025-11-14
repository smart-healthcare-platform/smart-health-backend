const express = require('express');
const router = express.Router();
const adminAuth = require('../../middleware/adminAuth');
const logger = require('../../config/logger');

// Import admin sub-routes
const dashboardRoutes = require('./dashboard');
const systemRoutes = require('./system');

/**
 * Admin API Router
 * All routes under /v1/admin require admin authentication
 */

// Log all admin route access
router.use((req, res, next) => {
  logger.debug('Admin route accessed', {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Apply admin authentication middleware to all routes
router.use(adminAuth);

// Mount sub-routes
router.use('/dashboard', dashboardRoutes);
router.use('/system', systemRoutes);

/**
 * GET /v1/admin
 * Admin API information endpoint
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Health Admin API',
    version: '1.0.0',
    user: {
      id: req.user.id,
      email: req.user.email,
      roles: req.user.roles,
    },
    endpoints: {
      dashboard: {
        stats: 'GET /v1/admin/dashboard/stats',
        refresh: 'POST /v1/admin/dashboard/refresh',
        cacheStats: 'GET /v1/admin/dashboard/cache-stats',
      },
      system: {
        health: 'GET /v1/admin/system/health',
        info: 'GET /v1/admin/system/info',
      },
    },
    documentation: '/api-docs',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;