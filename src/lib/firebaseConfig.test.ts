import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  FIREBASE_PROJECT_ID,
  PRODUCTION_AUTH_HOSTS,
  firebaseConfig,
  firebaseEnabled,
  GOOGLE_SCOPES,
  originMatchesAuthorizedDomain,
} from './firebaseConfig';

function readSource(): string {
  return readFileSync(new URL('./firebaseConfig.ts', import.meta.url), 'utf8');
}

describe('firebaseConfig', () => {
  it('never hardcodes the web API key', () => {
    // GitHub secret scanning flags any AIza... literal, and the key belongs in
    // VITE_FIREBASE_API_KEY, not in the repo.
    expect(readSource()).not.toMatch(/AIza[A-Za-z0-9_-]{10,}/);
  });

  it('reads the web API key from the environment instead of a fallback', () => {
    // vitest runs without the env var, so the key is empty and auth stays off.
    // Production supplies it through Vercel.
    expect(firebaseConfig.apiKey).toBe('');
    expect(firebaseEnabled).toBe(false);
  });

  it('still exposes the public project defaults', () => {
    expect(firebaseConfig.projectId).toBe(FIREBASE_PROJECT_ID);
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
