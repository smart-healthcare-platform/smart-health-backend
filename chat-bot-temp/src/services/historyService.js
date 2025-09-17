const { Conversation, Message } = require('../models');

/**
 * Get conversation history for a user
 * @param {string} userId - The user ID
 * @param {number} limit - The number of conversations to return
 * @param {number} offset - The pagination offset
 * @returns {Promise<Array>} The conversation history
 */
async function getConversationHistory(userId, limit = 10, offset = 0) {
  try {
    // Get conversations for the user
    const conversations = await Conversation.findAll({
      where: { userId },
      order: [['startTime', 'DESC']],
      limit,
      offset,
      include: [{
        model: Message,
        order: [['timestamp', 'ASC']]
      }]
    });

    return conversations;
  } catch (error) {
    throw new Error(`Failed to retrieve conversation history: ${error.message}`);
  }
}

module.exports = { getConversationHistory };