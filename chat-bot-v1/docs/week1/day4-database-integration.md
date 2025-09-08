# Day 4: Database Integration & API Implementation

## 🎯 Mục tiêu ngày 4
Thiết lập kết nối database, implement database schema, session management với Redis, và hoàn thiện các API endpoints còn lại.

## 📋 Prerequisites
- Đã hoàn thành Day 3: Core service implementation
- MySQL và Redis đang running qua docker-compose
- Environment variables configured correctly
- Basic Express.js app đang working

## 🛠️ Tasks chi tiết

### 1. Thiết lập MySQL connection với Sequelize
```javascript
// src/config/database.js
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      // Enable for MySQL 8+
      authPlugins: {
        mysql_native_password: () => require('mysql2/lib/auth/mysql_native_password')
      }
    }
  }
);

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('MySQL database connection established successfully');
  } catch (error) {
    logger.error('Unable to connect to MySQL database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };
```

### 2. Định nghĩa database models
```javascript
// src/models/User.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  languagePreference: {
    type: DataTypes.STRING,
    defaultValue: 'vi',
    validate: {
      isIn: [['vi', 'en', 'fr', 'es']]
    }
  }
}, {
  tableName: 'users',
  timestamps: true
});

module.exports = User;
```

```javascript
// src/models/Conversation.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  startTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'conversations',
  timestamps: true
});

module.exports = Conversation;
```

```javascript
// src/models/Message.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  conversationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'conversations',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('USER', 'BOT'),
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  urgencyLevel: {
    type: DataTypes.ENUM('NORMAL', 'URGENT', 'CRITICAL'),
    defaultValue: 'NORMAL'
  }
}, {
  tableName: 'messages',
  timestamps: true,
  indexes: [
    {
      fields: ['conversationId']
    },
    {
      fields: ['timestamp']
    }
  ]
});

module.exports = Message;
```

### 3. Thiết lập model relationships
```javascript
// src/models/index.js
const User = require('./User');
const Conversation = require('./Conversation');
const Message = require('./Message');

// Define relationships
User.hasMany(Conversation, { foreignKey: 'userId' });
Conversation.belongsTo(User, { foreignKey: 'userId' });

Conversation.hasMany(Message, { foreignKey: 'conversationId' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId' });

module.exports = {
  User,
  Conversation,
  Message,
  sequelize: require('../config/database').sequelize
};
```

### 4. Thiết lập Redis connection
```javascript
// src/config/redis.js
const redis = require('redis');
const logger = require('../utils/logger');

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

client.on('connect', () => {
  logger.info('Redis client connected');
});

client.on('error', (err) => {
  logger.error('Redis client error:', err);
});

// Promisify Redis commands
const { promisify } = require('util');
client.getAsync = promisify(client.get).bind(client);
client.setAsync = promisify(client.set).bind(client);
client.delAsync = promisify(client.del).bind(client);

module.exports = client;
```

### 5. Implement session management service
```javascript
// src/services/sessionService.js
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

class SessionService {
  constructor() {
    this.sessionPrefix = 'session:';
    this.sessionTTL = 3600; // 1 hour in seconds
  }

  async createSession(sessionId, data) {
    try {
      const key = this.sessionPrefix + sessionId;
      await redisClient.setAsync(key, JSON.stringify(data), 'EX', this.sessionTTL);
      logger.debug('Session created:', { sessionId });
      return true;
    } catch (error) {
      logger.error('Error creating session:', error);
      throw error;
    }
  }

  async getSession(sessionId) {
    try {
      const key = this.sessionPrefix + sessionId;
      const data = await redisClient.getAsync(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting session:', error);
      throw error;
    }
  }

  async updateSession(sessionId, data) {
    try {
      const key = this.sessionPrefix + sessionId;
      await redisClient.setAsync(key, JSON.stringify(data), 'EX', this.sessionTTL);
      logger.debug('Session updated:', { sessionId });
      return true;
    } catch (error) {
      logger.error('Error updating session:', error);
      throw error;
    }
  }

  async deleteSession(sessionId) {
    try {
      const key = this.sessionPrefix + sessionId;
      await redisClient.delAsync(key);
      logger.debug('Session deleted:', { sessionId });
      return true;
    } catch (error) {
      logger.error('Error deleting session:', error);
      throw error;
    }
  }
}

module.exports = new SessionService();
```

