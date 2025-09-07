const RuleCompiler = require('../compiler/RuleCompiler');
const logger = require('../../utils/logger');

class RuleEngine {
  constructor() {
    this.compiler = new RuleCompiler();
    this.rules = [];
  }

  async initialize(rules) {
    try {
      this.rules = await this.compiler.compileRules(rules);
      // Sort rules by priority, descending. Higher priority runs first.
      this.rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      logger.info(`Rule engine initialized with ${this.rules.length} rules.`);
    } catch (error) {
      logger.error('Rule engine initialization failed:', error);
      throw error;
    }
  }

  async evaluate(context) {
    const results = {
      matchedRules: [],
      actions: [],
      executionTime: 0
    };

    const startTime = Date.now();

    try {
      for (const rule of this.rules) {
        if (!rule.enabled) continue;

        const ruleResult = await this.evaluateRule(rule, context);
        if (ruleResult.matched) {
          logger.debug(`Rule matched: ${rule.name} (ID: ${rule.id})`);
          results.matchedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            priority: rule.priority
          });

          results.actions.push(...ruleResult.actions);
        }
      }

      // Sort final actions by rule priority
      results.actions.sort((a, b) => b.priority - a.priority);
      
    } catch (error) {
      logger.error('Rule evaluation failed during execution:', error);
      // Depending on policy, you might want to re-throw or just log
    } finally {
      results.executionTime = Date.now() - startTime;
      logger.debug(`Rule evaluation completed in ${results.executionTime}ms. Matched ${results.matchedRules.length} rules.`);
    }

    return results;
  }

  async evaluateRule(rule, context) {
    const result = {
      matched: true,
      actions: []
    };

    try {
      // All conditions must be met (AND logic)
      for (const condition of rule.compiledConditions) {
        if (!condition.evaluate(context)) {
          result.matched = false;
          break;
        }
      }

      if (result.matched) {
        // If matched, execute all associated actions
        for (const action of rule.compiledActions) {
          const actionResult = action.execute(context);
          result.actions.push({
            ...actionResult,
            ruleId: rule.id,
            ruleName: rule.name,
            priority: rule.priority
          });
        }
      }
    } catch (error) {
      logger.error(`Rule evaluation failed for rule ${rule.id}:`, error);
      result.matched = false;
    }

    return result;
  }
}

module.exports = RuleEngine;