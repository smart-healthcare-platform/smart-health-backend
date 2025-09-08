const RuleParser = require('../parser/RuleParser');
const logger = require('../../utils/logger');

class RuleCompiler {
  constructor() {
    this.parser = new RuleParser();
    this.compiledRules = new Map();
  }

  async compileRule(ruleData) {
    try {
      const compiledRule = this.parser.parseRule(ruleData);
      this.compiledRules.set(ruleData.id, compiledRule);
      logger.debug(`Rule compiled successfully: ${ruleData.id}`);
      return compiledRule;
    } catch (error) {
      logger.error(`Rule compilation failed for rule ${ruleData.id}:`, error);
      throw error;
    }
  }

  async compileRules(rules) {
    const compiledRules = [];
    
    for (const rule of rules) {
      try {
        const compiledRule = await this.compileRule(rule);
        compiledRules.push(compiledRule);
      } catch (error) {
        logger.warn(`Skipping invalid rule ${rule.id}:`, { error: error.message });
      }
    }
    
    logger.info(`${compiledRules.length} out of ${rules.length} rules compiled.`);
    return compiledRules;
  }

  getCompiledRule(ruleId) {
    return this.compiledRules.get(ruleId);
  }

  clearCompiledRules() {
    this.compiledRules.clear();
    logger.info('Compiled rules cache cleared.');
  }
}

module.exports = RuleCompiler;