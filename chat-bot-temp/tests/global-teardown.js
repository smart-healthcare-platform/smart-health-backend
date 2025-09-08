const { sequelize } = require('../src/models');
const logger = require('../src/utils/logger');

module.exports = async () => {
  logger.info('Global test teardown: Closing database connection...');
  try {
    await sequelize.close();
    logger.info('Database connection closed.');
  } catch (error) {
    logger.error('Failed during global test teardown:', error);
    process.exit(1); // Exit with error if teardown fails
  }
  logger.info('Global test teardown complete.');
};