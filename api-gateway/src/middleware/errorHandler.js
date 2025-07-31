const logger = require('../config/logger');
const config = require('../config');
const { 
  formatErrorResponse, 
  isOperationalError, 
  convertToApiError,
  ApiError 
} = require('../utils/errors');

/**
 * Global error handling middleware
 * Must be placed after all routes and middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  // Convert error to ApiError if needed
  const error = convertToApiError(err);
  
  // Log error
  logError(error, req);
  
  // Send error response
  const response = formatErrorResponse(error, req);
  res.status(error.statusCode || 500).json(response);
};

/**
 * 404 Not Found handler
 * Must be placed after all routes but before error handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Log error based on severity
 */
const logError = (error, req) => {
  const logData = {
    message: error.message,
    statusCode: error.statusCode,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    role: req.user?.role,
    timestamp: new Date().toISOString(),
  };

  // Add service information if available
  if (error.serviceName) {
    logData.service = error.serviceName;
  }

  // Add original error if available
  if (error.originalError) {
    logData.originalError = error.originalError.message;
  }

  // Log based on error severity
  if (error.statusCode >= 500) {
    logger.error('Server Error', logData);
  } else if (error.statusCode >= 400) {
    logger.warn('Client Error', logData);
  } else {
    logger.info('Error', logData);
  }

  // Security logging for specific error types
  if (error.statusCode === 401 || error.statusCode === 403) {
    logger.securityLog('Authentication/Authorization Error', logData);
  }
};

/**
 * Async error handler wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error handler
 * Handles express-validator errors
 */
const validationErrorHandler = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));
    
    const error = new ApiError(400, 'Validation failed');
    error.errors = validationErrors;
    
    return next(error);
  }
  
  next();
};

/**
 * Timeout handler middleware
 */
const timeoutHandler = (timeout = 30000) => {
  return (req, res, next) => {
    // Set response timeout
    res.setTimeout(timeout, () => {
      const error = new ApiError(408, 'Request timeout');
      next(error);
    });
    
    next();
  };
};

/**
 * Graceful shutdown error handler
 */
const gracefulShutdownHandler = () => {
  return (req, res, next) => {
    if (process.env.SHUTDOWN_IN_PROGRESS === 'true') {
      const error = new ApiError(503, 'Server is shutting down');
      return next(error);
    }
    next();
  };
};

/**
 * Handle uncaught exceptions
 */
const handleUncaughtException = () => {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack,
      type: 'uncaughtException',
    });
    
    // Graceful shutdown
    process.exit(1);
  });
};

/**
 * Handle unhandled promise rejections
 */
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
      reason: reason.message || reason,
      stack: reason.stack,
      promise: promise.toString(),
      type: 'unhandledRejection',
    });
    
    // Graceful shutdown
    process.exit(1);
  });
};

/**
 * Handle SIGTERM signal (Docker/Kubernetes shutdown)
 */
const handleSigterm = (server) => {
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, starting graceful shutdown');
    process.env.SHUTDOWN_IN_PROGRESS = 'true';
    
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });
};

/**
 * Handle SIGINT signal (Ctrl+C)
 */
const handleSigint = (server) => {
  process.on('SIGINT', () => {
    logger.info('SIGINT received, starting graceful shutdown');
    process.env.SHUTDOWN_IN_PROGRESS = 'true';
    
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });
};

/**
 * Development error details
 */
const developmentErrorDetails = (error, req) => {
  if (config.env !== 'development') {
    return {};
  }
  
  return {
    stack: error.stack,
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Error metrics collection
 */
const collectErrorMetrics = (error, req) => {
  // This could be extended to send metrics to monitoring systems
  // like Prometheus, DataDog, etc.
  logger.info('Error Metrics', {
    errorType: error.constructor.name,
    statusCode: error.statusCode,
    route: req.route?.path,
    method: req.method,
    service: error.serviceName,
    count: 1,
  });
};

/**
 * Initialize all error handlers
 */
const initializeErrorHandlers = (app, server) => {
  // Handle uncaught exceptions and rejections
  handleUncaughtException();
  handleUnhandledRejection();
  
  // Handle shutdown signals
  if (server) {
    handleSigterm(server);
    handleSigint(server);
  }
  
  // 404 handler (must be after all routes)
  app.use(notFoundHandler);
  
  // Global error handler (must be last)
  app.use(globalErrorHandler);
};

module.exports = {
  globalErrorHandler,
  notFoundHandler,
  asyncHandler,
  validationErrorHandler,
  timeoutHandler,
  gracefulShutdownHandler,
  initializeErrorHandlers,
  logError,
  developmentErrorDetails,
  collectErrorMetrics,
}; 