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
    const startTime = Date.now();
    
    try {
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
        appointmentStats,
        doctorStats,
        revenueStats,
        medicineStats,
      ] = await Promise.allSettled([
        this.callService('patients', '/v1/admin/patients/stats'),
        this.callService('appointments', '/v1/admin/appointments/stats'),
        this.callService('doctors', '/v1/admin/doctors/stats'),
        this.callService('billing', '/api/v1/admin/billing/revenue/stats'),
        this.callService('medicine', '/v1/admin/medicine/stats'),
      ]);

      // Extract and aggregate data
      const stats = {
        // KPI Cards - extract top-level metrics
        totalPatients: this.extractValue(patientStats, 'totalPatients', 0),
        activePatients: this.extractValue(patientStats, 'activePatients', 0),
        newPatientsThisMonth: this.extractValue(patientStats, 'newThisMonth', 0),
        newPatientsThisWeek: this.extractValue(patientStats, 'newThisWeek', 0),
        patientGrowthRate: this.extractValue(patientStats, 'growthRate', 0),
        
        totalAppointments: this.extractValue(appointmentStats, 'totalAppointments', 0),
        pendingAppointments: this.extractValue(appointmentStats, 'pendingAppointments', 0),
        confirmedAppointments: this.extractValue(appointmentStats, 'confirmedAppointments', 0),
        completedAppointments: this.extractValue(appointmentStats, 'completedAppointments', 0),
        cancelledAppointments: this.extractValue(appointmentStats, 'cancelledAppointments', 0),
        scheduledToday: this.extractValue(appointmentStats, 'scheduledToday', 0),
        newAppointmentsThisMonth: this.extractValue(appointmentStats, 'newThisMonth', 0),
        newAppointmentsThisWeek: this.extractValue(appointmentStats, 'newThisWeek', 0),
        averageAppointmentsPerDay: this.extractValue(appointmentStats, 'averagePerDay', 0),
        completionRate: this.extractValue(appointmentStats, 'completionRate', 0),
        cancellationRate: this.extractValue(appointmentStats, 'cancellationRate', 0),
        
        totalRevenue: this.extractValue(appointmentStats, 'totalRevenue', 0),
        revenueThisMonth: this.extractValue(appointmentStats, 'revenueThisMonth', 0),
        averageConsultationFee: this.extractValue(appointmentStats, 'averageConsultationFee', 0),
        mostCommonAppointmentType: this.extractValue(appointmentStats, 'mostCommonType', 'N/A'),
        mostCommonAppointmentCategory: this.extractValue(appointmentStats, 'mostCommonCategory', 'N/A'),
        
        // Doctor metrics
        totalDoctors: this.extractValue(doctorStats, 'data.totalDoctors', 0),
        activeDoctors: this.extractValue(doctorStats, 'data.activeDoctors', 0),
        inactiveDoctors: this.extractValue(doctorStats, 'data.inactiveDoctors', 0),
        newDoctorsThisMonth: this.extractValue(doctorStats, 'data.newDoctorsThisMonth', 0),
        doctorsWorkingToday: this.extractValue(doctorStats, 'data.doctorsWorkingToday', 0),
        averageDoctorRating: this.extractValue(doctorStats, 'data.averageRating', 0),
        totalDoctorRatings: this.extractValue(doctorStats, 'data.totalRatings', 0),
        mostPopularSpecialty: this.extractValue(doctorStats, 'data.mostPopularSpecialty', 'N/A'),
        averageExperienceYears: this.extractValue(doctorStats, 'data.averageExperienceYears', 0),
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
          patients: patientStats.status === 'fulfilled' && patientStats.value !== null,
          appointments: appointmentStats.status === 'fulfilled' && appointmentStats.value !== null,
          doctors: doctorStats.status === 'fulfilled' && doctorStats.value !== null,
          revenue: revenueStats.status === 'fulfilled' && revenueStats.value !== null,
          medicine: medicineStats.status === 'fulfilled' && medicineStats.value !== null,
        },
        
        // Metadata
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        fromCache: false,
        cacheHit: false,
        partial: this.isPartialData([
          patientStats,
          appointmentStats,
          doctorStats,
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
      { name: 'patients', endpoint: '/health', type: 'nestjs' },
      { name: 'doctors', endpoint: '/health', type: 'nestjs' },
      { name: 'appointments', endpoint: '/health', type: 'nestjs' },
      { name: 'billing', endpoint: '/actuator/health', type: 'spring' },
      { name: 'medicine', endpoint: '/actuator/health', type: 'spring' },
      { name: 'notification', endpoint: '/health', type: 'nestjs' },
    ];

    const healthChecks = await Promise.allSettled(
      services.map(async (service) => {
        const startTime = Date.now();
        try {
          const result = await this.callService(service.name, service.endpoint, { 
            timeout: 3000,
          });
          
          // Handle different response formats
          let isHealthy = false;
          let details = null;
          
          if (result) {
            if (service.type === 'spring') {
              // Spring Boot Actuator format: { status: "UP" }
              isHealthy = result.status === 'UP';
              details = result;
            } else {
              // NestJS format: { status: "ok" }
              isHealthy = result.status === 'ok' || result.status === 'UP';
              details = result;
            }
          }
          
          return {
            name: service.name,
            status: isHealthy ? 'healthy' : 'unhealthy',
            responseTime: Date.now() - startTime,
            details: details,
            url: config.services[service.name]?.url,
          };
        } catch (error) {
          return {
            name: service.name,
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
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

  /**
   * Get appointment trends data
   * @param {string} period - Time period: 'daily', 'weekly', or 'monthly'
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} Appointment trends data
   */
  async getAppointmentTrends(period = 'daily', days = 30) {
    const cacheKey = `admin:appointments:trends:${period}:${days}`;
    
    // Try cache first
    const cached = await redisService.get(cacheKey);
    if (cached) {
      logger.debug('Appointment trends cache hit');
      return { ...cached, fromCache: true };
    }

    logger.info('Appointment trends cache miss - fetching from service');
    
    try {
      const trends = await this.callService(
        'appointments',
        '/v1/admin/appointments/trends',
        { params: { period, days } }
      );

      if (trends) {
        // Cache the result
        await redisService.set(cacheKey, trends, this.CACHE_TTL.TRENDS);
        return { ...trends, fromCache: false };
      }

      return null;
    } catch (error) {
      logger.error('Failed to fetch appointment trends', { error: error.message });
      return null;
    }
  }

  /**
   * Get appointment status distribution
   * @returns {Promise<Object>} Status distribution data
   */
  async getAppointmentDistribution() {
    const cacheKey = 'admin:appointments:distribution';
    
    // Try cache first
    const cached = await redisService.get(cacheKey);
    if (cached) {
      logger.debug('Appointment distribution cache hit');
      return { ...cached, fromCache: true };
    }

    logger.info('Appointment distribution cache miss - fetching from service');
    
    try {
      const distribution = await this.callService(
        'appointments',
        '/v1/admin/appointments/status-distribution'
      );

      if (distribution) {
        // Cache the result
        await redisService.set(cacheKey, distribution, this.CACHE_TTL.STATS);
        return { ...distribution, fromCache: false };
      }

      return null;
    } catch (error) {
      logger.error('Failed to fetch appointment distribution', { error: error.message });
      return null;
    }
  }

  /**
   * Get recent appointments
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Recent appointments data
   */
  async getRecentAppointments(page = 1, limit = 10) {
    const cacheKey = `admin:appointments:recent:${page}:${limit}`;
    
    // Try cache first (short TTL for recent data)
    const cached = await redisService.get(cacheKey);
    if (cached) {
      logger.debug('Recent appointments cache hit');
      return { ...cached, fromCache: true };
    }

    logger.info('Recent appointments cache miss - fetching from service');
    
    try {
      const recent = await this.callService(
        'appointments',
        '/v1/admin/appointments/recent',
        { params: { page, limit } }
      );

      if (recent) {
        // Cache with short TTL (10 seconds)
        await redisService.set(cacheKey, recent, 10);
        return { ...recent, fromCache: false };
      }

      return null;
    } catch (error) {
      logger.error('Failed to fetch recent appointments', { error: error.message });
      return null;
    }
  }

  /**
   * Get patient growth trends
   * @param {string} period - Time period: 'daily', 'weekly', or 'monthly'
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} Patient growth data
   */
  async getPatientGrowth(period = 'daily', days = 30) {
    const cacheKey = `admin:patients:growth:${period}:${days}`;
    
    // Try cache first
    const cached = await redisService.get(cacheKey);
    if (cached) {
      logger.debug('Patient growth cache hit');
      return { ...cached, fromCache: true };
    }

    logger.info('Patient growth cache miss - fetching from service');
    
    try {
      const growth = await this.callService(
        'patients',
        '/v1/admin/patients/growth',
        { params: { period, days } }
      );

      if (growth) {
        // Cache the result
        await redisService.set(cacheKey, growth, this.CACHE_TTL.GROWTH);
        return { ...growth, fromCache: false };
      }

      return null;
    } catch (error) {
      logger.error('Failed to fetch patient growth', { error: error.message });
      return null;
    }
  }

  /**
   * Get patient demographics
   * @returns {Promise<Object>} Patient demographics data
   */
  async getPatientDemographics() {
    const cacheKey = 'admin:patients:demographics';
    
    // Try cache first
    const cached = await redisService.get(cacheKey);
    if (cached) {
      logger.debug('Patient demographics cache hit');
      return { ...cached, fromCache: true };
    }

    logger.info('Patient demographics cache miss - fetching from service');
    
    try {
      const demographics = await this.callService(
        'patients',
        '/v1/admin/patients/demographics'
      );

      if (demographics) {
        // Cache the result
        await redisService.set(cacheKey, demographics, this.CACHE_TTL.STATS);
        return { ...demographics, fromCache: false };
      }

      return null;
    } catch (error) {
      logger.error('Failed to fetch patient demographics', { error: error.message });
      return null;
    }
  }

  /**
   * Get recent patients
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Recent patients data
   */
  async getRecentPatients(page = 1, limit = 10) {
    const cacheKey = `admin:patients:recent:${page}:${limit}`;
    
    // Try cache first (short TTL for recent data)
    const cached = await redisService.get(cacheKey);
    if (cached) {
      logger.debug('Recent patients cache hit');
      return { ...cached, fromCache: true };
    }

    logger.info('Recent patients cache miss - fetching from service');
    
    try {
      const recent = await this.callService(
        'patients',
        '/v1/admin/patients/recent',
        { params: { page, limit } }
      );

      if (recent) {
        // Cache with short TTL (10 seconds)
        await redisService.set(cacheKey, recent, 10);
        return { ...recent, fromCache: false };
      }

      return null;
    } catch (error) {
      logger.error('Failed to fetch recent patients', { error: error.message });
      return null;
    }
  }

  /**
   * Get top doctors by various metrics
   * @param {number} limit - Number of top doctors to return
   * @returns {Promise<Object>} Top doctors data
   */
  async getTopDoctors(limit = 10) {
    const cacheKey = `admin:doctors:top:${limit}`;
    
    // Try cache first
    const cached = await redisService.get(cacheKey);
    if (cached) {
      logger.debug('Top doctors cache hit');
      return { ...cached, fromCache: true };
    }

    logger.info('Top doctors cache miss - fetching from service');
    
    try {
      const response = await this.callService(
        'doctors',
        '/v1/admin/doctors/top',
        { params: { limit } }
      );

      if (response) {
        // Extract data from service response (unwrap {success, data, meta})
        const topDoctors = response.data || response;
        // Cache with TTL (10 minutes)
        await redisService.set(cacheKey, topDoctors, this.CACHE_TTL.TOP_DOCTORS);
        return { ...topDoctors, fromCache: false };
      }

      return null;
    } catch (error) {
      logger.error('Failed to fetch top doctors', { error: error.message });
      return null;
    }
  }

  /**
   * Get department/specialty performance metrics
   * @returns {Promise<Object>} Department performance data
   */
  async getDepartmentPerformance() {
    const cacheKey = 'admin:departments:performance';
    
    // Try cache first
    const cached = await redisService.get(cacheKey);
    if (cached) {
      logger.debug('Department performance cache hit');
      return { ...cached, fromCache: true };
    }

    logger.info('Department performance cache miss - fetching from service');
    
    try {
      const response = await this.callService(
        'doctors',
        '/v1/admin/doctors/departments/performance'
      );

      if (response) {
        // Extract data from service response (unwrap {success, data, meta})
        const performance = response.data || response;
        // Cache with TTL (10 minutes)
        await redisService.set(cacheKey, performance, this.CACHE_TTL.TOP_DOCTORS);
        return { ...performance, fromCache: false };
      }

      return null;
    } catch (error) {
      logger.error('Failed to fetch department performance', { error: error.message });
      return null;
    }
  }

  /**
   * Get doctor statistics
   * @returns {Promise<Object>} Doctor stats data
   */
  async getDoctorStats() {
    const cacheKey = 'admin:doctors:stats';
    
    // Try cache first
    const cached = await redisService.get(cacheKey);
    if (cached) {
      logger.debug('Doctor stats cache hit');
      return { ...cached, fromCache: true };
    }

    logger.info('Doctor stats cache miss - fetching from service');
    
    try {
      const response = await this.callService(
        'doctors',
        '/v1/admin/doctors/stats'
      );

      if (response) {
        // Extract data from service response (unwrap {success, data, meta})
        const stats = response.data || response;
        // Cache with TTL (5 minutes)
        await redisService.set(cacheKey, stats, 300);
        return { ...stats, fromCache: false };
      }

      return null;
    } catch (error) {
      logger.error('Failed to fetch doctor stats', { error: error.message });
      return null;
    }
  }

  /**
   * Get revenue analytics (stats, distribution, trends)
   * Aggregates data from billing service
   */
  async getRevenueAnalytics() {
    const cacheKey = 'admin:revenue:analytics';
    
    // Try cache first
    const cached = await redisService.get(cacheKey);
    if (cached) {
      logger.debug('Revenue analytics cache hit');
      return { ...cached, fromCache: true };
    }

    logger.info('Revenue analytics cache miss - fetching from billing service');

    try {
      const [stats, distribution, trends, paymentMethods] = await Promise.allSettled([
        this.callService('billing', '/api/v1/admin/billing/revenue/stats'),
        this.callService('billing', '/api/v1/admin/billing/revenue/distribution'),
        this.callService('billing', '/api/v1/admin/billing/revenue/trends', { params: { period: 'DAILY', days: 30 } }),
        this.callService('billing', '/api/v1/admin/billing/payment-methods/stats'),
      ]);

      const analytics = {
        stats: this.extractData(stats),
        distribution: this.extractData(distribution),
        trends: this.extractData(trends),
        paymentMethods: this.extractData(paymentMethods),
        timestamp: new Date().toISOString(),
        fromCache: false,
      };

      // Cache for 1 minute (revenue data changes frequently)
      await redisService.set(cacheKey, analytics, 60);

      return analytics;
    } catch (error) {
      logger.error('Failed to get revenue analytics', { error: error.message });
      throw error;
    }
  }

  /**
   * Get revenue statistics only
   */
  async getRevenueStats() {
    const cacheKey = 'admin:revenue:stats';
    
    const cached = await redisService.get(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    try {
      const stats = await this.callService('billing', '/api/v1/admin/billing/revenue/stats');
      
      if (!stats) {
        throw new Error('Billing service unavailable');
      }
      
      const data = {
        ...(stats.data || stats),
        timestamp: new Date().toISOString(),
        fromCache: false,
      };

      await redisService.set(cacheKey, data, 60);
      return data;
    } catch (error) {
      logger.error('Failed to get revenue stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Get revenue distribution
   */
  async getRevenueDistribution() {
    const cacheKey = 'admin:revenue:distribution';
    
    const cached = await redisService.get(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    try {
      const distribution = await this.callService('billing', '/api/v1/admin/billing/revenue/distribution');
      
      if (!distribution) {
        throw new Error('Billing service unavailable');
      }
      
      const data = {
        ...(distribution.data || distribution),
        timestamp: new Date().toISOString(),
        fromCache: false,
      };

      await redisService.set(cacheKey, data, 300); // 5 minutes
      return data;
    } catch (error) {
      logger.error('Failed to get revenue distribution', { error: error.message });
      throw error;
    }
  }

  /**
   * Get revenue trends
   */
  async getRevenueTrends(period = 'DAILY', days = 30) {
    const cacheKey = `admin:revenue:trends:${period}:${days}`;
    
    const cached = await redisService.get(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    try {
      const trends = await this.callService('billing', '/api/v1/admin/billing/revenue/trends', {
        params: { period, days }
      });
      
      if (!trends) {
        throw new Error('Billing service unavailable');
      }
      
      const data = {
        ...(trends.data || trends),
        timestamp: new Date().toISOString(),
        fromCache: false,
      };

      await redisService.set(cacheKey, data, 3600); // 1 hour
      return data;
    } catch (error) {
      logger.error('Failed to get revenue trends', { error: error.message });
      throw error;
    }
  }

  /**
   * Get payment method statistics
   */
  async getPaymentMethodStats() {
    const cacheKey = 'admin:payment:methods';
    
    const cached = await redisService.get(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    try {
      const stats = await this.callService('billing', '/api/v1/admin/billing/payment-methods/stats');
      
      if (!stats) {
        throw new Error('Billing service unavailable');
      }
      
      const data = {
        ...(stats.data || stats),
        timestamp: new Date().toISOString(),
        fromCache: false,
      };

      await redisService.set(cacheKey, data, 300); // 5 minutes
      return data;
    } catch (error) {
      logger.error('Failed to get payment method stats', { error: error.message });
      throw error;
    }
  }
}

const dashboardAggregator = new DashboardAggregator();

module.exports = dashboardAggregator;