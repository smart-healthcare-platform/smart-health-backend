const express = require('express');
const router = express.Router();
const { getServiceProxy } = require('../services/serviceProxy');
const {
  authenticateJWT,
  requireAdmin,
  requireDoctorOrAdmin,
  requireAnyRole
} = require('../middleware/auth');
const { dynamicLimiter } = require('../middleware/rateLimiter');
const logger = require('../config/logger');
const adminEndpoints = require('../config/admin-endpoints'); 

adminEndpoints.forEach(ep => {
  try {
    const proxy = getServiceProxy(ep.service);
    const method = ep.method.toLowerCase();

    // register route with authentication + requireAdmin
    router[method](ep.path, authenticateJWT, requireAdmin, (req, res, next) => {
      logger.securityLog('Admin endpoint accessed', {
        userId: req.user.id,
        role: req.user.role,
        path: req.path,
        method: req.method,
      });
      proxy(req, res, next);
    });

    console.log(`Registered admin endpoint: [${ep.method}] ${ep.path} -> ${ep.service}`);
  } catch (err) {
    logger.error(`Failed to register admin endpoint ${ep.path}`, { error: err.message });
  }
});
// --- PUBLIC: ai cũng có thể xem danh sách bác sĩ hoặc xem chi tiết
try {
  const doctorProxy = getServiceProxy('doctors');
  router.use('/public/doctors', doctorProxy);
} catch (error) {
  logger.error('Failed to configure public doctor service proxy', { error: error.message });
  router.use('/public/doctors', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Doctor service (public) is temporarily unavailable',
      code: 503,
      service: 'doctor',
      timestamp: new Date().toISOString(),
    });
  });
}
// Public: Payment Gateway Webhooks (Return & IPN)
// Các route này phải được định nghĩa TRƯỚC middleware `authenticateJWT`
// vì chúng được gọi bởi các hệ thống bên ngoài (Momo, VNPay) không có token.
try {
  const billingWebhookProxy = getServiceProxy('billing');

  // Route cho URL trả về (người dùng được chuyển hướng đến đây)
  // GET /v1/billing/billings/return
  router.get('/billing/billings/return', (req, res, next) => {
    logger.info('Received public return from payment gateway', {
      params: req.query,
      path: req.path,
      originalUrl: req.originalUrl
    });
    billingWebhookProxy(req, res, next);
  });

  // Route cho IPN (backend-to-backend notification)
  // POST /v1/billing/billings/ipn/:gateway
  router.post('/billing/billings/ipn/:gateway', (req, res, next) => {
    logger.info(`Received public IPN for gateway: ${req.params.gateway}`, {
      body: req.body,
      path: req.path,
      originalUrl: req.originalUrl,
      headers: req.headers
    });
    billingWebhookProxy(req, res, next);
  });

} catch (error) {
  logger.error('Failed to configure billing webhook proxy', { error: error.message });
  const unavailableServiceHandler = (req, res) => res.status(503).json({ message: 'Billing service (webhooks) is unavailable' });
  router.get('/billing/billings/return', unavailableServiceHandler);
  router.post('/billing/billings/ipn/:gateway', unavailableServiceHandler);
}
/**
 * Apply authentication and rate limiting to all service routes
 */
router.use(authenticateJWT);
router.use(dynamicLimiter);

/**
 * Patient Service Routes
 * Patients can access their own data, doctors and admins can access all patient data
 */
router.use('/patients', (req, res, next) => {
  // Log patient service access
  logger.info('Patient service access', {
    userId: req.user.id,
    role: req.user.role,
    path: req.path,
    method: req.method,
  });
  next();
});

// Configure patient service proxy
try {
  const patientProxy = getServiceProxy('patients');
  router.use('/patients', patientProxy);
} catch (error) {
  logger.error('Failed to configure patient service proxy', { error: error.message });
  router.use('/patients', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Patient service is temporarily unavailable',
      code: 503,
      service: 'patient',
      timestamp: new Date().toISOString(),
    });
  });
}



// --- PROTECTED: thêm/sửa/xóa bác sĩ -> chỉ Doctor hoặc Admin
router.use('/doctors', authenticateJWT, requireDoctorOrAdmin, (req, res, next) => {
  logger.info('Doctor service access (protected)', {
    userId: req.user.id,
    role: req.user.role,
    path: req.path,
    method: req.method,
  });
  next();
});

try {
  const doctorProxyProtected = getServiceProxy('doctors');
  router.use('/doctors', doctorProxyProtected);
} catch (error) {
  logger.error('Failed to configure doctor service proxy', { error: error.message });
  router.use('/doctors', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Doctor service is temporarily unavailable',
      code: 503,
      service: 'doctor',
      timestamp: new Date().toISOString(),
    });
  });
}

