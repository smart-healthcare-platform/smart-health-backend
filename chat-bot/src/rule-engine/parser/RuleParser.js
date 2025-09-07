const logger = require('../../utils/logger');

class RuleParser {
  constructor() {
    this.operators = (() => {
      const ops = {
        'contains': (fieldValue, conditionValue) => {
          if (typeof fieldValue !== 'string') return false;
          if (Array.isArray(conditionValue)) {
            return conditionValue.some(val =>
              fieldValue.toLowerCase().includes(String(val).toLowerCase())
            );
          }
          return fieldValue.toLowerCase().includes(String(conditionValue).toLowerCase());
        },
        'equals': (fieldValue, conditionValue) => fieldValue === conditionValue,
        'matches': (fieldValue, conditionValue) => {
          if (typeof fieldValue !== 'string') return false;
          const regex = new RegExp(conditionValue, 'i');
          return regex.test(fieldValue);
        },
        'greaterThan': (fieldValue, conditionValue) => parseFloat(fieldValue) > parseFloat(conditionValue),
        'lessThan': (fieldValue, conditionValue) => parseFloat(fieldValue) < parseFloat(conditionValue)
      };
      return ops;
    })();
  }

  parseRule(ruleData) {
    try {
      this.validateRule(ruleData);
      
      return {
        ...ruleData,
        compiledConditions: this.compileConditions(ruleData.conditions),
        compiledActions: this.compileActions(ruleData.actions)
      };
    } catch (error) {
      logger.error('Rule parsing failed:', { ruleId: ruleData.id, error: error.message });
      throw new Error(`Invalid rule format: ${error.message}`);
    };
  }

  validateRule(rule) {
    const requiredFields = ['id', 'name', 'conditions', 'actions'];
    requiredFields.forEach(field => {
      if (!rule[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    });

    if (!Array.isArray(rule.conditions) || rule.conditions.length === 0) {
      throw new Error('Conditions must be a non-empty array');
    }

    if (!Array.isArray(rule.actions) || rule.actions.length === 0) {
      throw new Error('Actions must be a non-empty array');
    }
  }

  compileConditions(conditions) {
    return conditions.map(condition => {
      if (!this.operators[condition.operator]) {
        throw new Error(`Unsupported operator: ${condition.operator}`);
      }
      
      return {
        field: condition.field,
        operator: condition.operator,
        value: condition.value,
        evaluate: (context) => {
          const fieldValue = this.getFieldValue(context, condition.field);
          if (fieldValue === undefined || fieldValue === null) {
            return false;
          }
          return this.operators[condition.operator](fieldValue, condition.value);
        }
      };
    });
  }

  compileActions(actions) {
    return actions.map(action => ({
      type: action.type,
      payload: action.payload,
      execute: (context) => this.executeAction(action, context)
    }));
  }

  getFieldValue(context, fieldPath) {
    return fieldPath.split('.').reduce((obj, key) => obj?.[key], context);
  }

  executeAction(action, context) {
    switch (action.type) {
      case 'response':
        return {
          message: action.payload.message,
          urgency: action.payload.urgency || 'NORMAL',
          source: 'rule_engine'
        };
      case 'call_ai':
        // This action type will trigger AI fallback.
        // The message here can be a prompt for the AI or a default message
        // indicating AI will be used.
        return {
          message: action.payload.message || 'AI is processing your request.',
          urgency: action.payload.urgency || 'INFO',
          source: 'ai_trigger'
        };
      case 'escalate_to_human':
        return {
          message: action.payload.message || 'Escalating to a human agent.',
          urgency: 'HIGH',
          source: 'human_escalation'
        };
      case 'collect_info':
        return {
          message: action.payload.message,
          urgency: 'INFO',
          source: 'info_collection',
          data: action.payload.data // e.g., fields to collect
        };
      default:
        logger.warn(`Unsupported action type: ${action.type}. Returning default payload.`, { action });
        return {
          message: `Unhandled action: ${action.type}.`,
          urgency: 'NORMAL',
          source: 'unhandled_action',
          ...action.payload
        };
    }
  }
}

module.exports = RuleParser;