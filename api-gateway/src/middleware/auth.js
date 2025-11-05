const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../config/logger');
const { ApiError } = require('../utils/errors');

/**
 * JWT Authentication Middleware
 * Verifies JWT tokens from Authorization header
 */
const authenticateJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.securityLog('Missing or invalid authorization header', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
      });
      return next(new ApiError(401, 'Access token is required'));
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Add user info to request object
    req.user = {
      id: decoded.id,
      username: decoded.username || decoded.sub,
      role: decoded.role,
      authorities: decoded.authorities || [],
      iat: decoded.iat,
      exp: decoded.exp,
    };

    logger.debug('JWT Authentication successful', {
      userId: req.user.id,
      role: req.user.role,
      url: req.originalUrl,
    });

    next();
  } catch (error) {
    logger.securityLog('JWT Authentication failed', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
    });

    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Access token has expired'));
    }

    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid access token'));
    }

    if (error.name === 'NotBeforeError') {
      return next(new ApiError(401, 'Access token not active'));
    }

    return next(new ApiError(401, 'Token verification failed'));
  }
};

/**
 * Optional JWT Authentication
 * Verifies JWT token if present, but doesn't require it
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Continue without authentication
  }

  return authenticateJWT(req, res, next);
};

/**
 * Role-based Authorization Middleware
 * @param {string|string[]} allowedRoles - Role or array of roles allowed
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    console.log("DEBUG req.user:", req.user);
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const userRole = req.user.role?.toUpperCase();
    const hasRole = roles.some(role => role.toUpperCase() === userRole);

    if (!hasRole) {
      logger.securityLog('Authorization failed - insufficient role', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        url: req.originalUrl,
      });
      return next(new ApiError(403, 'Insufficient permissions'));
    }

    logger.debug('Authorization successful', {
      userId: req.user.id,
      role: req.user.role,
      url: req.originalUrl,
    });

    next();
  };
};

/**
 * Permission-based Authorization Middleware
 * @param {string|string[]} permissions - Permission or array of permissions required
 */
const requirePermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
    const userAuthorities = req.user.authorities || [];

    const hasPermission = requiredPermissions.every(permission =>
      userAuthorities.includes(permission) || userAuthorities.includes('ADMIN')
    );

    if (!hasPermission) {
      logger.securityLog('Authorization failed - insufficient permissions', {
        userId: req.user.id,
        userPermissions: userAuthorities,
        requiredPermissions,
        url: req.originalUrl,
      });
      return next(new ApiError(403, 'Insufficient permissions'));
    }

    next();
  };
};

/**
 * Admin Only Middleware
 */
const requireAdmin = requireRole('ADMIN');

/**
 * Doctor or Admin Middleware
 */
const requireDoctorOrAdmin = requireRole(['DOCTOR', 'ADMIN']);

/**
 * Patient, Doctor, Receptionist or Admin Middleware (Any authenticated user)
 */
const requireAnyRole = requireRole(['PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN']);

module.exports = {
  authenticateJWT,
  optionalAuth,
  requireRole,
  requirePermission,
  requireAdmin,
  requireDoctorOrAdmin,
  requireAnyRole,
}; 