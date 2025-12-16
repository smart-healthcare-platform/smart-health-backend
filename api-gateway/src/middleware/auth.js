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
    
    // Check both role field and authorities array
    // role might be string "RECEPTIONIST" or object, authorities has "ROLE_RECEPTIONIST" format
    let userRole = req.user.role;
    
    // Handle case where role is an enum object
    if (typeof userRole === 'object' && userRole !== null) {
      userRole = userRole.toString();
    }
    
    // Normalize to uppercase string
    userRole = userRole?.toString().toUpperCase();
    
    // Check direct role match
    let hasRole = roles.some(role => role.toUpperCase() === userRole);
    
    // If not found in role field, check authorities array (Spring Security format with ROLE_ prefix)
    if (!hasRole && req.user.authorities && Array.isArray(req.user.authorities)) {
      hasRole = req.user.authorities.some(auth => {
        const authority = typeof auth === 'string' ? auth : auth.authority;
        // Check both with and without ROLE_ prefix
        return roles.some(role => 
          authority.toUpperCase() === `ROLE_${role.toUpperCase()}` || 
          authority.toUpperCase() === role.toUpperCase()
        );
      });
    }

    if (!hasRole) {
      logger.securityLog('Authorization failed - insufficient role', {
        userId: req.user.id,
        userRole: req.user.role,
        authorities: req.user.authorities,
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
  requireAdmin,
  requireDoctorOrAdmin,
  requireAnyRole,
}; 