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
  try {
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
  } catch (error) {
    logger.error('Error creating test data:', error);
  }
};

module.exports = { syncDatabase };