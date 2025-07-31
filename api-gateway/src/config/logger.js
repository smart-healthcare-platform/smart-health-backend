const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const config = require('./index');

// Custom format cho console logging
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }
    
    // Add metadata if exists
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Custom format cho file logging
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Tạo logger
const logger = winston.createLogger({
  level: config.logging.level,
  defaultMeta: {
    service: config.gatewayName,
    version: process.env.npm_package_version || '1.0.0',
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
      silent: config.env === 'test',
    }),
    
    // Error log file
    new DailyRotateFile({
      filename: path.join(__dirname, '../../logs/error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxSize: config.logging.fileMaxSize,
      maxFiles: config.logging.fileMaxFiles,
      createSymlink: true,
      symlinkName: 'error.log',
    }),
    
    // Combined log file
    new DailyRotateFile({
      filename: path.join(__dirname, '../../logs/combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: config.logging.fileMaxSize,
      maxFiles: config.logging.fileMaxFiles,
      createSymlink: true,
      symlinkName: 'combined.log',
    }),
  ],
  
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(__dirname, '../../logs/exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: config.logging.fileMaxSize,
      maxFiles: config.logging.fileMaxFiles,
    }),
  ],
  
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(__dirname, '../../logs/rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: config.logging.fileMaxSize,
      maxFiles: config.logging.fileMaxFiles,
    }),
  ],
});

// Extend logger với custom methods
logger.apiLog = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id,
    role: req.user?.role,
  };
  
  if (res.statusCode >= 400) {
    logger.warn('API Error', logData);
  } else {
    logger.info('API Request', logData);
  }
};

logger.serviceLog = (serviceName, action, data = {}) => {
  logger.info('Service Call', {
    service: serviceName,
    action,
    ...data,
  });
};

logger.securityLog = (event, data = {}) => {
  logger.warn('Security Event', {
    event,
    timestamp: new Date().toISOString(),
    ...data,
  });
};

// Export logger
module.exports = logger; 