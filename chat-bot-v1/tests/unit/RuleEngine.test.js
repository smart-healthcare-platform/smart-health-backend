const RuleEngine = require('../../src/rule-engine/engine/RuleEngine');
const RuleCompiler = require('../../src/rule-engine/compiler/RuleCompiler');

// Mock the RuleCompiler
jest.mock('../../src/rule-engine/compiler/RuleCompiler');

describe('RuleEngine', () => {
  let engine;
  let mockCompiler;

  const mockRules = [
    {
      id: 'rule-1',
      name: 'High Priority Rule',
      priority: 10,
      enabled: true,
      compiledConditions: [{ evaluate: jest.fn().mockReturnValue(true) }],
      compiledActions: [{ execute: jest.fn().mockReturnValue({ type: 'response', message: 'High priority action' }) }]
    },
    {
      id: 'rule-2',
      name: 'Low Priority Rule',
      priority: 1,
      enabled: true,
      compiledConditions: [{ evaluate: jest.fn().mockReturnValue(true) }],
      compiledActions: [{ execute: jest.fn().mockReturnValue({ type: 'response', message: 'Low priority action' }) }]
    },
    {
      id: 'rule-3',
      name: 'Disabled Rule',
      priority: 5,
      enabled: false,
      compiledConditions: [{ evaluate: jest.fn().mockReturnValue(true) }],
      compiledActions: [{ execute: jest.fn().mockReturnValue({ type: 'response', message: 'Disabled action' }) }]
    }
  ];

  beforeEach(() => {
    RuleCompiler.mockClear();
    engine = new RuleEngine();
    mockCompiler = RuleCompiler.mock.instances[0];
    // Mock the compileRules method to return our mock rules
    mockCompiler.compileRules.mockResolvedValue(mockRules);
  });

  test('should initialize and compile rules successfully', async () => {
    await engine.initialize([]); // The argument doesn't matter due to the mock
    expect(mockCompiler.compileRules).toHaveBeenCalled();
    expect(engine.rules).toHaveLength(3);
  });

  test('should sort rules by priority after initialization', async () => {
    await engine.initialize([]);
    // The first rule should be the one with the highest priority
    expect(engine.rules[0].name).toBe('High Priority Rule');
    expect(engine.rules[1].name).toBe('Disabled Rule');
    expect(engine.rules[2].name).toBe('Low Priority Rule');
  });

  test('evaluate should return actions for matched rules', async () => {
    await engine.initialize([]);
    const context = { message: { text: 'test' } };
    const results = await engine.evaluate(context);

    expect(results.matchedRules).toHaveLength(2); // rule-1 and rule-2 (rule-3 is disabled)
    expect(results.actions).toHaveLength(2);
    expect(results.actions[0].message).toBe('High priority action'); // Check if sorted by priority
  });

  test('evaluate should not return actions for non-matched rules', async () => {
    // Make the condition for rule-1 evaluate to false
    mockRules[0].compiledConditions[0].evaluate.mockReturnValueOnce(false);
    await engine.initialize([]);
    
    const context = { message: { text: 'no match' } };
    const results = await engine.evaluate(context);

    // Only rule-2 should match now
    expect(results.matchedRules).toHaveLength(1);
    expect(results.matchedRules[0].ruleId).toBe('rule-2');
    expect(results.actions).toHaveLength(1);
    expect(results.actions[0].message).toBe('Low priority action');
  });

  test('evaluate should return empty results when no rules match', async () => {
    // Make all conditions evaluate to false
    mockRules.forEach(rule => rule.compiledConditions[0].evaluate.mockReturnValue(false));
    await engine.initialize([]);

    const context = { message: { text: 'no match at all' } };
    const results = await engine.evaluate(context);

    expect(results.matchedRules).toHaveLength(0);
    expect(results.actions).toHaveLength(0);
  });

  test('evaluate should not process disabled rules', async () => {
    await engine.initialize([]);
    const context = { message: { text: 'test' } };
    const results = await engine.evaluate(context);
    
    const matchedIds = results.matchedRules.map(r => r.ruleId);
    expect(matchedIds).not.toContain('rule-3');
  });
});