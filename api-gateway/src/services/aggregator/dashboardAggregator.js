const axios = require('axios');
const config = require('../../config');
const logger = require('../../config/logger');
const redisService = require('../cache/redisService');

class DashboardAggregator {
  constructor() {
    // Cache TTL configuration (in seconds)
    this.CACHE_TTL = {
      STATS: 30,           // Dashboard stats: 30 seconds
      TRENDS: 60,          // Trends data: 1 minute
      GROWTH: 3600,        // Growth data: 1 hour
      SYSTEM_HEALTH: 5,    // System health: 5 seconds
      TOP_DOCTORS: 600,    // Top doctors: 10 minutes
      ALERTS: 10,          // Alerts: 10 seconds
    };

    // Service timeout configuration
    this.SERVICE_TIMEOUT = 5000; // 5 seconds
  }

  /**
   * Call internal service with authentication
   * @param {string} serviceName - Name of the service (e.g., 'patients', 'doctors')
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Service response
   */
  async callService(serviceName, endpoint, options = {}) {
    const serviceConfig = config.services[serviceName];
    
    if (!serviceConfig) {
      throw new Error(`Service "${serviceName}" not configured`);
    }

    const url = `${serviceConfig.url}${endpoint}`;
    
    try {
      const startTime = Date.now();
      
      const response = await axios({
        url,
        method: options.method || 'GET',
        headers: {
          'X-Internal-Request': 'true',
          'X-Gateway-Secret': process.env.GATEWAY_SECRET || 'default-secret',
          'Content-Type': 'application/json',
          ...options.headers,
        },
        params: options.params,
        data: options.data,
        timeout: options.timeout || this.SERVICE_TIMEOUT,
      });

      const responseTime = Date.now() - startTime;
      
      logger.debug(`Service call successful: ${serviceName}${endpoint}`, {
        responseTime,
        status: response.status,
      });

      return response.data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logger.error(`Service call failed: ${serviceName}${endpoint}`, {
        responseTime,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      
      // Don't throw - return null to allow partial data aggregation
      return null;
    }
  }

  /**
   * Aggregate dashboard statistics from all services
   * @returns {Promise<Object>} Aggregated dashboard stats
   */
  async getDashboardStats() {
    const cacheKey = 'admin:stats:v1';
    
    // Try cache first
    const cached = await redisService.get(cacheKey);
    if (cached) {
      logger.debug('Dashboard stats cache hit');
      return { 
        ...cached, 
        fromCache: true,
        cacheHit: true,
      };
    }

    logger.info('Dashboard stats cache miss - fetching from services');
    const startTime = Date.now();

    try {
      // Call all services in parallel
      const [
        patientStats,
        doctorStats,
        appointmentStats,
        revenueStats,
        medicineStats,
      ] = await Promise.allSettled([
        this.callService('patients', '/v1/admin/patients/stats'),
        this.callService('doctors', '/v1/admin/doctors/stats'),
        this.callService('appointments', '/v1/admin/appointments/stats'),
        this.callService('billing', '/v1/admin/revenue/stats'),
        this.callService('medicine', '/v1/admin/medicine/stats'),
      ]);

      // Extract and aggregate data
      const stats = {
        // KPI Cards - extract top-level metrics
        totalPatients: this.extractValue(patientStats, 'data.totalPatients', 0),
        activePatients: this.extractValue(patientStats, 'data.activePatients', 0),
        activeDoctors: this.extractValue(doctorStats, 'data.activeDoctors', 0),
        totalDoctors: this.extractValue(doctorStats, 'data.totalDoctors', 0),
        onlineDoctors: this.extractValue(doctorStats, 'data.onlineNow', 0),
        todayAppointments: this.extractValue(appointmentStats, 'data.totalToday', 0),
        completedAppointments: this.extractValue(appointmentStats, 'data.completed', 0),
        pendingAppointments: this.extractValue(appointmentStats, 'data.pending', 0),
        confirmedAppointments: this.extractValue(appointmentStats, 'data.confirmed', 0),
        cancelledAppointments: this.extractValue(appointmentStats, 'data.cancelled', 0),
        revenueToday: this.extractValue(revenueStats, 'data.todayRevenue', 0),
        revenueMonth: this.extractValue(revenueStats, 'data.monthRevenue', 0),
        revenueYear: this.extractValue(revenueStats, 'data.yearRevenue', 0),
        
        // Detailed stats from each service
        patients: this.extractData(patientStats),
        doctors: this.extractData(doctorStats),
        appointments: this.extractData(appointmentStats),
        revenue: this.extractData(revenueStats),
        medicine: this.extractData(medicineStats),
        
        // Service availability status
        serviceStatus: {
          patients: patientStats.status === 'fulfilled',
          doctors: doctorStats.status === 'fulfilled',
          appointments: appointmentStats.status === 'fulfilled',
          revenue: revenueStats.status === 'fulfilled',
          medicine: medicineStats.status === 'fulfilled',
        },
        
        // Metadata
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        fromCache: false,
        cacheHit: false,
        partial: this.isPartialData([
          patientStats,
          doctorStats,
          appointmentStats,
          revenueStats,
          medicineStats,
        ]),
      };

      // Cache the result
      await redisService.set(cacheKey, stats, this.CACHE_TTL.STATS);

      logger.info('Dashboard stats aggregated successfully', {
        responseTime: stats.responseTime,
        partial: stats.partial,
        services: stats.serviceStatus,
      });

      return stats;
    } catch (error) {
      logger.error('Failed to aggregate dashboard stats', {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Extract data from Promise.allSettled result
   * @param {Object} result - Promise.allSettled result
   * @returns {Object|null} Extracted data or null
   */
  extractData(result) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value.data || result.value;
    }
    
    if (result.status === 'rejected') {
      logger.warn('Service data unavailable', { 
        reason: result.reason?.message,
      });
    }
    
    return null;
  }

  /**
   * Extract specific value from nested object using path
   * @param {Object} result - Promise.allSettled result
   * @param {string} path - Dot-notation path (e.g., 'data.totalPatients')
   * @param {any} defaultValue - Default value if path not found
   * @returns {any} Extracted value or default
   */
  extractValue(result, path, defaultValue) {
    if (result.status !== 'fulfilled' || !result.value) {
      return defaultValue;
    }
    
    const keys = path.split('.');
    let value = result.value;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined || value === null) {
        return defaultValue;
      }
    }
    
    return value;
  }

  /**
   * Check if any service failed (partial data)
   * @param {Array} results - Array of Promise.allSettled results
   * @returns {boolean} True if any service failed
   */
  isPartialData(results) {
    return results.some(result => result.status === 'rejected');
  }

  /**
   * Get system health status for all services
   * @returns {Promise<Object>} System health data
   */
  async getSystemHealth() {
    const cacheKey = 'admin:system:health';
    
    // Try cache first
    const cached = await redisService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const services = [
      { name: 'patients', endpoint: '/health' },
      { name: 'doctors', endpoint: '/health' },
      { name: 'appointments', endpoint: '/health' },
      { name: 'billing', endpoint: '/health' },
      { name: 'medicine', endpoint: '/health' },
      { name: 'notification', endpoint: '/health' },
    ];

    const healthChecks = await Promise.allSettled(
      services.map(async (service) => {
        const start = Date.now();
        try {
          const result = await this.callService(service.name, service.endpoint, { 
            timeout: 3000,
          });
          
          return {
            name: service.name,
            status: result ? 'healthy' : 'unhealthy',
            responseTime: Date.now() - start,
            details: result?.data || result,
            url: config.services[service.name]?.url,
          };
        } catch (error) {
          return {
            name: service.name,
            status: 'unhealthy',
            responseTime: Date.now() - start,
            error: error.message,
            url: config.services[service.name]?.url,
          };
        }
      })
    );

    const healthData = healthChecks.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        name: 'unknown',
        status: 'unhealthy',
        error: result.reason?.message,
      };
    });

