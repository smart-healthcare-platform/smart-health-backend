const RuleParser = require('../../src/rule-engine/parser/RuleParser');

describe('RuleParser', () => {
  let parser;

  beforeEach(() => {
    parser = new RuleParser();
  });

  // Test case for a valid rule
  test('should parse a valid rule without errors', () => {
    const ruleData = {
      id: 'test-rule-1',
      name: 'Valid Test Rule',
      conditions: [{ field: 'message.text', operator: 'contains', value: 'hello' }],
      actions: [{ type: 'response', payload: { message: 'Hi there!' } }]
    };
    const parsedRule = parser.parseRule(ruleData);
    expect(parsedRule).toBeDefined();
    expect(parsedRule.compiledConditions).toHaveLength(1);
    expect(typeof parsedRule.compiledConditions[0].evaluate).toBe('function');
    expect(parsedRule.compiledActions).toHaveLength(1);
    expect(typeof parsedRule.compiledActions[0].execute).toBe('function');
  });

  // Test cases for invalid rules
  test('should throw an error for a rule missing conditions', () => {
    const ruleData = {
      id: 'test-rule-2',
      name: 'Invalid Rule',
      actions: [{ type: 'response', payload: { message: 'Action' } }]
    };
    expect(() => parser.parseRule(ruleData)).toThrow('Invalid rule format: Missing required field: conditions');
  });

  test('should throw an error for a rule with empty conditions', () => {
    const ruleData = {
      id: 'test-rule-3',
      name: 'Invalid Rule',
      conditions: [],
      actions: [{ type: 'response', payload: { message: 'Action' } }]
    };
    expect(() => parser.parseRule(ruleData)).toThrow('Invalid rule format: Conditions must be a non-empty array');
  });

  test('should throw an error for a condition with an unsupported operator', () => {
    const ruleData = {
      id: 'test-rule-4',
      name: 'Invalid Operator Rule',
      conditions: [{ field: 'message.text', operator: 'isExactly', value: 'test' }],
      actions: [{ type: 'response', payload: { message: 'Action' } }]
    };
    expect(() => parser.parseRule(ruleData)).toThrow('Invalid rule format: Unsupported operator: isExactly');
  });

  // Test cases for condition evaluation
  describe('Condition Evaluation', () => {
    const context = {
      message: { text: 'Hello world, this is a test.', number: 100 },
      user: { language: 'en' }
    };

    test('operator "contains" should work correctly', () => {
      const condition = { field: 'message.text', operator: 'contains', value: 'world' };
      const compiledCondition = parser.compileConditions([condition])[0];
      expect(compiledCondition.evaluate(context)).toBe(true);
    });

    test('operator "contains" with array should work correctly', () => {
        const condition = { field: 'message.text', operator: 'contains', value: ['test', 'fail'] };
        const compiledCondition = parser.compileConditions([condition])[0];
        expect(compiledCondition.evaluate(context)).toBe(true);
      });

    test('operator "equals" should work correctly', () => {
      const condition = { field: 'user.language', operator: 'equals', value: 'en' };
      const compiledCondition = parser.compileConditions([condition])[0];
      expect(compiledCondition.evaluate(context)).toBe(true);
    });
    
    test('operator "matches" should work correctly with regex', () => {
        const condition = { field: 'message.text', operator: 'matches', value: '^hello' };
        const compiledCondition = parser.compileConditions([condition])[0];
        expect(compiledCondition.evaluate(context)).toBe(true);
      });

    test('operator "greaterThan" should work correctly', () => {
      const condition = { field: 'message.number', operator: 'greaterThan', value: 99 };
      const compiledCondition = parser.compileConditions([condition])[0];
      expect(compiledCondition.evaluate(context)).toBe(true);
    });

    test('operator "lessThan" should work correctly', () => {
      const condition = { field: 'message.number', operator: 'lessThan', value: 101 };
      const compiledCondition = parser.compileConditions([condition])[0];
      expect(compiledCondition.evaluate(context)).toBe(true);
    });

    test('should return false if field does not exist in context', () => {
        const condition = { field: 'message.nonexistent', operator: 'equals', value: 'test' };
        const compiledCondition = parser.compileConditions([condition])[0];
        expect(compiledCondition.evaluate(context)).toBe(false);
    });
  });
});