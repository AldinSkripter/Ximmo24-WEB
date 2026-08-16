/**
 * useFCMToken.js
 *
 * Responsibility: FCM token generation and retrieval.
 *
 * Returns:
 *   {
 *     generateToken: (registration: ServiceWorkerRegistration) => Promise<string | null>,
 *     isLoading: boolean,
 *     error: Error | null
 *   }
 *
 * Must NOT:
 *   - Dispatch Redux (caller is responsible)
 *   - Request notification permission
 *   - Register service workers
 *   - Show UI
 */

import { useState, useCallback } from "react";
import { generateFCMToken } from "@/firebase/messaging";

/**
 * Hook for generating FCM tokens on demand.
 *
 * @returns {{
 *   generateToken: (registration: ServiceWorkerRegistration) => Promise<string | null>,
 *   isLoading: boolean,
 *   error: Error | null
 * }}
 */
const useFCMToken = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Generates an FCM token for the given service worker registration.
   *
   * @param {ServiceWorkerRegistration} registration
   * @returns {Promise<string | null>}
   */
  const generateToken = useCallback(async (registration) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await generateFCMToken(registration);
      return token;
    } catch (err) {
      console.error("[useFCMToken] Error generating token:", err);
      setError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { generateToken, isLoading, error };
};

export default useFCMToken;
