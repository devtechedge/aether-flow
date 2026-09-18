/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  type Auth,
  type User,
  type UserCredential,
} from 'firebase/auth';
import {
  FIREBASE_CONSOLE_AUTH_SETTINGS,
  firebaseConfig,
  firebaseEnabled,
  GOOGLE_SCOPES,
  originMatchesAuthorizedDomain,
} from './firebaseConfig';

export { firebaseEnabled, FIREBASE_CONSOLE_AUTH_SETTINGS, originMatchesAuthorizedDomain };

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
GOOGLE_SCOPES.forEach((scope) => provider.addScope(scope));

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

function getFirebaseAuth(): Auth | null {
  if (!firebaseEnabled) return null;
  if (auth) return auth;
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  return auth;
}

type TokenBag = {
  _tokenResponse?: {
    oauthAccessToken?: string;
    oauthIdToken?: string;
  };
};

let cachedGoogleAccessToken: string | null = null;

function googleAccessTokenFrom(result: UserCredential): string | null {
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const bag = result as UserCredential & TokenBag;
  return credential?.accessToken || bag._tokenResponse?.oauthAccessToken || null;
}

export function formatAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err && 'code' in err ? String((err as { code?: string }).code) : '';
  const message =
    typeof err === 'object' && err && 'message' in err
      ? String((err as { message?: string }).message)
      : String(err || 'Unknown auth error');

  if (code === 'auth/unauthorized-domain' || /unauthorized-domain/i.test(message)) {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'this host';
    return (
      `Google blocked ${host}. Add it under Authorized domains, then retry. ` +
      FIREBASE_CONSOLE_AUTH_SETTINGS
    );
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in was closed before completing.';
  }
  if (code === 'auth/cancelled-popup-request') {
    return 'Google sign-in was cancelled.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'That Google account is already linked with a different sign-in method.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error during Google sign-in. Check connectivity and retry.';
  }
  return message.replace(/^Firebase:\s*/i, '').replace(/\s*\([^)]*\)\s*$/, '').trim() || message;
}

async function assertAuthorizedOrigin(): Promise<void> {
  if (typeof window === 'undefined') return;
  const host = window.location.hostname;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects?key=${encodeURIComponent(firebaseConfig.apiKey)}`
    );
    if (!res.ok) return;
    const data = (await res.json()) as { authorizedDomains?: string[] };
    if (!originMatchesAuthorizedDomain(host, data.authorizedDomains || [])) {
      const err = new Error('unauthorized-domain') as Error & { code: string };
      err.code = 'auth/unauthorized-domain';
      throw err;
    }
  } catch (err) {
    const code =
      typeof err === 'object' && err && 'code' in err ? String((err as { code?: string }).code) : '';
    if (code === 'auth/unauthorized-domain') throw err;
  }
}

export const initAuth = (
  onAuthSuccess?: (user: User, googleAccessToken: string | null) => void,
  onAuthFailure?: () => void
) => {
  const currentAuth = getFirebaseAuth();
  if (!currentAuth) {
    onAuthFailure?.();
    return () => {};
  }

  void getRedirectResult(currentAuth)
    .then((result) => {
      if (!result) return;
      cachedGoogleAccessToken = googleAccessTokenFrom(result);
      onAuthSuccess?.(result.user, cachedGoogleAccessToken);
    })
    .catch(() => {
      /* no pending redirect, or user cancelled */
    });

  return onAuthStateChanged(currentAuth, (user: User | null) => {
    if (user) {
      onAuthSuccess?.(user, cachedGoogleAccessToken);
    } else {
      cachedGoogleAccessToken = null;
      onAuthFailure?.();
    }
  });
};

export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string | null;
} | null> => {
  const currentAuth = getFirebaseAuth();
  if (!currentAuth) {
    throw new Error('Google sign-in is not configured.');
  }

  await assertAuthorizedOrigin();

  try {
    const result = await signInWithPopup(currentAuth, provider);
    cachedGoogleAccessToken = googleAccessTokenFrom(result);
    return { user: result.user, accessToken: cachedGoogleAccessToken };
  } catch (err: unknown) {
    const code =
      typeof err === 'object' && err && 'code' in err ? String((err as { code?: string }).code) : '';
    const popupBlocked =
      code === 'auth/popup-blocked' ||
      code === 'auth/operation-not-supported-in-this-environment';
    if (popupBlocked) {
      await signInWithRedirect(currentAuth, provider);
      return null;
    }
    throw new Error(formatAuthError(err));
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedGoogleAccessToken;
};

export const logout = async () => {
  const currentAuth = getFirebaseAuth();
  if (currentAuth) await currentAuth.signOut();
  cachedGoogleAccessToken = null;
};
