"use client";
/**
 * NotificationProvider.jsx
 *
 * Responsibility: Global notification infrastructure setup — mounted ONCE in _app.js.
 *
 * On mount:
 *   1. Registers the Firebase service worker (with retry)
 *   2. Sets up the foreground message listener (one global listener)
 *
 * On unmount:
 *   - Cleans up the foreground message listener
 *
 * Must NOT:
 *   - Request notification permission
 *   - Generate FCM token
 *   - Dispatch Redux (except via setFCMToken if token re-fresh is needed)
 *   - Block rendering
 */

import React, { useEffect, useRef } from "react";
import { registerServiceWorker, setupForegroundListener } from "@/firebase/messaging";

/**
 * Builds a safe notification click URL using URL constructor.
 * Avoids string concatenation (XSS prevention).
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
    console.error("[NotificationProvider] Error building notification URL:", error);
  }
  return window.location.origin;
};

/**
 * Displays a foreground notification using the active service worker.
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
    console.error("[NotificationProvider] Error showing foreground notification:", error);
  }
};

/**
 * NotificationProvider
 *
 * Wraps the app to provide global service worker registration and foreground notification
 * listening. Must be placed high in the component tree (in _app.js) with { ssr: false }.
 *
 * @param {{ children: React.ReactNode, onNotificationReceived?: (data: object) => void }} props
 */
const NotificationProvider = ({ children, onNotificationReceived }) => {
  const unsubscribeRef = useRef(null);
  const onNotificationReceivedRef = useRef(onNotificationReceived);

  // Keep the callback ref up to date without re-running the effect
  useEffect(() => {
    onNotificationReceivedRef.current = onNotificationReceived;
  }, [onNotificationReceived]);

  // Step 1: Register service worker on mount (once, globally)
  useEffect(() => {
    const initServiceWorker = async () => {
      try {
        await registerServiceWorker({ maxRetries: 3 });
      } catch (error) {
        // Graceful failure — never block rendering
        console.error("[NotificationProvider] Service worker registration error:", error);
      }
    };

    initServiceWorker();
  }, []);

  // Step 2: Set up a single foreground message listener (mounted once)
  useEffect(() => {
    let isMounted = true;

    const initForegroundListener = async () => {
      try {
        const unsubscribe = await setupForegroundListener((payload) => {
          if (!isMounted) return;

          // Only handle if document is visible
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
          // Component unmounted before async completed — cleanup immediately
          unsubscribe();
        }
      } catch (error) {
        console.error("[NotificationProvider] Error setting up foreground listener:", error);
      }
    };

    initForegroundListener();

    return () => {
      isMounted = false;
      if (typeof unsubscribeRef.current === "function") {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        console.info("[NotificationProvider] Foreground listener cleaned up.");
      }
    };
  }, []);

  return <>{children}</>;
};

export default NotificationProvider;
