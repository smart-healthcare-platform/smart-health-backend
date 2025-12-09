const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const morgan = require("morgan");

const config = require("./config");
const logger = require("./config/logger");
const redisService = require("./services/cache/redisService");
const {
  initializeErrorHandlers,
  timeoutHandler,
  gracefulShutdownHandler,
} = require("./middleware/errorHandler");
const { standardLimiter, speedLimiter } = require("./middleware/rateLimiter");
const routes = require("./routes");
const httpProxy = require('http-proxy');

const app = express();

const wsProxy = httpProxy.createProxyServer({
  target: config.services.chat.url, // Chỉ trỏ đến URL gốc của Chat Service
  ws: true,
});

wsProxy.on('error', (err, req, socket) => {
  logger.error('WebSocket proxy server error:', { error: err.message, code: err.code, stack: err.stack });
  if (socket && !socket.destroyed) {
    socket.end();
  }
});

wsProxy.on('proxyReq', (proxyReq, req, res) => {
  logger.debug('WebSocket proxy request:', {
    method: proxyReq.method,
    path: proxyReq.path,
    headers: proxyReq.getHeaders(),
  });
});

wsProxy.on('proxyRes', (proxyRes, req, res) => {
  logger.debug('WebSocket proxy response received:', {
    statusCode: proxyRes.statusCode,
    headers: proxyRes.headers,
  });
});

wsProxy.on('open', (proxySocket) => {
  logger.debug('WebSocket proxy connection opened.');
});

wsProxy.on('close', (res, socket, head) => {
  logger.debug('WebSocket proxy connection closed.');
});

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
      },
    },
  })
);

app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  })
);

app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(timeoutHandler(60000)); // 60 seconds timeout for all requests
app.use(gracefulShutdownHandler());

app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim(), { type: "http" }),
    },
  })
);

app.use((req, res, next) => {
  req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.startTime = Date.now();
  res.setHeader("X-Request-ID", req.id);

  res.on("finish", () => {
    const responseTime = Date.now() - req.startTime;
    logger.apiLog(req, res, responseTime);
  });

  next();
});

// app.use(standardLimiter);  // Temporarily disabled for testing
// app.use(speedLimiter);     // Temporarily disabled for testing
app.use("/", routes);

const server = app.listen(config.port, async () => {
  logger.info(`Smart Health API Gateway started`, {
    port: config.port,
    environment: config.env,
    nodeVersion: process.version,
  });

  // Initialize Redis connection
  try {
    await redisService.initialize();
    logger.info('Redis service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Redis service', {
      error: error.message,
    });
    logger.warn('API Gateway will continue without cache');
  }
});

server.on('upgrade', (req, socket, head) => {
  logger.info(`Received upgrade request for: ${req.url}`);
  if (req.url.startsWith('/socket.io')) {
    logger.info('Proxying WebSocket request to chat service...');
    // Không cần pathRewrite thủ công nữa, vì Chat Service sẽ lắng nghe trên đường dẫn gốc
    logger.debug(`[DEBUG] wsProxy configured target: ${wsProxy.options.target}`);
    logger.debug(`[DEBUG] wsProxy 'ws' option: ${wsProxy.options.ws}`);
    logger.debug(`[DEBUG] Incoming WebSocket req.url: ${req.url}`);
    wsProxy.ws(req, socket, head);
  } else {
    logger.warn(`Destroying WebSocket connection for unhandled path: ${req.url}`);
    socket.destroy();
  }
});

initializeErrorHandlers(app, server);

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, starting graceful shutdown");
  
  // Disconnect Redis
  await redisService.disconnect();
  
  server.close(() => {
    logger.info("Server closed successfully");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, starting graceful shutdown");
  
  // Disconnect Redis
  await redisService.disconnect();
  
  server.close(() => {
    logger.info("Server closed successfully");
    process.exit(0);
  });
});

module.exports = app;
