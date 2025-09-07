require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');
const { testConnection } = require('./config/database');
const { syncDatabase } = require('./utils/databaseSync');
const RuleService = require('./rule-engine/storage/RuleService'); // Import RuleService

const PORT = process.env.PORT || 3001;

const chatService = require('./services/chatService');
const seedRulesModule = require('../scripts/seed-rules'); // Import entire module

const ruleService = new RuleService(); // Create an instance of RuleService globally

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database
    await syncDatabase();

    // Seed rules after database sync
    await seedRulesModule.seedRules(ruleService); // Access seedRules from the imported module

    // Initialize services
    await chatService.initialize();
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Chatbot Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

startServer();