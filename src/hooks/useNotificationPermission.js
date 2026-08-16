/**
 * useNotificationPermission.js
 *
 * Responsibility: Reading and requesting browser notification permission.
 *
 * Returns:
 *   {
 *     permission: NotificationPermission,  // "granted" | "denied" | "default"
 *     requestPermission: () => Promise<NotificationPermission>
 *   }
 *
 * Must NOT:
 *   - Dispatch Redux
 *   - Generate FCM tokens
 *   - Register service workers
 */

import { useState, useEffect, useCallback } from "react";

/**
 * Hook for reading and requesting notification permission.
 *
 * @returns {{ permission: NotificationPermission, requestPermission: () => Promise<NotificationPermission> }}
 */
const useNotificationPermission = () => {
  const [permission, setPermission] = useState("default");

  // Initialize permission state from browser on mount
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }
    setPermission(Notification.permission);
  }, []);

  /**
   * Requests notification permission from the user and updates local state.
   * @returns {Promise<NotificationPermission>}
   */
  const requestPermission = useCallback(async () => {
    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        console.warn("[useNotificationPermission] Notifications not supported.");
        return "denied";
      }

      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error("[useNotificationPermission] Error requesting permission:", error);
      setPermission("denied");
      return "denied";
    }
  }, []);

  return { permission, requestPermission };
};

export default useNotificationPermission;
