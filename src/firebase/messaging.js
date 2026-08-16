/**
 * messaging.js
 *
 * Responsibility: Firebase Messaging operations ONLY.
 *
 * Exports:
 *   - getMessagingInstance()       → Firebase Messaging instance (browser-safe)
 *   - registerServiceWorker()      → Registers SW with exponential backoff via retry.js
 *   - requestNotificationPermission() → Requests browser notification permission
 *   - generateFCMToken(registration) → Generates FCM token via getToken()
 *   - setupForegroundListener(cb)  → Sets up onMessage listener, returns unsubscribe fn
 *
 * Must NOT:
 *   - Dispatch Redux
 *   - Call login/register APIs
 *   - Show UI
 */

import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { firebaseApp } from "./firebase.config";
import { withRetry } from "@/utils/retry";

/**
 * Returns a Firebase Messaging instance if supported by the browser.
 * Returns null gracefully on unsupported browsers.
 *
 * @returns {Promise<import("firebase/messaging").Messaging | null>}
 */
export const getMessagingInstance = async () => {
  try {
    const isSupportedBrowser = await isSupported();
    if (!isSupportedBrowser) {
      console.warn("[Messaging] Firebase Messaging is not supported in this browser.");
      return null;
    }
    return getMessaging(firebaseApp);
  } catch (error) {
    console.error("[Messaging] Error checking messaging support:", error);
    return null;
  }
};

/**
 * Registers the Firebase Messaging service worker with exponential backoff retry.
 *
 * @param {object} [options]
 * @param {number} [options.maxRetries=3] - Maximum retry attempts.
 * @returns {Promise<ServiceWorkerRegistration | null>}
 */
export const registerServiceWorker = async ({ maxRetries = 3 } = {}) => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    console.warn("[ServiceWorker] Not supported in this environment.");
    return null;
  }

  const result = await withRetry(
    async () => {
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        { scope: "/" }
      );
      console.info("[ServiceWorker] Registered successfully. Scope:", registration.scope);
      return registration;
    },
    { maxRetries, baseDelay: 1000, label: "ServiceWorker registration" }
  );

  return result;
};

/**
 * Requests the browser's notification permission from the user.
 *
 * @returns {Promise<NotificationPermission>} - "granted" | "denied" | "default"
 */
export const requestNotificationPermission = async () => {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("[Permission] Notifications not supported in this environment.");
      return "denied";
    }

    const permission = await Notification.requestPermission();
    console.info("[Permission] Notification permission:", permission);
    return permission;
  } catch (error) {
    console.error("[Permission] Error requesting notification permission:", error);
    return "denied";
  }
};

/**
 * Generates an FCM token using the provided service worker registration.
 *
 * @param {ServiceWorkerRegistration} registration - Active SW registration.
 * @returns {Promise<string | null>} - FCM token string or null on failure.
 */
export const generateFCMToken = async (registration) => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.warn("[FCMToken] Messaging not available — skipping token generation.");
      return null;
    }

    if (!registration) {
      console.warn("[FCMToken] No service worker registration — skipping token generation.");
      return null;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
    if (!vapidKey) {
      console.error("[FCMToken] NEXT_PUBLIC_VAPID_KEY is not set.");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.info("[FCMToken] Token generated successfully.");
      return token;
    } else {
      console.warn("[FCMToken] No token received from getToken().");
      return null;
    }
  } catch (error) {
    console.error("[FCMToken] Error generating FCM token:", error);
    return null;
  }
};

/**
 * Sets up a foreground message listener for Firebase Cloud Messaging.
 * Returns an unsubscribe function to clean up the listener.
 *
 * @param {(payload: import("firebase/messaging").MessagePayload) => void} callback
 * @returns {Promise<(() => void) | null>} - Unsubscribe function or null.
 */
export const setupForegroundListener = async (callback) => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.warn("[ForegroundListener] Messaging not available — skipping listener setup.");
      return null;
    }

    const unsubscribe = onMessage(messaging, (payload) => {
      // console.info("[ForegroundListener] Foreground message received:", payload);
      callback?.(payload);
    });

    console.info("[ForegroundListener] Foreground listener registered.");
    return unsubscribe;
  } catch (error) {
    console.error("[ForegroundListener] Error setting up foreground listener:", error);
    return null;
  }
};
