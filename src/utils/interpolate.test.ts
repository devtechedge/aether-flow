import { describe, expect, it } from 'vitest';
import { interpolateTemplate } from './interpolate';

describe('interpolateTemplate', () => {
  it('replaces mustache tokens from the registry', () => {
    expect(
      interpolateTemplate('Hello {{ name }} — {{gmailOutput}}', {
        name: 'Ada',
        gmailOutput: 'inbox empty',
      })
    ).toBe('Hello Ada — inbox empty');
  });

  it('drops unknown tokens instead of leaving braces', () => {
    expect(interpolateTemplate('x={{missing}}', {})).toBe('x=');
  });

  it('returns empty string for a missing template', () => {
    expect(interpolateTemplate('', { a: 1 })).toBe('');
  });
});
