require('dotenv').config();
const { sequelize } = require('../src/config/database');
const { applyMigrations } = require('../src/utils/ruleMigrations');
const logger = require('../src/utils/logger');

async function testMigration() {
  try {
    logger.info('Testing database migration...');
    
    // Test connection first
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Apply migrations
    await applyMigrations(sequelize);
    logger.info('Database migration completed successfully');
    
    // Close connection
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Migration test failed:', error);
    process.exit(1);
  }
}

testMigration();