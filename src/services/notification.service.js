/**
 * notification.service.js
 *
 * Responsibility: Orchestration of the notification initialization flow.
 *
 * This service:
 *   1. Registers the service worker (with retry)
 *   2. Requests notification permission
 *   3. Generates FCM token
 *   4. Returns a normalized response
 *
 * Returns:
 *   { success: true,  token: "fcm-token-string" }
 *   { success: false, token: null }
 *
 * Must NOT:
 *   - Dispatch Redux (caller is responsible)
 *   - Show UI (toasts, modals, alerts)
 *   - Block login on failure (always resolves)
 */

import {
  registerServiceWorker,
  requestNotificationPermission,
  generateFCMToken,
} from "@/firebase/messaging";

/**
 * Initializes push notifications for the current user session.
 *
 * Designed to be called just before the login API call.
 * Login must never be blocked — this function always resolves.
 *
 * @param {object} [options]
 * @param {number} [options.swMaxRetries=3] - Max retries for service worker registration.
 * @returns {Promise<{ success: boolean, token: string | null }>}
 */
export const initializeNotifications = async ({ swMaxRetries = 3 } = {}) => {
  try {
    // Step 1: Register the service worker (non-blocking on failure)
    const registration = await registerServiceWorker({ maxRetries: swMaxRetries });

    if (!registration) {
      console.warn("[NotificationService] Service worker registration failed — proceeding without token.");
      return { success: false, token: null };
    }

    // Step 2: Request notification permission from the user
    const permission = await requestNotificationPermission();

    if (permission !== "granted") {
      console.info("[NotificationService] Notification permission not granted:", permission);
      return { success: false, token: null };
    }

    // Step 3: Generate FCM token
    const token = await generateFCMToken(registration);

    if (!token) {
      console.warn("[NotificationService] Token generation failed — proceeding without token.");
      return { success: false, token: null };
    }

    console.info("[NotificationService] Notification initialization successful.");
    return { success: true, token };
  } catch (error) {
    // Catch-all: ensure this never throws and never blocks login
    console.error("[NotificationService] Unexpected error during initialization:", error);
    return { success: false, token: null };
  }
};
