import { describe, expect, it } from 'vitest';
import {
  FIREBASE_PROJECT_ID,
  PRODUCTION_AUTH_HOSTS,
  firebaseConfig,
  firebaseEnabled,
  GOOGLE_SCOPES,
  originMatchesAuthorizedDomain,
} from './firebaseConfig';

describe('firebaseConfig', () => {
  it('ships a complete production web client config', () => {
    expect(firebaseEnabled).toBe(true);
    expect(firebaseConfig.projectId).toBe(FIREBASE_PROJECT_ID);
    expect(firebaseConfig.apiKey.startsWith('AIza')).toBe(true);
    expect(firebaseConfig.authDomain).toBe(`${FIREBASE_PROJECT_ID}.firebaseapp.com`);
    expect(firebaseConfig.appId).toContain(':web:');
  });

  it('requests Gmail, Drive, and Docs scopes the IDE nodes actually call', () => {
    expect(GOOGLE_SCOPES.some((scope) => scope.includes('gmail.readonly'))).toBe(true);
    expect(GOOGLE_SCOPES.some((scope) => scope.includes('drive.file'))).toBe(true);
    expect(GOOGLE_SCOPES.some((scope) => scope.endsWith('/documents'))).toBe(true);
  });

  it('lists the live Vercel hosts that Firebase must authorize', () => {
    expect(PRODUCTION_AUTH_HOSTS).toContain('aetherflow-ide.vercel.app');
  });
});

describe('originMatchesAuthorizedDomain', () => {
  const domains = [
    'speedy-equator-122704.firebaseapp.com',
    'aetherflow-ide.vercel.app',
  ];

  it('allows localhost without an explicit list entry', () => {
    expect(originMatchesAuthorizedDomain('localhost', [])).toBe(true);
    expect(originMatchesAuthorizedDomain('127.0.0.1', domains)).toBe(true);
  });

  it('matches an exact host and a parent-domain suffix', () => {
    expect(originMatchesAuthorizedDomain('aetherflow-ide.vercel.app', domains)).toBe(true);
    expect(originMatchesAuthorizedDomain('speedy-equator-122704.firebaseapp.com', domains)).toBe(
      true
    );
    expect(
      originMatchesAuthorizedDomain('preview.aetherflow-ide.vercel.app', ['vercel.app'])
    ).toBe(true);
  });

  it('rejects a host that is not on the list', () => {
    expect(originMatchesAuthorizedDomain('evil.example', domains)).toBe(false);
    expect(originMatchesAuthorizedDomain('aetherflow-ide.vercel.app', ['firebaseapp.com'])).toBe(
      false
    );
  });
});
