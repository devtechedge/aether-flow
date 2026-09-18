import { describe, expect, it } from 'vitest';
import { FIREBASE_CONSOLE_AUTH_SETTINGS } from './firebaseConfig';
import { formatAuthError } from './firebase';

describe('formatAuthError', () => {
  it('points at Firebase authorized-domain settings for unauthorized-domain', () => {
    const message = formatAuthError({
      code: 'auth/unauthorized-domain',
      message: 'This domain is not authorized for OAuth operations.',
    });
    expect(message).toContain('Authorized domains');
    expect(message).toContain(FIREBASE_CONSOLE_AUTH_SETTINGS);
  });

  it('treats a closed popup as a cancelled sign-in', () => {
    expect(formatAuthError({ code: 'auth/popup-closed-by-user' })).toMatch(/closed/i);
  });
});
