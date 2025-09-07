const RuleEngine = require('../rule-engine/engine/RuleEngine');
const RuleService = require('../rule-engine/storage/RuleService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const { Conversation, Message } = require('../models'); // Import Conversation and Message models

class ChatService {
  constructor() {
    this.ruleEngine = new RuleEngine();
    this.ruleService = new RuleService();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      logger.debug('ChatService already initialized.');
      return;
    }

    try {
      await this.reinitializeRuleEngine(); // Initial load of rules
      this.isInitialized = true;
      logger.info('ChatService initialized successfully with Rule Engine.');
    } catch (error) {
      logger.error('Failed to initialize ChatService with Rule Engine:', error);
      throw error;
    }
  }

  async reinitializeRuleEngine() {
    try {
      // Invalidate RuleService cache to ensure fresh rules are loaded
      this.ruleService.invalidateCache();
      const rules = await this.ruleService.getAllRules();
      await this.ruleEngine.initialize(rules);
      logger.info(`Rule Engine reinitialized with ${rules.length} rules.`);
    } catch (error) {
      logger.error('Failed to reinitialize Rule Engine:', error);
      throw error;
    }
  }

  async processMessage(messageData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const { message, userId, sessionId, language = 'vi' } = messageData;
    const currentSessionId = sessionId || uuidv4();

    const context = {
      message: {
        text: message,
        language: language
      },
      user: {
        id: userId,
        sessionId: currentSessionId
      },
      timestamp: new Date().toISOString()
    };
    logger.debug(`Processing message: ${message}, Language: ${language}, UserId: ${userId}, SessionId: ${currentSessionId}`);

    try {
      const ruleResults = await this.ruleEngine.evaluate(context);
      
      let responsePayload;
      
      if (ruleResults.actions.length > 0) {
        // A rule was matched, use the highest priority action
        responsePayload = this.handleRuleBasedResponse(ruleResults, context);
      } else {
        // No rules matched, fallback to another handler (e.g., AI)
        responsePayload = await this.handleAIFallback(messageData, context);
      }

      // Implement conversation history storage here
      await this.storeConversation(messageData, responsePayload, ruleResults, currentSessionId);

      return {
        response: responsePayload.message,
        sessionId: currentSessionId,
        urgency: responsePayload.urgency,
        source: responsePayload.source,
        ruleMatches: ruleResults.matchedRules.map(r => r.ruleName),
        executionTime: ruleResults.executionTime
      };

    } catch (error) {
      logger.error('Message processing failed:', { error: error.message, context });
      return this.handleErrorResponse(error, currentSessionId);
    }
  }

  handleRuleBasedResponse(ruleResults) {
    // Get the highest priority action
    const primaryAction = ruleResults.actions[0];
    
    return {
      message: primaryAction.message || 'Action triggered by rule.',
      urgency: primaryAction.urgency || 'NORMAL',
      source: 'rule_engine',
      ruleId: primaryAction.ruleId
    };
  }

  async handleAIFallback(messageData) {
    // This is the fallback when no rules match.
    // For now, it returns a default message.
    // Later, this can be integrated with an AI model like Ollama.
    logger.debug('No rule matched. Using AI fallback.', { userId: messageData.userId });
    return {
      message: 'Thank you for your message. How else can I assist you?',
      urgency: 'INFO',
      source: 'ai_fallback'
    };
  }

  handleErrorResponse(error, sessionId) {
    return {
      response: 'Sorry, I encountered an internal error. Please try again later.',
      sessionId: sessionId,
      urgency: 'SYSTEM_ERROR',
      source: 'error_handler',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }

  async storeConversation(messageData, responsePayload, ruleResults, sessionId) {
    try {
      let conversation = await Conversation.findOne({ where: { sessionId } });

      if (!conversation) {
        // Create a new conversation if it doesn't exist
        conversation = await Conversation.create({
          sessionId,
          userId: messageData.userId // Assuming userId is always present
        });
        logger.debug('New conversation created.', { conversationId: conversation.id });
      }

      // Store user message
      await Message.create({
        conversationId: conversation.id,
        content: messageData.message,
        type: 'USER',
        urgencyLevel: 'NORMAL' // User messages typically don't have urgency
      });

      // Store bot response
      await Message.create({
        conversationId: conversation.id,
        content: responsePayload.message,
        type: 'BOT',
        urgencyLevel: responsePayload.urgency || 'NORMAL'
      });

      logger.debug('Messages stored for conversation.', { conversationId: conversation.id });
    } catch (error) {
      logger.error('Failed to store conversation history:', { error: error.message, sessionId });
      // Do not re-throw, as history storage should not block chat functionality
    }
  }
}

// Singleton instance
const chatServiceInstance = new ChatService();
module.exports = chatServiceInstance;