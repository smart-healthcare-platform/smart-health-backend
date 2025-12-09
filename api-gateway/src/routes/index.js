const express = require("express");
const router = express.Router();

// Import route modules
const healthRoutes = require("./health");
const authRoutes = require("./auth");
const serviceRoutes = require("./services");
const adminRoutes = require("./admin");

// API versioning
const API_VERSION = "/v1";

/**
 * Health check routes (no version prefix for monitoring tools)
 */
router.use("/health", healthRoutes);
router.use("/api/health", healthRoutes);

/**
 * DEBUG: Add middleware to track main routes
 */
router.use((req, res, next) => {
  console.log(`[MAIN ROUTE DEBUG] Request: ${req.method} ${req.originalUrl}`);
  console.log(`[MAIN ROUTE DEBUG] API_VERSION: ${API_VERSION}`);
  next();
});

/**
 * API v1 routes
 */
router.use(
  `${API_VERSION}/auth`,
  (req, res, next) => {
    console.log(
      `[MAIN ROUTE DEBUG] Matched auth route: ${req.method} ${req.originalUrl}`
    );
    next();
  },
  authRoutes
);

// Prediction Service routes (public, no authentication required)
const { getServiceProxy } = require("../services/serviceProxy");
const predictionProxy = getServiceProxy("prediction");
router.use(`${API_VERSION}/prediction`, predictionProxy);

// Chatbot Service routes (public, no authentication required)
const chatbotProxy = getServiceProxy("chatbot");
router.use(`${API_VERSION}/chatbot`, chatbotProxy);

/**
 * Admin routes (requires admin authentication)
 * MUST be before serviceRoutes to prevent authenticateJWT middleware conflict
 */
router.use(`${API_VERSION}/admin`, adminRoutes);

router.use(`${API_VERSION}`, serviceRoutes);

/**
 * Default API info endpoint
 */
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Smart Health API Gateway",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      auth: `${API_VERSION}/auth`,
      admin: `${API_VERSION}/admin`,
      patients: `${API_VERSION}/patients`,
      doctors: `${API_VERSION}/doctors`,
      appointments: `${API_VERSION}/appointments`,
      notifications: `${API_VERSION}/notifications`,
      prediction: `${API_VERSION}/prediction`,
      chatbot: `${API_VERSION}/chatbot`,
      medicine: `${API_VERSION}/medicine`,
    },
    documentation: "/api-docs",
  });
});

/**
 * API version info
 */
router.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Smart Health API Gateway - API Information",
    currentVersion: "v1",
    supportedVersions: ["v1"],
    baseUrl: `${req.protocol}://${req.get("host")}${API_VERSION}`,
    endpoints: {
      auth: {
        login: `${API_VERSION}/auth/login`,
        register: `${API_VERSION}/auth/register`,
        refresh: `${API_VERSION}/auth/refresh-token`,
      },
      admin: {
        dashboard: `${API_VERSION}/admin/dashboard/stats`,
        systemHealth: `${API_VERSION}/admin/system/health`,
        cacheStats: `${API_VERSION}/admin/dashboard/cache-stats`,
      },
      services: {
        patients: `${API_VERSION}/patients`,
        doctors: `${API_VERSION}/doctors`,
        appointments: `${API_VERSION}/appointments`,
        notifications: `${API_VERSION}/notifications`,
        prediction: `${API_VERSION}/prediction`,
        chatbot: `${API_VERSION}/chatbot`,
        medicine: `${API_VERSION}/medicine`,
      },
    },
  });
});

/**
 * API v1 info
 */
router.get(`${API_VERSION}`, (req, res) => {
  res.json({
    success: true,
    message: "Smart Health API Gateway - Version 1",
    version: "v1",
    baseUrl: `${req.protocol}://${req.get("host")}${API_VERSION}`,
    services: {
      auth: {
        description: "Authentication and authorization service",
        endpoints: ["/auth/login", "/auth/register", "/auth/refresh-token"],
      },
      admin: {
        description: "Admin dashboard and monitoring (requires admin role)",
        endpoints: [
          "/admin/dashboard/stats",
          "/admin/system/health",
          "/admin/dashboard/refresh",
          "/admin/dashboard/cache-stats",
          "/admin/system/info",
        ],
      },
      patients: {
        description: "Patient management service",
        endpoints: ["/patients", "/patients/:id", "/patients/:id/records"],
      },
      doctors: {
        description: "Doctor management service",
        endpoints: ["/doctors", "/doctors/:id", "/doctors/:id/schedule"],
      },
      appointments: {
        description: "Appointment scheduling service",
        endpoints: ["/appointments", "/appointments/:id"],
      },
      notifications: {
        description: "Notification service",
        endpoints: ["/notifications", "/notifications/send"],
      },
      medicine: {
        description: "Medicine service",
        endpoints: ["/medicine", "/medicine/:id"],
      },
    },
  });
});

module.exports = router;
