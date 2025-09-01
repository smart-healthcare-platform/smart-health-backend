const redisClient = require('../config/redis');
const logger = require('../utils/logger');

class SessionService {
  constructor() {
    this.sessionPrefix = 'session:';
    this.sessionTTL = 3600; // 1 hour in seconds
  }

  async createSession(sessionId, data) {
    try {
      const key = this.sessionPrefix + sessionId;
      await redisClient.setAsync(key, JSON.stringify(data), 'EX', this.sessionTTL);
      logger.debug('Session created:', { sessionId });
      return true;
    } catch (error) {
      logger.error('Error creating session:', error);
      throw error;
    }
  }

  async getSession(sessionId) {
    try {
      const key = this.sessionPrefix + sessionId;
      const data = await redisClient.getAsync(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting session:', error);
      throw error;
    }
  }

  async updateSession(sessionId, data) {
    try {
      const key = this.sessionPrefix + sessionId;
      await redisClient.setAsync(key, JSON.stringify(data), 'EX', this.sessionTTL);
      logger.debug('Session updated:', { sessionId });
      return true;
    } catch (error) {
      logger.error('Error updating session:', error);
      throw error;
    }
  }

  async deleteSession(sessionId) {
    try {
      const key = this.sessionPrefix + sessionId;
      await redisClient.delAsync(key);
      logger.debug('Session deleted:', { sessionId });
      return true;
    } catch (error) {
      logger.error('Error deleting session:', error);
      throw error;
    }
  }
}

module.exports = new SessionService();