/**
 * firebase.config.js
 *
 * Responsibility: Firebase app initialization ONLY.
 *
 * Exports:
 *   - firebaseApp  → initialized Firebase app (singleton)
 *   - authentication → Firebase Auth instance
 *
 * Must NOT:
 *   - Register service workers
 *   - Generate FCM tokens
 *   - Request notification permission
 *   - Dispatch Redux
 *   - Show UI
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
};

/**
 * Singleton Firebase app instance.
 * Reuses an existing app if already initialized (handles Next.js hot-reload).
 */
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * Firebase Authentication instance.
 */
const authentication = getAuth(firebaseApp);

export { firebaseApp, authentication };
