const { createProxyMiddleware } = require("http-proxy-middleware");
const config = require("../config");
const logger = require("../config/logger");
const {
  ServiceError,
  TimeoutError,
  ServiceUnavailableError,
} = require("../utils/errors");

/**
 * Service Registry - Dynamic service discovery
 */
class ServiceRegistry {
  constructor() {
    this.services = new Map();
    this.healthChecks = new Map();
    this.initializeServices();
  }

  initializeServices() {
    // Register services from config
    Object.entries(config.services).forEach(([name, serviceConfig]) => {
      this.registerService(name, serviceConfig);
    });
  }

  registerService(name, serviceConfig) {
    this.services.set(name, {
      ...serviceConfig,
      healthy: true,
      lastHealthCheck: null,
      failureCount: 0,
    });

    logger.info(`Service registered: ${name}`, serviceConfig);
  }

  getService(name) {
    return this.services.get(name);
  }

  markServiceHealthy(name) {
    const service = this.services.get(name);
    if (service) {
      service.healthy = true;
      service.failureCount = 0;
      service.lastHealthCheck = new Date();
    }
  }

  markServiceUnhealthy(name, error) {
    const service = this.services.get(name);
    if (service) {
      service.healthy = false;
      service.failureCount += 1;
      service.lastHealthCheck = new Date();
      service.lastError = error;

      logger.warn(`Service marked unhealthy: ${name}`, {
        failureCount: service.failureCount,
        error: error.message,
      });
    }
  }

  getHealthyServices() {
    return Array.from(this.services.entries())
      .filter(([, service]) => service.healthy)
      .map(([name, service]) => ({ name, ...service }));
  }
}

// Global service registry instance
const serviceRegistry = new ServiceRegistry();

/**
 * Create proxy middleware for a specific service
 */
const createServiceProxy = (serviceName) => {
  const service = serviceRegistry.getService(serviceName);

  if (!service) {
    throw new Error(`Service ${serviceName} not found in registry`);
  }

  return createProxyMiddleware({
    target: service.url,
    changeOrigin: true,

    pathRewrite: (path, req) => {
      let cleanPath = path;

      if (serviceName === "auth") {
        // /v1/auth/login -> /login
        cleanPath = path.replace(/^\/v1\/auth/, "");
      } else if (path.startsWith(`/v1/public/${serviceName}`)) {
        // /v1/public/doctors or /v1/public/doctors/:id -> /doctors or /doctors/:id
        return `${service.basePath}${path.replace(`/v1/public/${serviceName}`, '')}`;
      } else {
        // /v1/doctors/123 -> /123
        cleanPath = path.replace(new RegExp(`^/v1/${serviceName}`), "");
      }

      const newPath = `${service.basePath}${cleanPath}`;
      console.log(`[DEBUG] Proxy target: ${service.url}${newPath}`);
      logger.serviceLog(serviceName, "Proxy request", {
        originalPath: path,
        cleanPath,
        newPath,
        method: req.method,
        target: service.url,
      });

      return newPath;
    },

    // Remove timeout to see if that's the issue
    // timeout: service.timeout,

    // Request interceptor
    onProxyReq: (proxyReq, req, res) => {
      console.log(
        `[PROXY DEBUG] Starting proxy request to ${service.url}${proxyReq.path}`
      );

      // Add gateway headers
      proxyReq.setHeader("X-Gateway-Name", config.gatewayName);
      proxyReq.setHeader("X-Gateway-Version", "1.0.0");
      proxyReq.setHeader("X-Request-ID", req.id || generateRequestId());

      // Forward user information if authenticated
      if (req.user) {
        proxyReq.setHeader("X-User-ID", req.user.id);
        proxyReq.setHeader("X-User-Role", req.user.role);
        proxyReq.setHeader(
          "X-User-Authorities",
          JSON.stringify(req.user.authorities)
        );
      }

      // Handle POST body manually
      if (req.body && req.method === "POST") {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        console.log(`[PROXY DEBUG] Wrote body: ${bodyData}`);
      }

      logger.debug(
        `Proxying ${req.method} ${req.originalUrl} to ${service.url}`
      );
    },

    // Response interceptor
    onProxyRes: (proxyRes, req, res) => {
      // Add gateway response headers
      proxyRes.headers["X-Gateway-Name"] = config.gatewayName;
      proxyRes.headers["X-Response-Time"] = Date.now() - req.startTime;

      // Mark service as healthy on successful response
      if (proxyRes.statusCode < 500) {
        serviceRegistry.markServiceHealthy(serviceName);
      }

      logger.serviceLog(serviceName, "Proxy response", {
        statusCode: proxyRes.statusCode,
        responseTime: Date.now() - req.startTime,
      });
    },

    // Error handler
    onError: (err, req, res) => {
      logger.error(`Proxy error for service ${serviceName}:`, err);

      // Mark service as unhealthy
      serviceRegistry.markServiceUnhealthy(serviceName, err);

      let error;

      if (err.code === "ECONNREFUSED") {
        error = new ServiceUnavailableError(
          serviceName,
          `Service ${serviceName} is unavailable`
        );
      } else if (err.code === "ETIMEDOUT") {
        error = new TimeoutError(serviceName, service.timeout);
      } else {
        error = new ServiceError(
          serviceName,
          502,
          `Gateway error: ${err.message}`,
          err
        );
      }

      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.statusCode,
        service: serviceName,
        timestamp: new Date().toISOString(),
      });
    },

    // Logging
    logLevel: config.env === "development" ? "debug" : "warn",
    logProvider: () => logger,
  });
};

