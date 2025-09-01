const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Rule = sequelize.define('Rule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    validate: { min: 1, max: 10 }
  },
  conditions: {
    type: DataTypes.JSON,
    allowNull: false
  },
  actions: {
    type: DataTypes.JSON,
    allowNull: false
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'vi'
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'rules',
  timestamps: true,
  indexes: [
    { fields: ['priority'] },
    { fields: ['language'] },
    { fields: ['enabled'] }
  ]
});

module.exports = Rule;