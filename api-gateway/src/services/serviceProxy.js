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
    ws: service.websocket || false,

    pathRewrite: (path, req) => {
      let cleanPath = path;

      if (serviceName === "auth") {
        // /v1/auth/login -> /login
        cleanPath = path.replace(/^\/v1\/auth/, "");
      } else if (path.startsWith(`/v1/public/${serviceName}`)) {
        // /v1/public/doctors or /v1/public/doctors/:id -> /doctors or /doctors/:id
        return `${service.basePath}${path.replace(`/v1/public/${serviceName}`, '')}`;
      } else if (serviceName === "medicine") {
        // /v1/medicine/drugs -> /api/v1/drugs
        cleanPath = path.replace(new RegExp(`^/v1/${serviceName}`), "");
      }
      // Xử lý cho billing service (hỗ trợ cả /billing và /billings)
      else if (serviceName === 'billing') {
        // /v1/billings/today -> /billings/today
        // /v1/billing/today -> /billing/today (backward compatibility)
        // Chỉ remove /v1, giữ lại /billings hoặc /billing
        cleanPath = path.replace(/^\/v1/, "");
        logger.debug(`[PATH_REWRITE] Billing service. cleanPath: ${cleanPath}`);
      }
      // Handle plural service names (e.g., /v1/notifications -> /device/register)
      else if (serviceName === 'notification' && path.startsWith('/v1/notifications')) {
        // /v1/notifications/device/register -> /device/register
        cleanPath = path.replace(/^\/v1\/notifications/, "");
      }
      else {
        // /v1/doctors/123 -> /123
        // Use word boundary to avoid partial matches (e.g., notification vs notifications)
        cleanPath = path.replace(new RegExp(`^/v1/${serviceName}`), "");
      }
      logger.debug(`[PATH_REWRITE] serviceName: ${serviceName}, originalPath: ${path}, cleanPath (before basePath): ${cleanPath}`);

      const newPath = `${service.basePath}${cleanPath}`;
      logger.debug(`[PATH_REWRITE] newPath (to target service): ${newPath}`);
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
      console.log(`[PROXY DEBUG] Original request path: ${req.path}, originalUrl: ${req.originalUrl}`);

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
        
        // Forward original Authorization header to backend services
        // This allows services to verify JWT themselves if needed
        if (req.headers.authorization) {
          proxyReq.setHeader("Authorization", req.headers.authorization);
          console.log(`[PROXY DEBUG] Forwarding Authorization header`);
        }
        
        // Forward doctor-specific headers for medicine and other services
        if (req.user.role === 'DOCTOR') {
          proxyReq.setHeader("X-Doctor-Id", req.user.id);
        }
        
        console.log(`[PROXY DEBUG] Forwarding X-User-ID: ${req.user.id}, X-User-Role: ${req.user.role}`);
      } else {
        console.log(`[PROXY DEBUG] req.user is NOT set for ${req.method} ${req.originalUrl}`);
      }

      // Handle POST/PUT/PATCH body manually (important for IPN webhooks)
      if (req.body && (req.method === "POST" || req.method === "PUT" || req.method === "PATCH")) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        console.log(`[PROXY DEBUG] Wrote body for ${req.method}: ${bodyData}`);
      }

      logger.debug(
        `Proxying ${req.method} ${req.originalUrl} to ${service.url}${proxyReq.path}`
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
      serviceRegistry.markServiceUnhealthy(serviceName, err);

      // For WebSocket errors, the 'res' object is a socket, not an HTTP response.
      // We can't send a JSON response, so we just log and end the connection.
      if (res.writeHead === undefined) {
        logger.error(`WebSocket proxy error for ${serviceName}. Destroying socket.`, {
          error: err.message,
          code: err.code,
        });
        if (res.destroy) {
          res.destroy();
        }
        return;
      }

      if (res.headersSent) {
        return;
      }

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
    const response = await axios.get(`${service.url}/health`, {
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
