const { sequelize, User, Conversation, Message } = require('../models');
const logger = require('./logger');

const syncDatabase = async () => {
  try {
    // Only force sync (drop and recreate tables) if FORCE_DB_SYNC is explicitly true
    const forceSync = process.env.FORCE_DB_SYNC === 'true';
    await sequelize.sync({ force: forceSync });
    logger.info(`Database synchronized successfully (force: ${forceSync})`);
    
    // Create test data if in development and forceSync was true
    if (process.env.NODE_ENV === 'development' && forceSync) {
      await createTestData();
    }
  } catch (error) {
    logger.error('Database synchronization failed:', error);
    throw error;
  }
};

const createTestData = async () => {
  try {
    // Create test user with a fixed UUID for easier testing
    const user = await User.create({
      id: '00000000-0000-0000-0000-000000000001',
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