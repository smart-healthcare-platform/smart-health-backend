const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getAllServicesHealth, healthCheckService } = require('../services/serviceProxy');
const { getRateLimitStatus } = require('../middleware/rateLimiter');
const config = require('../config');
const logger = require('../config/logger');

/**
 * Gateway health check - Simple liveness probe
 * Used by load balancers and monitoring systems
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Detailed gateway health check
 * Includes system information and basic checks
 */
router.get('/detailed', asyncHandler(async (req, res) => {
  const uptime = process.uptime();
  const memory = process.memoryUsage();
  
  const health = {
    success: true,
    status: 'healthy',
    service: 'api-gateway',
    version: '1.0.0',
    environment: config.env,
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptime),
      human: formatUptime(uptime),
    },
    memory: {
      used: Math.round(memory.heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(memory.heapTotal / 1024 / 1024 * 100) / 100,
      external: Math.round(memory.external / 1024 / 1024 * 100) / 100,
      unit: 'MB',
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid,
    },
    config: {
      port: config.port,
      rateLimiting: getRateLimitStatus(),
      cors: {
        enabled: true,
        origins: config.cors.origin,
      },
    },
  };

  logger.debug('Health check performed', { type: 'detailed' });
  res.json(health);
}));

/**
 * All services health check
 * Checks health of all registered microservices
 */
router.get('/services', asyncHandler(async (req, res) => {
  logger.info('Performing health check on all services');
  
  const healthData = await getAllServicesHealth();
  
  // Determine overall status
  const servicesHealthy = healthData.services.every(service => 
    service.status === 'healthy'
  );
  
  const overallStatus = servicesHealthy ? 'healthy' : 'degraded';
  
  const response = {
    success: true,
    status: overallStatus,
    timestamp: new Date().toISOString(),
    ...healthData,
  };

  logger.info('All services health check completed', { 
    status: overallStatus,
    healthyServices: healthData.services.filter(s => s.status === 'healthy').length,
    totalServices: healthData.services.length,
  });

  // Return appropriate status code
  const statusCode = overallStatus === 'healthy' ? 200 : 503;
  res.status(statusCode).json(response);
}));

/**
 * Individual service health check
 */
router.get('/services/:serviceName', asyncHandler(async (req, res) => {
  const { serviceName } = req.params;
  
  logger.info(`Performing health check on service: ${serviceName}`);
  
  try {
    const serviceHealth = await healthCheckService(serviceName);
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      ...serviceHealth,
    };

    const statusCode = serviceHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(response);
    
    logger.info(`Health check completed for service: ${serviceName}`, {
      status: serviceHealth.status,
    });
  } catch (error) {
    logger.error(`Health check failed for service: ${serviceName}`, {
      error: error.message,
    });
    
    res.status(404).json({
      success: false,
      message: `Service ${serviceName} not found`,
      timestamp: new Date().toISOString(),
    });
  }
}));

/**
 * Readiness probe
 * Checks if the gateway is ready to receive traffic
 */
router.get('/ready', asyncHandler(async (req, res) => {
  try {
    // Check critical dependencies
    const checks = {
      config: config ? 'ready' : 'not ready',
      logger: logger ? 'ready' : 'not ready',
      uptime: process.uptime() > 5 ? 'ready' : 'starting', // Wait 5 seconds after start
    };
    
    const allReady = Object.values(checks).every(status => status === 'ready');
    
    const response = {
      success: allReady,
      status: allReady ? 'ready' : 'not ready',
      checks,
      timestamp: new Date().toISOString(),
    };

    const statusCode = allReady ? 200 : 503;
    res.status(statusCode).json(response);
    
  } catch (error) {
    logger.error('Readiness check failed', { error: error.message });
    res.status(503).json({
      success: false,
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}));

/**
 * Liveness probe
 * Simple check to verify the application is running
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Metrics endpoint
 * Basic metrics for monitoring
 */
router.get('/metrics', asyncHandler(async (req, res) => {
  const uptime = process.uptime();
  const memory = process.memoryUsage();
  
  const metrics = {
    success: true,
    timestamp: new Date().toISOString(),
    metrics: {
      uptime_seconds: Math.floor(uptime),
      memory_heap_used_bytes: memory.heapUsed,
      memory_heap_total_bytes: memory.heapTotal,
      memory_external_bytes: memory.external,
      memory_rss_bytes: memory.rss,
      process_pid: process.pid,
      nodejs_version: process.version,
      environment: config.env,
    },
  };

  res.json(metrics);
}));

/**
 * Format uptime in human-readable format
 */
function formatUptime(uptime) {
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

module.exports = router; 