/**
 * Appointment Service Routes
 * All authenticated users can access appointments (with proper filtering in the service)
 */
router.use('/appointments', requireAnyRole, (req, res, next) => {
  logger.info('Appointment service access', {
    userId: req.user.id,
    role: req.user.role,
    path: req.path,
    method: req.method,
  });
  next();
});

// Configure appointment service proxy
try {
  const appointmentProxy = getServiceProxy('appointments');
  router.use('/appointments', appointmentProxy);
} catch (error) {
  logger.error('Failed to configure appointment service proxy', { error: error.message });
  router.use('/appointments', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Appointment service is temporarily unavailable',
      code: 503,
      service: 'appointment',
      timestamp: new Date().toISOString(),
    });
  });
}

/**
 * Notification Service Routes
 * All authenticated users can access notifications
 */
router.use('/notifications', requireAnyRole, (req, res, next) => {
  logger.info('Notification service access', {
    userId: req.user.id,
    role: req.user.role,
    path: req.path,
    method: req.method,
  });
  next();
});

// Configure notification service proxy
try {
  const notificationProxy = getServiceProxy('notification');
  router.use('/notifications', notificationProxy);
} catch (error) {
  logger.error('Failed to configure notification service proxy', { error: error.message });
  router.use('/notifications', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Notification service is temporarily unavailable',
      code: 503,
      service: 'notification',
      timestamp: new Date().toISOString(),
    });
  });
}

/**
 * Chat Service Routes
 * All authenticated users can access chat
 */
router.use('/chat', requireAnyRole, (req, res, next) => {
  logger.info('Chat service access', {
    userId: req.user.id,
    role: req.user.role,
    path: req.path,
    method: req.method,
  });
  next();
});

// Configure chat service proxy
try {
  const chatProxy = getServiceProxy('chat');
  router.use('/chat', chatProxy);
} catch (error) {
  logger.error('Failed to configure chat service proxy', { error: error.message });
  router.use('/chat', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Chat service is temporarily unavailable',
      code: 503,
      service: 'chat',
      timestamp: new Date().toISOString(),
    });
  });
}

/**
 * Medicine Service Routes
 * All authenticated users can access medicine
 */
router.use('/medicine', requireAnyRole, (req, res, next) => {
  logger.info('Medicine service access', {
    userId: req.user.id,
    role: req.user.role,
    path: req.path,
    method: req.method,
  });
  next();
});

// Configure medicine service proxy
try {
  const medicineProxy = getServiceProxy('medicine');
  router.use('/medicine', medicineProxy);
} catch (error) {
  logger.error('Failed to configure medicine service proxy', { error: error.message });
  router.use('/medicine', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Medicine service is temporarily unavailable',
      code: 503,
      service: 'medicine',
      timestamp: new Date().toISOString(),
    });
  });
}
/**
 * Billing Service Routes
 * Authenticated users can access their own billing information.
 */
router.use('/billings', requireAnyRole, (req, res, next) => {
  logger.info('Billing service access (protected)', {
    userId: req.user.id,
    role: req.user.role,
    path: req.path,
    method: req.method,
  });
  next();
});

// Configure billing service proxy
try {
  const billingProxy = getServiceProxy('billing');
  router.use('/billings', billingProxy);
} catch (error) {
  logger.error('Failed to configure billing service proxy', { error: error.message });
  router.use('/billings', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Billing service is temporarily unavailable',
      code: 503,
      service: 'billing',
      timestamp: new Date().toISOString(),
    });
  });
}


/**
 * Admin Service Routes (future)
 * Only admins can access admin-specific endpoints
 */
router.use('/admin', requireAdmin, (req, res, next) => {
  logger.securityLog('Admin service access', {
    userId: req.user.id,
    role: req.user.role,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });
  next();
});

// Admin endpoints will be implemented when admin service is created
// router.use('/admin', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Admin service endpoints will be available soon',
//     availableEndpoints: [
//       'GET /admin/users',
//       'GET /admin/analytics',
//       'GET /admin/system-status',
//     ],
//     timestamp: new Date().toISOString(),
//   });
// });

/**
 * Handle service-specific errors
 */
router.use((error, req, res, next) => {
  logger.error('Service error', {
    error: error.message,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    service: error.serviceName,
  });

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Service error';

  res.status(statusCode).json({
    success: false,
    message,
    code: statusCode,
    service: error.serviceName || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router; 