/**
 * Get service proxy middleware by service name
 */
const getServiceProxy = (serviceName) => {
  try {
    return createServiceProxy(serviceName);
  } catch (error) {
    logger.error(`Failed to create proxy for service ${serviceName}:`, error);
    throw new ServiceError(
      serviceName,
      502,
      `Failed to create proxy for ${serviceName}`
    );
  }
};

/**
 * Health check middleware for services
 */
const healthCheckService = async (serviceName) => {
  const service = serviceRegistry.getService(serviceName);

  if (!service) {
    throw new Error(`Service ${serviceName} not found`);
  }

  try {
    const axios = require("axios");
    const response = await axios.get(`${service.url}/actuator/health`, {
      timeout: service.timeout,
      validateStatus: (status) => status < 500,
    });

    serviceRegistry.markServiceHealthy(serviceName);

    return {
      service: serviceName,
      status: "healthy",
      responseTime: response.headers["x-response-time"],
      details: response.data,
    };
  } catch (error) {
    serviceRegistry.markServiceUnhealthy(serviceName, error);

    return {
      service: serviceName,
      status: "unhealthy",
      error: error.message,
      lastCheck: new Date().toISOString(),
    };
  }
};

/**
 * Get all services health status
 */
const getAllServicesHealth = async () => {
  const services = Object.keys(config.services);
  const healthPromises = services.map((service) =>
    healthCheckService(service).catch((error) => ({
      service,
      status: "error",
      error: error.message,
    }))
  );

  const results = await Promise.all(healthPromises);

  return {
    gateway: {
      name: config.gatewayName,
      status: "healthy",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    },
    services: results,
  };
};

/**
 * Circuit breaker pattern implementation
 */
class CircuitBreaker {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000; // 1 minute
    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.nextAttempt = Date.now();
  }

  async execute(request) {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttempt) {
        throw new ServiceUnavailableError(
          this.serviceName,
          "Circuit breaker is OPEN"
        );
      }
      this.state = "HALF_OPEN";
    }

    try {
      const result = await request();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  onFailure() {
    this.failureCount += 1;

    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.recoveryTimeout;

      logger.warn(`Circuit breaker OPEN for service: ${this.serviceName}`, {
        failureCount: this.failureCount,
        recoveryTimeout: this.recoveryTimeout,
      });
    }
  }
}

/**
 * Generate unique request ID
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

module.exports = {
  serviceRegistry,
  createServiceProxy,
  getServiceProxy,
  healthCheckService,
  getAllServicesHealth,
  CircuitBreaker,
  generateRequestId,
};
