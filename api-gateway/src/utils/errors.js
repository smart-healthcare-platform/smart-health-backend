/**
 * Custom API Error Class
 */
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.success = false;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Service Error Class for microservice communication errors
 */
class ServiceError extends ApiError {
  constructor(serviceName, statusCode, message, originalError = null) {
    super(statusCode, message);
    this.serviceName = serviceName;
    this.originalError = originalError;
    this.type = 'SERVICE_ERROR';
  }
}

/**
 * Validation Error Class
 */
class ValidationError extends ApiError {
  constructor(message, errors = []) {
    super(400, message);
    this.errors = errors;
    this.type = 'VALIDATION_ERROR';
  }
}

/**
 * Authentication Error Class
 */
class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed') {
    super(401, message);
    this.type = 'AUTHENTICATION_ERROR';
  }
}

/**
 * Authorization Error Class
 */
class AuthorizationError extends ApiError {
  constructor(message = 'Access denied') {
    super(403, message);
    this.type = 'AUTHORIZATION_ERROR';
  }
}

/**
 * Not Found Error Class
 */
class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super(404, `${resource} not found`);
    this.type = 'NOT_FOUND_ERROR';
  }
}

/**
 * Rate Limit Error Class
 */
class RateLimitError extends ApiError {
  constructor(message = 'Too many requests') {
    super(429, message);
    this.type = 'RATE_LIMIT_ERROR';
  }
}

/**
 * Service Unavailable Error Class
 */
class ServiceUnavailableError extends ApiError {
  constructor(serviceName, message = 'Service temporarily unavailable') {
    super(503, message);
    this.serviceName = serviceName;
    this.type = 'SERVICE_UNAVAILABLE_ERROR';
  }
}

/**
 * Timeout Error Class
 */
class TimeoutError extends ApiError {
  constructor(serviceName, timeout) {
    super(408, `Request to ${serviceName} timed out after ${timeout}ms`);
    this.serviceName = serviceName;
    this.timeout = timeout;
    this.type = 'TIMEOUT_ERROR';
  }
}

/**
 * Gateway Error Class
 */
class GatewayError extends ApiError {
  constructor(message = 'Gateway error') {
    super(502, message);
    this.type = 'GATEWAY_ERROR';
  }
}

/**
 * Error response formatter
 */
const formatErrorResponse = (error, req) => {
  const response = {
    success: false,
    message: error.message,
    code: error.statusCode || 500,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };

  // Add additional error details in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    
    if (error.originalError) {
      response.originalError = error.originalError.message;
    }
    
    if (error.errors) {
      response.errors = error.errors;
    }
  }

  // Add service information for service errors
  if (error.serviceName) {
    response.service = error.serviceName;
  }

  // Add error type
  if (error.type) {
    response.type = error.type;
  }

  return response;
};

/**
 * Check if error is operational (expected) or programming error
 */
const isOperationalError = (error) => {
  if (error instanceof ApiError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Convert common errors to ApiError instances
 */
const convertToApiError = (error) => {
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }
  
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }
  
  if (error.name === 'NotBeforeError') {
    return new AuthenticationError('Token not active');
  }
  
  // Validation errors
  if (error.name === 'ValidationError') {
    return new ValidationError('Validation failed', error.details);
  }
  
  // Network/HTTP errors
  if (error.code === 'ECONNREFUSED') {
    return new ServiceUnavailableError('Unknown', 'Service connection refused');
  }
  
  if (error.code === 'ETIMEDOUT') {
    return new TimeoutError('Unknown', 5000);
  }
  
  // If already an ApiError, return as is
  if (error instanceof ApiError) {
    return error;
  }
  
  // Default to internal server error
  return new ApiError(500, 'Internal server error', false);
};

/**
 * HTTP status code mapping
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

module.exports = {
  ApiError,
  ServiceError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ServiceUnavailableError,
  TimeoutError,
  GatewayError,
  formatErrorResponse,
  isOperationalError,
  convertToApiError,
  HTTP_STATUS,
}; 