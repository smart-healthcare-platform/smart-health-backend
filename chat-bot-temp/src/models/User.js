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