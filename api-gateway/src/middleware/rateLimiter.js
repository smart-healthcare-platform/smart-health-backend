const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const config = require("../config");
const logger = require("../config/logger");
const { RateLimitError } = require("../utils/errors");

/**
 * Create Redis store for rate limiting (if Redis is available)
 */
const createRedisStore = () => {
  try {
    const RedisStore = require("rate-limit-redis");
    const Redis = require("redis");

    const redisClient = Redis.createClient({
      url: `redis://${config.redis.host}:${config.redis.port}/${config.redis.db}`,
      password: config.redis.password || undefined,
    });

    // Connect to Redis (async but non-blocking)
    redisClient.connect().catch((err) => {
      logger.warn("Redis connection failed", { error: err.message });
    });

    return RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: "rl:",
    });
  } catch (error) {
    logger.warn("Redis not available for rate limiting, using memory store", {
      error: error.message,
    });
    return undefined; // Use default memory store
  }
};

/**
 * Custom rate limit message handler
 */
const rateLimitHandler = (req, res) => {
  const error = new RateLimitError("Too many requests, please try again later");

  logger.securityLog("Rate limit exceeded", {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    url: req.originalUrl,
    userId: req.user?.id,
  });

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    code: error.statusCode,
    retryAfter: Math.round(config.rateLimit.windowMs / 1000),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Custom rate limit key generator
 * Uses IP + User ID (if authenticated) for more accurate limiting
 */
const rateLimitKeyGenerator = (req) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userId = req.user?.id || "anonymous";
  return `${ip}:${userId}`;
};

/**
 * Skip rate limiting for certain conditions
 */
const rateLimitSkipper = (req) => {
  // Skip for health checks
  if (req.path === "/health" || req.path === "/api/health") {
    return true;
  }

  // Skip for admin users in development
  if (config.env === "development" && req.user?.role === "ADMIN") {
    return true;
  }

  return false;
};

/**
 * Standard rate limiter for general API endpoints
 */
const standardLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  handler: rateLimitHandler,
  keyGenerator: rateLimitKeyGenerator,
  skip: rateLimitSkipper,
  store: createRedisStore(),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  handler: rateLimitHandler,
  keyGenerator: rateLimitKeyGenerator,
  store: createRedisStore(),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Very strict rate limiter for registration endpoint
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  handler: rateLimitHandler,
  keyGenerator: (req) => req.ip,
  store: createRedisStore(),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Slow down middleware for progressive delay
 */
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: Math.floor(config.rateLimit.max * 0.7), // Start slowing down after 70% of limit
  delayMs: () => 500, // Fixed delay of 500ms per request
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  keyGenerator: rateLimitKeyGenerator,
  skip: rateLimitSkipper,
});

/**
 * Admin endpoints rate limiter (more generous)
 */
const adminLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max * 2, // Double the limit for admin operations
  handler: rateLimitHandler,
  keyGenerator: rateLimitKeyGenerator,
  skip: (req) => rateLimitSkipper(req) || req.user?.role !== "ADMIN",
  store: createRedisStore(),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * File upload rate limiter
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  handler: rateLimitHandler,
  keyGenerator: rateLimitKeyGenerator,
  store: createRedisStore(),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Dynamic rate limiter based on user role
 */
const dynamicLimiter = (req, res, next) => {
  const userRole = req.user?.role;

  switch (userRole) {
    case "ADMIN":
      return adminLimiter(req, res, next);
    case "DOCTOR":
      // Doctors get higher limits than patients
      return rateLimit({
        windowMs: config.rateLimit.windowMs,
        max: Math.floor(config.rateLimit.max * 1.5),
        handler: rateLimitHandler,
        keyGenerator: rateLimitKeyGenerator,
        store: createRedisStore(),
      })(req, res, next);
    default:
      return standardLimiter(req, res, next);
  }
};

/**
 * Get rate limit status for monitoring
 */
const getRateLimitStatus = () => {
  return {
    standard: {
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
    },
    auth: {
      windowMs: 15 * 60 * 1000,
      max: 5,
    },
    register: {
      windowMs: 60 * 60 * 1000,
      max: 3,
    },
    store: createRedisStore() ? "redis" : "memory",
  };
};

module.exports = {
  standardLimiter,
  authLimiter,
  registerLimiter,
  speedLimiter,
  adminLimiter,
  uploadLimiter,
  dynamicLimiter,
  getRateLimitStatus,
};