    const healthyCount = healthData.filter(s => s.status === 'healthy').length;
    const totalCount = healthData.length;

    const health = {
      services: healthData,
      overall: healthyCount === totalCount ? 'healthy' : 
               healthyCount === 0 ? 'critical' : 'degraded',
      healthyCount,
      totalCount,
      healthPercentage: Math.round((healthyCount / totalCount) * 100),
      timestamp: new Date().toISOString(),
    };

    // Cache for short time
    await redisService.set(cacheKey, health, this.CACHE_TTL.SYSTEM_HEALTH);
    
    return health;
  }

  /**
   * Get active alerts (placeholder - implement based on your alert system)
   * @returns {Promise<Object>} Active alerts
   */
  async getActiveAlerts() {
    const cacheKey = 'admin:alerts:active';
    
    const cached = await redisService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // TODO: Implement actual alert aggregation from services
    // For now, return mock structure
    const alerts = {
      critical: [],
      warning: [],
      info: [],
      total: 0,
      timestamp: new Date().toISOString(),
    };

    await redisService.set(cacheKey, alerts, this.CACHE_TTL.ALERTS);
    
    return alerts;
  }

  /**
   * Invalidate cache for specific pattern
   * @param {string} pattern - Cache key pattern
   * @returns {Promise<number>} Number of keys deleted
   */
  async invalidateCache(pattern) {
    logger.info('Invalidating cache', { pattern });
    return await redisService.del(pattern);
  }

  /**
   * Invalidate all admin caches
   * @returns {Promise<number>} Number of keys deleted
   */
  async invalidateAllAdminCache() {
    logger.info('Invalidating all admin caches');
    return await redisService.del('admin:*');
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache stats
   */
  async getCacheStats() {
    return await redisService.getStats();
  }
}

// Export singleton instance
const dashboardAggregator = new DashboardAggregator();

module.exports = dashboardAggregator;