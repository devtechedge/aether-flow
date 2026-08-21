export interface LogicContext {
  emails?: unknown;
  docsContent?: unknown;
  geminiOutput?: unknown;
}

const MAX_CODE_LENGTH = 240;

/**
 * Evaluate a one-line decision expression against a small context object.
 * This is NOT a sandbox. It uses `Function` in the user's own browser on
 * graph JSON they control. See SECURITY.md.
 */
export function evaluateLogic(code: string, ctx: LogicContext): boolean {
  const evalCode = (code || 'true').trim();
  if (!evalCode || evalCode.length > MAX_CODE_LENGTH) return false;

  try {
    const fn = new Function(
      'emails',
      'docsContent',
      'geminiOutput',
      `"use strict"; return (${evalCode});`
    );
    return !!fn(ctx.emails, ctx.docsContent, ctx.geminiOutput);
  } catch {
    return false;
  }
}

export function isLogicCodeLengthOk(code: string): boolean {
  return (code || '').trim().length <= MAX_CODE_LENGTH;
}
