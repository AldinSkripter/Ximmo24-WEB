/**
 * retry.js
 *
 * Responsibility: Reusable exponential backoff retry utility.
 *
 * Retry strategy:
 *   Attempt 1 → fail → wait 1s
 *   Attempt 2 → fail → wait 2s
 *   Attempt 3 → fail → wait 4s
 *   → Abort gracefully (return null)
 *
 * Does NOT:
 *   - Dispatch Redux
 *   - Show UI
 *   - Reference Firebase
 */

/**
 * Sleep for a given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes an async function with exponential backoff retry logic.
 *
 * @param {() => Promise<any>} fn - The async function to retry.
 * @param {object} options
 * @param {number} [options.maxRetries=3] - Maximum number of attempts.
 * @param {number} [options.baseDelay=1000] - Base delay in ms (doubles each attempt).
 * @param {string} [options.label="operation"] - Human-readable name for logging.
 * @returns {Promise<any|null>} - Resolves with the function's result, or null on total failure.
 */
export const withRetry = async (fn, { maxRetries = 3, baseDelay = 1000, label = "operation" } = {}) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fn();
      if (attempt > 0) {
        console.info(`[Retry] ${label} succeeded on attempt ${attempt + 1}`);
      }
      return result;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;

      if (isLastAttempt) {
        console.error(`[Retry] ${label} failed after ${maxRetries} attempts. Final error:`, error);
        return null;
      }

      const delay = baseDelay * Math.pow(2, attempt); // 1s, 2s, 4s...
      console.warn(`[Retry] ${label} attempt ${attempt + 1} failed. Retrying in ${delay}ms...`, error?.message || error);
      await sleep(delay);
    }
  }

  return null;
};
