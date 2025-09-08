const RuleCompiler = require('../../src/rule-engine/compiler/RuleCompiler');
const RuleParser = require('../../src/rule-engine/parser/RuleParser');

// Mock the RuleParser to isolate the RuleCompiler
jest.mock('../../src/rule-engine/parser/RuleParser');

describe('RuleCompiler', () => {
  let compiler;
  let mockParser;

  beforeEach(() => {
    // Reset the mock before each test
    RuleParser.mockClear();
    compiler = new RuleCompiler();
    // Get the mock instance
    mockParser = RuleParser.mock.instances[0];
  });

  const validRule = {
    id: 'valid-rule',
    name: 'A Valid Rule',
    conditions: [{ field: 'message.text', operator: 'contains', value: 'valid' }],
    actions: [{ type: 'response', payload: { message: 'Valid' } }]
  };

  const invalidRule = {
    id: 'invalid-rule',
    name: 'An Invalid Rule' // Missing conditions and actions
  };

  test('should create a RuleParser instance', () => {
    expect(RuleParser).toHaveBeenCalledTimes(1);
  });

  test('should compile a single valid rule successfully', async () => {
    const parsedRule = { ...validRule, compiledConditions: [], compiledActions: [] };
    mockParser.parseRule.mockReturnValue(parsedRule);

    const result = await compiler.compileRule(validRule);

    expect(mockParser.parseRule).toHaveBeenCalledWith(validRule);
    expect(result).toEqual(parsedRule);
    expect(compiler.getCompiledRule('valid-rule')).toEqual(parsedRule);
  });

  test('should throw an error if rule parsing fails', async () => {
    const error = new Error('Parsing failed');
    mockParser.parseRule.mockImplementation(() => {
      throw error;
    });

    await expect(compiler.compileRule(invalidRule)).rejects.toThrow(error);
  });

  test('should compile a list of rules, skipping invalid ones', async () => {
    const parsedRule = { ...validRule, compiledConditions: [], compiledActions: [] };
    mockParser.parseRule
      .mockReturnValueOnce(parsedRule) // First call for validRule
      .mockImplementationOnce(() => { // Second call for invalidRule
        throw new Error('Parsing failed');
      });

    const rules = [validRule, invalidRule];
    const results = await compiler.compileRules(rules);

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(parsedRule);
    expect(mockParser.parseRule).toHaveBeenCalledTimes(2);
  });

  test('getCompiledRule should return a compiled rule from the map', async () => {
    const parsedRule = { ...validRule, compiledConditions: [], compiledActions: [] };
    mockParser.parseRule.mockReturnValue(parsedRule);

    await compiler.compileRule(validRule);
    const retrievedRule = compiler.getCompiledRule('valid-rule');

    expect(retrievedRule).toEqual(parsedRule);
  });

  test('getCompiledRule should return undefined for a non-existent rule', () => {
    const retrievedRule = compiler.getCompiledRule('non-existent');
    expect(retrievedRule).toBeUndefined();
  });

  test('clearCompiledRules should empty the compiled rules map', async () => {
    const parsedRule = { ...validRule, compiledConditions: [], compiledActions: [] };
    mockParser.parseRule.mockReturnValue(parsedRule);

    await compiler.compileRule(validRule);
    expect(compiler.getCompiledRule('valid-rule')).toBeDefined();

    compiler.clearCompiledRules();
    expect(compiler.getCompiledRule('valid-rule')).toBeUndefined();
  });
});