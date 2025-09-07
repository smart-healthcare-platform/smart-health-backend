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
    type: DataTypes.ENUM('NORMAL', 'INFO', 'URGENT', 'CRITICAL', 'HIGH', 'SYSTEM_ERROR'),
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