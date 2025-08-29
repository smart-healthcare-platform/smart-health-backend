const { sequelize } = require('../src/models');

// Global test setup
beforeAll(async () => {
  // Sync test database
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Close database connection
  await sequelize.close();
});