### 6. Implement history endpoint
```javascript
// src/routes/history.js
const express = require('express');
const router = express.Router();
const { getConversationHistory } = require('../services/historyService');

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const history = await getConversationHistory(userId, parseInt(limit), parseInt(offset));
    
    res.status(200).json({
      userId,
      conversations: history
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve conversation history',
      details: error.message
    });
  }
});

module.exports = router;
```

### 7. Implement session endpoint
```javascript
// src/routes/session.js
const express = require('express');
const router = express.Router();
const sessionService = require('../services/sessionService');

router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    await sessionService.deleteSession(sessionId);
    
    res.status(200).json({
      message: 'Session deleted successfully',
      sessionId
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete session',
      details: error.message
    });
  }
});

module.exports = router;
```

### 8. Update app.js để include new routes
```javascript
// src/app.js (add these imports)
const historyRoutes = require('./routes/history');
const sessionRoutes = require('./routes/session');

// Add these after existing routes
app.use('/api/history', historyRoutes);
app.use('/api/session', sessionRoutes);
```

### 9. Database synchronization và testing
```javascript
// src/utils/databaseSync.js
const { sequelize, User, Conversation, Message } = require('../models');
const logger = require('./logger');

const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: process.env.NODE_ENV === 'development' });
    logger.info('Database synchronized successfully');
    
    // Create test data if in development
    if (process.env.NODE_ENV === 'development') {
      await createTestData();
    }
  } catch (error) {
    logger.error('Database synchronization failed:', error);
    throw error;
  }
};

const createTestData = async () => {
  // Create test user
  const user = await User.create({
    username: 'test_user',
    email: 'test@example.com'
  });

  // Create test conversation
  const conversation = await Conversation.create({
    sessionId: 'test_session_001',
    userId: user.id
  });

  // Create test messages
  await Message.bulkCreate([
    {
      conversationId: conversation.id,
      content: 'Hello, I have a question',
      type: 'USER'
    },
    {
      conversationId: conversation.id,
      content: 'How can I help you today?',
      type: 'BOT'
    }
  ]);

  logger.info('Test data created successfully');
};

module.exports = { syncDatabase };
```

### 10. Update server.js để sync database
```javascript
// src/server.js (add this)
const { testConnection } = require('./config/database');
const { syncDatabase } = require('./utils/databaseSync');

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database
    await syncDatabase();
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Chatbot Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
```

## ✅ Success Criteria
- [ ] Database connection established và tested
- [ ] Database models defined với proper relationships
- [ ] Redis connection working cho session management
- [ ] Session service implemented
- [ ] History endpoint implemented
- [ ] Session endpoint implemented
- [ ] Database synchronization working
- [ ] Test data created (development mode)

## 🚨 Troubleshooting Common Issues

### Database Connection Errors
```bash
# Check MySQL logs
docker-compose logs database

# Verify connection parameters
echo $DB_HOST $DB_PORT $DB_NAME

# Test MySQL connection manually
mysql -h localhost -P 3306 -u chatbot_user -psecure_password -e "SELECT 1;"
```

### Redis Connection Issues
```bash
# Test Redis connection manually
redis-cli -h localhost -p 6379 -a redis_password ping
```

### Sequelize Sync Issues
```bash
# Drop and recreate database if needed
docker-compose down -v
docker-compose up -d
```

## 📊 Time Estimation
| Task | Estimated Time |
|------|----------------|
| Database Configuration | 30 phút |
| Model Definitions | 45 phút |
| Redis Setup | 30 phút |
| Session Service | 45 phút |
| API Endpoints | 60 phút |
| Database Sync | 20 phút |
| **Total** | **230 phút** |

## 🎯 Next Steps
Sau khi hoàn thành Day 4, chuẩn bị cho Day 5:
- [ ] Test all database operations
- [ ] Verify session management working
- [ ] Test history retrieval
- [ ] Prepare Docker configuration
- [ ] Plan testing strategy