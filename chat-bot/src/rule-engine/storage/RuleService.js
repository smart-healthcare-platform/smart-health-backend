const Rule = require('./Rule');
const logger = require('../../utils/logger');

class RuleService {
  constructor() {
    // Simple in-memory cache
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  async getAllRules() {
    const cacheKey = 'all_rules';
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.cacheTTL)) {
      logger.debug('Returning all rules from cache.');
      return cached.data;
    }

    try {
      logger.debug('Fetching all enabled rules from database.');
      const rules = await Rule.findAll({
        where: { enabled: true },
        order: [['priority', 'DESC']]
      });

      this.cache.set(cacheKey, { data: rules, timestamp: Date.now() });
      return rules;
    } catch (error) {
      logger.error('Failed to fetch rules from database:', error);
      throw error;
    }
  }

  async getRuleById(ruleId) {
    const cacheKey = `rule_${ruleId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.cacheTTL)) {
      logger.debug(`Returning rule ${ruleId} from cache.`);
      return cached.data;
    }

    try {
      logger.debug(`Fetching rule ${ruleId} from database.`);
      const rule = await Rule.findByPk(ruleId);
      if (rule) {
        this.cache.set(cacheKey, { data: rule, timestamp: Date.now() });
      }
      return rule;
    } catch (error) {
      logger.error(`Failed to fetch rule ${ruleId}:`, error);
      throw error;
    }
  }

  async createRule(ruleData) {
    try {
      const rule = await Rule.create(ruleData);
      this.invalidateCache();
      logger.info(`Rule created successfully: ${rule.id}`);
      return rule;
    } catch (error) {
      logger.error('Failed to create rule:', error);
      throw error;
    }
  }

  async updateRule(ruleId, updates) {
    try {
      const [affectedCount] = await Rule.update(updates, {
        where: { id: ruleId }
      });
      
      if (affectedCount > 0) {
        this.invalidateCache(ruleId);
        logger.info(`Rule updated successfully: ${ruleId}`);
      }
      
      return affectedCount;
    } catch (error) {
      logger.error(`Failed to update rule ${ruleId}:`, error);
      throw error;
    }
  }

  async deleteRule(ruleId) {
    try {
      const affectedCount = await Rule.destroy({
        where: { id: ruleId }
      });
      
      if (affectedCount > 0) {
        this.invalidateCache(ruleId);
        logger.info(`Rule deleted successfully: ${ruleId}`);
      }
      
      return affectedCount;
    } catch (error) {
      logger.error(`Failed to delete rule ${ruleId}:`, error);
      throw error;
    }
  }

  invalidateCache(ruleId = null) {
    if (ruleId) {
      this.cache.delete(`rule_${ruleId}`);
    }
    this.cache.delete('all_rules');
    logger.debug('Rule cache invalidated.', { ruleId });
  }
}

module.exports = RuleService;