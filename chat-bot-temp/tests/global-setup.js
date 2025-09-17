const { sequelize, User } = require('../src/models');
const { seedRules } = require('../scripts/seed-rules');
const RuleService = require('../src/rule-engine/storage/RuleService');
const logger = require('../src/utils/logger');

module.exports = async () => {
  logger.info('Global test setup: Syncing database and seeding rules...');
  try {
    // Sync all models (including rules) and force recreate tables for a clean test environment
    await sequelize.sync({ force: true });
    logger.info('Database synced successfully.');

    // Create a test user for foreign key constraints
    await User.findOrCreate({
      where: { id: 'test-user-id' },
      defaults: { username: 'testuser', email: 'test@example.com' }
    });
    logger.info('Test user created/found.');

    // Seed rules for integration tests
    const ruleService = new RuleService();
    await seedRules(ruleService);
    logger.info('Rules seeded successfully.');

  } catch (error) {
    logger.error('Failed during global test setup:', error);
    process.exit(1); // Exit with error if setup fails
  }
  logger.info('Global test setup complete.');
};