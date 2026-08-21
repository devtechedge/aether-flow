import { describe, expect, it } from 'vitest';
import { evaluateLogic, isLogicCodeLengthOk } from './logicEval';

describe('evaluateLogic', () => {
  it('evaluates a simple comparison against geminiOutput', () => {
    expect(
      evaluateLogic('geminiOutput.length > 5', { geminiOutput: 'abcdef' })
    ).toBe(true);
    expect(
      evaluateLogic('geminiOutput.length > 5', { geminiOutput: 'ab' })
    ).toBe(false);
  });

  it('defaults invalid expressions to false', () => {
    expect(evaluateLogic('this is not js', {})).toBe(false);
  });

  it('rejects oversized expressions', () => {
    const huge = 'true && '.repeat(80) + 'true';
    expect(isLogicCodeLengthOk(huge)).toBe(false);
    expect(evaluateLogic(huge, {})).toBe(false);
  });
});
