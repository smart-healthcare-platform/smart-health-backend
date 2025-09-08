const RuleEngine = require('../rule-engine/engine/RuleEngine');
const RuleService = require('../rule-engine/storage/RuleService');
const ragService = require('./ragService'); // Import RAG Service
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const { Conversation, Message } = require('../models'); // Import Conversation and Message models

class ChatService {
  constructor() {
    this.ruleEngine = new RuleEngine();
    this.ruleService = new RuleService();
    this.ragService = ragService;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      logger.debug('ChatService already initialized.');
      return;
    }

    try {
      await this.reinitializeRuleEngine(); // Initial load of rules
      await this.ragService.initialize(); // Initialize RAG service
      this.isInitialized = true;
      logger.info('ChatService initialized successfully with Rule Engine and RAG Service.');
    } catch (error) {
      logger.error('Failed to initialize ChatService:', error);
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

  async handleAIFallback(messageData, context) {
    logger.debug('No rule matched. Using AI fallback with RAG.', { userId: messageData.userId });

    try {
      const retrievedDocs = await this.ragService.query(context.message.text);
      
      let ragContext = "No additional information found.";
      if (retrievedDocs && retrievedDocs.length > 0) {
        ragContext = retrievedDocs.join('\n\n---\n\n');
      }

      // Construct a detailed prompt for the AI
      const prompt = `Based on the following medical information: \n\n${ragContext}\n\nPlease provide a helpful and safe response to the user's query: "${context.message.text}"`;

      // In a real implementation, you would send this prompt to Ollama.
      // For this demo, we will simulate the AI response.
      const simulatedAIResponse = `(Simulated AI Response) Based on our documents, for a query about "${context.message.text}", I recommend consulting a doctor.`;

      logger.debug('AI prompt prepared with RAG context.', { prompt: prompt.substring(0, 200) + '...' });

      return {
        message: simulatedAIResponse,
        urgency: 'INFO',
        source: 'ai_rag_fallback'
      };

    } catch (error) {
      logger.error('RAG-based AI fallback failed:', error);
      // Fallback to a simpler AI response if RAG fails
      return {
        message: 'I am having trouble accessing my knowledge base, but I will try to help. How can I assist you?',
        urgency: 'SYSTEM_WARNING',
        source: 'ai_fallback_no_rag'
      };
    }
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