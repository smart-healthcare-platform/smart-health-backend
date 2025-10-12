const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

// Load environment variables
dotenv.config({
  path: path.join(__dirname, '../../.env'),
});

// Define configuration schema
const envSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').default('development'),
    PORT: Joi.number().default(3000),
    API_GATEWAY_NAME: Joi.string().default('Smart Health API Gateway'),
    
    // JWT Configuration
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ISSUER: Joi.string().default('smart-health-gateway'),
    
    // Services URLs
    AUTH_SERVICE_URL: Joi.string().default('http://localhost:8081'),
    PATIENT_SERVICE_URL: Joi.string().default('http://localhost:8082'),
    DOCTOR_SERVICE_URL: Joi.string().default('http://localhost:8083'),
    APPOINTMENT_SERVICE_URL: Joi.string().default('http://localhost:8084'),
    CHAT_SERVICE_URL: Joi.string().default('http://localhost:8085'),
    PREDICTION_SERVICE_URL: Joi.string().default('http://localhost:8086'),
    NOTIFICATION_SERVICE_URL: Joi.string().default('http://localhost:8088'),
    MEDICINE_SERVICE_URL: Joi.string().default('http://localhost:8089'),
    
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
    
    // Redis Configuration
    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().default(6379),
    REDIS_PASSWORD: Joi.string().allow(''),
    REDIS_DB: Joi.number().default(0),
    
    // CORS
    CORS_ORIGIN: Joi.string().default('*'),
    CORS_CREDENTIALS: Joi.boolean().default(true),
    
    // Logging
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
    LOG_FILE_MAX_SIZE: Joi.string().default('20m'),
    LOG_FILE_MAX_FILES: Joi.string().default('14d'),
    
    // Health Check
    HEALTH_CHECK_INTERVAL: Joi.number().default(30000),
    SERVICE_TIMEOUT: Joi.number().default(5000),
    
    // API Documentation
    API_DOCS_ENABLED: Joi.boolean().default(true),
    API_DOCS_PATH: Joi.string().default('/api-docs'),
  })
  .unknown();

const { value: envVars, error } = envSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  gatewayName: envVars.API_GATEWAY_NAME,
  
  jwt: {
    secret: envVars.JWT_SECRET,
    issuer: envVars.JWT_ISSUER,
  },
  
  services: {
    auth: {
      url: envVars.AUTH_SERVICE_URL,
      basePath: '/api/auth',
      timeout: envVars.SERVICE_TIMEOUT,
    },
    prediction: {
      url: envVars.PREDICTION_SERVICE_URL,
      basePath: '/api/v1',
      timeout: envVars.SERVICE_TIMEOUT,
    },
    patients: {
      url: envVars.PATIENT_SERVICE_URL,
      basePath: '/api/patients',
      timeout: envVars.SERVICE_TIMEOUT,
    },
    doctors: {
      url: envVars.DOCTOR_SERVICE_URL,
      basePath: '/api/doctors',
      timeout: envVars.SERVICE_TIMEOUT,
    },
    appointments: {
      url: envVars.APPOINTMENT_SERVICE_URL,
      basePath: '/api/appointments',
      timeout: envVars.SERVICE_TIMEOUT,
    },
    notification: {
      url: envVars.NOTIFICATION_SERVICE_URL,
      basePath: '/api/notifications',
      timeout: envVars.SERVICE_TIMEOUT,
    },
    medicine: {
      url: envVars.MEDICINE_SERVICE_URL,
      basePath: '/api/v1',
      timeout: envVars.SERVICE_TIMEOUT,
    },
    chat: {
      url: envVars.CHAT_SERVICE_URL,
      basePath: '/api',
      timeout: envVars.SERVICE_TIMEOUT,
      websocket: false, // Set to false to prevent http-proxy-middleware from handling WebSocket upgrades
    }
  },
  
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    max: envVars.RATE_LIMIT_MAX_REQUESTS,
  },
  
  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD || undefined,
    db: envVars.REDIS_DB,
  },
  
  cors: {
    origin: envVars.CORS_ORIGIN.split(',').map(origin => origin.trim()),
    credentials: envVars.CORS_CREDENTIALS,
  },
  
  logging: {
    level: envVars.LOG_LEVEL,
    fileMaxSize: envVars.LOG_FILE_MAX_SIZE,
    fileMaxFiles: envVars.LOG_FILE_MAX_FILES,
  },
  
  healthCheck: {
    interval: envVars.HEALTH_CHECK_INTERVAL,
    timeout: envVars.SERVICE_TIMEOUT,
  },
  
  apiDocs: {
    enabled: envVars.API_DOCS_ENABLED,
    path: envVars.API_DOCS_PATH,
  },
}; 