const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../config/logger');

/**
 * Middleware to verify admin role
 * Checks JWT token and validates ADMIN role
 */
const adminAuth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Admin auth failed: No token provided', {
        ip: req.ip,
        path: req.path,
        method: req.method,
      });
      
      return res.status(401).json({
        success: false,
        message: 'No token provided',
        error: 'UNAUTHORIZED',
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Log decoded token for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Token decoded:', {
        userId: decoded.id || decoded.sub,
        email: decoded.email,
        roles: decoded.roles || decoded.role,
      });
    }
    
    // Check if user has admin role
    // Support both 'roles' array and 'role' string
    const hasAdminRole = 
      (Array.isArray(decoded.roles) && decoded.roles.includes('ADMIN')) ||
      decoded.role === 'ADMIN' ||
      decoded.role === 'admin' ||
      (Array.isArray(decoded.roles) && decoded.roles.includes('admin'));
    
    if (!hasAdminRole) {
      logger.warn('Admin access denied: User does not have ADMIN role', {
        userId: decoded.id || decoded.sub,
        email: decoded.email,
        roles: decoded.roles || decoded.role,
        ip: req.ip,
        path: req.path,
      });
      
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
        error: 'FORBIDDEN',
      });
    }
    
    // Attach user info to request
    req.user = {
      id: decoded.id || decoded.sub,
      email: decoded.email,
      name: decoded.name || decoded.fullName,
      roles: decoded.roles || [decoded.role],
      role: decoded.role,
    };
    
    logger.debug('Admin authenticated successfully', {
      userId: req.user.id,
      email: req.user.email,
      path: req.path,
    });
    
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      logger.warn('Admin auth failed: Token expired', {
        expiredAt: error.expiredAt,
        ip: req.ip,
      });
      
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        error: 'TOKEN_EXPIRED',
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Admin auth failed: Invalid token', {
        error: error.message,
        ip: req.ip,
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'INVALID_TOKEN',
      });
    }
    
    if (error.name === 'NotBeforeError') {
      logger.warn('Admin auth failed: Token not active yet', {
        notBefore: error.date,
        ip: req.ip,
      });
      
      return res.status(401).json({
        success: false,
        message: 'Token not active yet',
        error: 'TOKEN_NOT_ACTIVE',
      });
    }
    
    // Generic error
    logger.error('Admin authentication error', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      ip: req.ip,
      path: req.path,
    });
    
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: 'INTERNAL_ERROR',
    });
  }
};

module.exports = adminAuth;