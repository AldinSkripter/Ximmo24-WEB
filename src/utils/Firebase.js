/**
 * Firebase.js
 *
 * Responsibility: Firebase Authentication access only.
 *
 * Provides a backward-compatible factory function `FirebaseData()` that
 * returns the authentication instance and signOut helper.
 *
 * Used by:
 *   - src/components/layout/Header.jsx (signOut)
 *   - src/components/modal/LoginModal.jsx (authentication for RecaptchaVerifier + Google auth)
 *
 * All other Firebase concerns have been moved to:
 *   - src/firebase/firebase.config.js  → app initialization
 *   - src/firebase/messaging.js         → SW, token, permission, listener
 *   - src/services/notification.service.js → orchestration
 *   - src/providers/NotificationProvider.jsx → global listener setup
 */

import { authentication, firebaseApp } from "@/firebase/firebase.config";

/**
 * FirebaseData factory — backward-compatible wrapper.
 *
 * Returns:
 *   - firebaseApp     → Firebase app instance
 *   - authentication  → Firebase Auth instance
 *   - signOut()       → Signs out the current user
 *
 * @returns {{ firebaseApp: import("firebase/app").FirebaseApp, authentication: import("firebase/auth").Auth, signOut: () => Promise<void> }}
 */
const FirebaseData = () => {
  /**
   * Signs out the currently authenticated Firebase user.
   * @returns {Promise<void>}
   */
  const signOut = () => {
    return authentication.signOut();
  };

  return {
    firebaseApp,
    authentication,
    signOut,
  };
};

export default FirebaseData;
