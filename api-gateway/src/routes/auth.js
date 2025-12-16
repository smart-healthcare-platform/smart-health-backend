const express = require("express");
const router = express.Router();
const { getServiceProxy } = require("../services/serviceProxy");
const { authLimiter, registerLimiter } = require("../middleware/rateLimiter");
const { optionalAuth, authenticateJWT, requireRole } = require("../middleware/auth");
const logger = require("../config/logger");

/**
 * Apply rate limiting to auth endpoints
 * These endpoints are more sensitive and require stricter limits
 */

/**
 * User registration endpoint
 * Applies strict rate limiting to prevent abuse
 */
router.use("/register", registerLimiter);

/**
 * Receptionist registration endpoint (walk-in patients)
 * Requires RECEPTIONIST or ADMIN role
 * Protected route with authentication
 */
router.use(
  "/register-by-receptionist",
  authenticateJWT,
  requireRole(['RECEPTIONIST', 'ADMIN']),
  (req, res, next) => {
    logger.info('Walk-in patient registration initiated', {
      receptionistId: req.user.id,
      receptionistRole: req.user.role,
      ip: req.ip,
    });
    next();
  }
);

/**
 * Authentication endpoints (login, refresh-token)
 * Applies authentication-specific rate limiting
 */
// router.use(["/login", "/refresh-token"], authLimiter);  // Temporarily disabled for testing

/**
 * Optional authentication for certain endpoints
 * Some auth endpoints might want to know if user is logged in
 */
router.use(["/me", "/logout"], optionalAuth);

/**
 * Log auth requests for security monitoring
 */
router.use((req, res, next) => {
  logger.securityLog("Auth endpoint access", {
    endpoint: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
  });
  next();
});

/**
 * DEBUG: Add middleware to track request flow
 */
router.use("/", (req, res, next) => {
  console.log(`[AUTH ROUTE DEBUG] Request: ${req.method} ${req.path}`);
  console.log(`[AUTH ROUTE DEBUG] Body:`, req.body);
  next();
});

/**
 * Proxy all auth requests to auth service
 * The service proxy will handle:
 * - Request forwarding
 * - Error handling
 * - Health monitoring
 * - Circuit breaking
 */
try {
  const authProxy = getServiceProxy("auth");

  // Apply the proxy to all routes under /auth
  router.use("/", authProxy);

  logger.info("Auth service proxy configured successfully");
} catch (error) {
  logger.error("Failed to configure auth service proxy", {
    error: error.message,
    stack: error.stack,
  });

  // Fallback error handler if auth service is not available
  router.use("/", (req, res) => {
    logger.error("Auth service unavailable", {
      path: req.path,
      method: req.method,
    });

    res.status(503).json({
      success: false,
      message: "Authentication service is temporarily unavailable",
      code: 503,
      service: "auth",
      timestamp: new Date().toISOString(),
    });
  });
}

/**
 * Handle auth service specific errors
 */
router.use((error, req, res, next) => {
  logger.error("Auth service error", {
    error: error.message,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  // Transform auth service errors to consistent format
  const statusCode = error.statusCode || 500;
  const message = error.message || "Authentication service error";

  res.status(statusCode).json({
    success: false,
    message,
    code: statusCode,
    service: "auth",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
