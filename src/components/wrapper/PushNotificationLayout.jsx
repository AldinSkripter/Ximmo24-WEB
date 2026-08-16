"use client";
/**
 * PushNotificationLayout.jsx
 *
 * Responsibility: Legacy wrapper — preserved for backward compatibility.
 *
 * Used by:
 *   - src/components/layout/Layout.jsx
 *   - src/components/pagescomponents/UserDashboardPage.jsx
 *   - src/components/pagescomponents/AgentDashboardPage.jsx
 *
 * This component now delegates all push notification infrastructure
 * (service worker registration, foreground listener) to NotificationProvider,
 * which is mounted globally in _app.js.
 *
 * This wrapper only remains to:
 *   1. Pass `onNotificationReceived` callback into the notification event system
 *   2. Render children without modification
 *
 * It does NOT:
 *   - Request notification permission
 *   - Generate FCM tokens
 *   - Register service workers (handled by NotificationProvider in _app.js)
 *   - Dispatch Redux
 */

import React, { useEffect, useRef } from "react";
import { setupForegroundListener } from "@/firebase/messaging";
import { useSelector } from "react-redux";

/**
 * Builds a safe notification click URL using URL constructor.
 *
 * @param {object} payload - FCM message payload
 * @returns {string}
 */
const buildNotificationUrl = (payload) => {
  try {
    if (payload?.data?.chat_message_type) {
      const url = new URL("/user/chat", window.location.origin);
      url.searchParams.set("propertyId", payload.data.property_id || "");
      url.searchParams.set("userId", payload.data.sender_id || "");
      return url.toString();
    }
  } catch (error) {
    console.error("[PushNotificationLayout] Error building notification URL:", error);
  }
  return window.location.origin;
};

/**
 * Shows a foreground notification via the active service worker.
 *
 * @param {object} payload - FCM message payload
 */
const showForegroundNotification = async (payload) => {
  try {
    if (
      typeof window === "undefined" ||
      document.visibilityState !== "visible" ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    const title = payload?.notification?.title || "Notification";
    const notificationOptions = {
      body: payload?.notification?.body,
      icon: payload?.data?.icon || "/favicon.ico",
      image: payload?.notification?.image || payload?.data?.image,
      requireInteraction: true,
      data: {
        url: buildNotificationUrl(payload),
      },
    };

    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, notificationOptions);
      return;
    }

    new Notification(title, notificationOptions);
  } catch (error) {
    console.error("[PushNotificationLayout] Error showing foreground notification:", error);
  }
};

/**
 * PushNotificationLayout
 *
 * Backward-compatible wrapper for page-level notification callbacks.
 * Service worker registration is handled globally by NotificationProvider in _app.js.
 * This component sets up a scoped foreground listener that routes notification data
 * to the provided `onNotificationReceived` callback.
 *
 * @param {{ children: React.ReactNode, onNotificationReceived?: (data: object) => void }} props
 */
const PushNotificationLayout = ({ children, onNotificationReceived }) => {
  const unsubscribeRef = useRef(null);
  const onNotificationReceivedRef = useRef(onNotificationReceived);
  const fcmTokenFromRedux = useSelector((state) => state.WebSetting?.fcmToken);

  // Keep callback ref current without re-triggering the effect
  useEffect(() => {
    onNotificationReceivedRef.current = onNotificationReceived;
  }, [onNotificationReceived]);

  // Set up a scoped foreground listener for this layout's callback
  useEffect(() => {
    // Only set up listener if we have an active FCM token (user logged in)
    if (!fcmTokenFromRedux) return;

    let isMounted = true;

    const initListener = async () => {
      try {
        const unsubscribe = await setupForegroundListener((payload) => {
          if (!isMounted) return;

          if (
            payload?.data &&
            typeof document !== "undefined" &&
            document.visibilityState === "visible"
          ) {
            onNotificationReceivedRef.current?.(payload.data);
            void showForegroundNotification(payload);
          }
        });

        if (isMounted) {
          unsubscribeRef.current = unsubscribe;
        } else if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      } catch (error) {
        console.error("[PushNotificationLayout] Error setting up foreground listener:", error);
      }
    };

    initListener();

    return () => {
      isMounted = false;
      if (typeof unsubscribeRef.current === "function") {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [fcmTokenFromRedux]);

  return <>{children}</>;
};

export default PushNotificationLayout;