/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
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

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/documents',
];

REQUIRED_SCOPES.forEach((scope) => provider.addScope(scope));

if (firebaseEnabled) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

let cachedAccessToken: string | null = null;

export { auth };

type TokenBag = {
  _tokenResponse?: {
    oauthAccessToken?: string;
    oauthIdToken?: string;
  };
};

async function tokenFromCredential(result: UserCredential): Promise<string> {
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const bag = result as UserCredential & TokenBag;
  const fromOauth =
    credential?.accessToken ||
    bag._tokenResponse?.oauthAccessToken ||
    '';
  if (fromOauth) return fromOauth;
  return result.user.getIdToken();
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (!auth) {
    onAuthFailure?.();
    return () => {};
  }

  void getRedirectResult(auth)
    .then(async (result) => {
      if (!result) return;
      cachedAccessToken = await tokenFromCredential(result);
      onAuthSuccess?.(result.user, cachedAccessToken);
    })
    .catch(() => {
      /* no pending redirect, or user cancelled */
    });

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = cachedAccessToken || (await user.getIdToken());
      cachedAccessToken = token;
      onAuthSuccess?.(user, token);
    } else {
      cachedAccessToken = null;
      onAuthFailure?.();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (!auth) {
    throw new Error(
      'Google sign-in is not configured on this deployment. Set VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID, then redeploy.'
    );
  }

  try {
    const result = await signInWithPopup(auth, provider);
    cachedAccessToken = await tokenFromCredential(result);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err: unknown) {
    const code = typeof err === 'object' && err && 'code' in err ? String((err as { code?: string }).code) : '';
    const popupBlocked =
      code === 'auth/popup-blocked' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/operation-not-supported-in-this-environment';
    if (popupBlocked) {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw err;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  if (!auth?.currentUser) return null;
  cachedAccessToken = await auth.currentUser.getIdToken();
  return cachedAccessToken;
};

export const logout = async () => {
  if (auth) await auth.signOut();
  cachedAccessToken = null;
};
