/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Web client config for analog-compiler-6n50x. Firebase web API keys are
 * public by design and restricted by authorized domains + HTTP referrers.
 * Env vars override the defaults so a fork can point at another project.
 */

export const FIREBASE_PROJECT_ID = 'analog-compiler-6n50x';

export const FIREBASE_CONSOLE_AUTH_SETTINGS =
  `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/settings`;

/** Hosts the live IDE is served from. Each must be in Firebase authorized domains. */
export const PRODUCTION_AUTH_HOSTS = [
  'aetherflow-ide.vercel.app',
  'aetherflow-ide-devtechedge1.vercel.app',
  'aetherflow-ide-git-main-devtechedge1.vercel.app',
] as const;

const DEFAULTS = {
  apiKey: 'AIzaSyD4kZsJXYqyi6491Uphd6iu453nkKUpFvg',
  authDomain: 'analog-compiler-6n50x.firebaseapp.com',
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: 'analog-compiler-6n50x.firebasestorage.app',
  messagingSenderId: '173557141563',
  appId: '1:173557141563:web:c400f35f4f3e23c618cc1e',
} as const;

function pick(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

export const firebaseConfig = {
  apiKey: pick(import.meta.env.VITE_FIREBASE_API_KEY, DEFAULTS.apiKey),
  authDomain: pick(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, DEFAULTS.authDomain),
  projectId: pick(import.meta.env.VITE_FIREBASE_PROJECT_ID, DEFAULTS.projectId),
  storageBucket: pick(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, DEFAULTS.storageBucket),
  messagingSenderId: pick(
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    DEFAULTS.messagingSenderId
  ),
  appId: pick(import.meta.env.VITE_FIREBASE_APP_ID, DEFAULTS.appId),
};

export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/documents',
] as const;

export function originMatchesAuthorizedDomain(host: string, domains: string[]): boolean {
  const h = host.trim().toLowerCase();
  if (!h) return false;
  if (h === 'localhost' || h === '127.0.0.1') return true;
  return domains.some((raw) => {
    const d = raw.trim().toLowerCase();
    return Boolean(d) && (h === d || h.endsWith(`.${d}`));
  });
}
