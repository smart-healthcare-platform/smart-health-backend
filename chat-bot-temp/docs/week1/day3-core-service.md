# Day 3: Chatbot Service Core Implementation

## 🎯 Mục tiêu ngày 3
Triển khai phiên bản cốt lõi của Chatbot Service Core với Express.js, implement các API endpoints cơ bản theo specification từ `API.md`.

## 📋 Prerequisites
- Đã hoàn thành Day 2: Services setup với docker-compose
- Node.js 18+ đã cài đặt
- Các services (MySQL, Redis, Ollama) đang running
- Environment variables configured trong .env file

## 🛠️ Tasks chi tiết

### 1. Khởi tạo project structure
```bash
# Tạo project structure
mkdir -p src/{controllers,services,middleware,utils,config}
mkdir -p tests/{unit,integration}
mkdir logs

# Khởi tạo npm project
npm init -y

# Cài đặt dependencies
npm install express cors helmet morgan dotenv
npm install sequelize pg pg-hstore redis
npm install axios joi express-rate-limit

# Cài đặt dev dependencies
npm install -D nodemon jest supertest eslint prettier

# Tạo basic file structure
touch src/app.js src/server.js src/config/database.js
touch src/config/redis.js src/middleware/errorHandler.js
touch src/middleware/validation.js src/utils/logger.js
```

### 2. Configure package.json scripts
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/"
  }
}
```

### 3. Implement Express.js application structure
```javascript
// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health');
const chatRoutes = require('./routes/chat');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined', { 
  stream: { write: message => logger.info(message.trim()) }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/health', healthRoutes);
app.use('/api/chat', chatRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
```

### 4. Implement health check endpoint
```javascript
// src/routes/health.js
const express = require('express');
const router = express.Router();
const { checkHealth } = require('../services/healthService');

router.get('/', async (req, res) => {
  try {
    const healthStatus = await checkHealth();
    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
```

### 5. Implement basic chat endpoint
```javascript
// src/routes/chat.js
const express = require('express');
const router = express.Router();
const { processMessage } = require('../services/chatService');
const { validateChatMessage } = require('../middleware/validation');

router.post('/', validateChatMessage, async (req, res) => {
  try {
    const { message, userId, sessionId, language } = req.body;
    
    const response = await processMessage({
      message,
      userId,
      sessionId,
      language
    });

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router;
```

### 6. Implement validation middleware
```javascript
// src/middleware/validation.js
const Joi = require('joi');

const chatMessageSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
  userId: Joi.string().required(),
  sessionId: Joi.string().optional(),
  language: Joi.string().valid('vi', 'en', 'fr', 'es').default('vi')
});

const validateChatMessage = (req, res, next) => {
  const { error } = chatMessageSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details[0].message
    });
  }
  
  next();
};

module.exports = { validateChatMessage };
```

### 7. Implement error handling middleware
```javascript
// src/middleware/errorHandler.js
const logger = require('../utils/logger');

const errorHandler = (error, req, res, next) => {
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  // Default error
  const status = error.status || 500;
  const message = error.message || 'Internal server error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

module.exports = errorHandler;
```

### 8. Implement logger utility
```javascript
// src/utils/logger.js
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, json } = format;

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    json()
  ),
  defaultMeta: { service: 'chatbot-service' },
  transports: [
    new transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new transports.File({ 
      filename: 'logs/combined.log' 
    }),
    new transports.Console({
      format: format.simple()
    })
  ]
});

module.exports = logger;
```

### 9. Create server entry point
```javascript
// src/server.js
require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`Chatbot Service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
```

### 10. Test basic functionality
```bash
# Start the service
npm run dev

# Test health endpoint
curl http://localhost:3001/health

# Test chat endpoint
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how are you?",
    "userId": "test_user_001",
    "language": "en"
  }'
```

## ✅ Success Criteria
- [ ] Project structure created với proper organization
- [ ] Express.js app configured với security middleware
- [ ] Health endpoint implemented và working
- [ ] Chat endpoint implemented với validation
- [ ] Error handling middleware in place
- [ ] Logging system working
- [ ] Service can start và respond to requests

## 🚨 Troubleshooting Common Issues

### Port Already in Use
```bash
# Check port usage
sudo lsof -i :3001

# Kill process using port
sudo kill -9 $(lsof -t -i:3001)
```

### Module Not Found Errors
```bash
# Check node_modules
ls node_modules/

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables Not Loading
```bash
# Check .env file
cat .env

# Verify dotenv configuration
console.log(process.env.DB_HOST);
```

## 📊 Time Estimation
| Task | Estimated Time |
|------|----------------|
| Project Setup | 20 phút |
| Dependencies Installation | 15 phút |
| Express.js Configuration | 30 phút |
| API Endpoints Implementation | 45 phút |
| Middleware Implementation | 30 phút |
| Testing & Verification | 20 phút |
| **Total** | **160 phút** |

## 🎯 Next Steps
Sau khi hoàn thành Day 3, chuẩn bị cho Day 4:
- [ ] Test all endpoints với curl hoặc Postman
- [ ] Verify error handling working properly
- [ ] Check logs for any issues
- [ ] Prepare database integration code