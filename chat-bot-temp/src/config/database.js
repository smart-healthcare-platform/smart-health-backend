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
        mysql_native_password: () => require('mysql2/lib/auth_plugins/mysql_native_password')
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