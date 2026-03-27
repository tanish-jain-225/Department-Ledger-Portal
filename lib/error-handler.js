import { useToast } from "./toast-context";

/**
 * Custom hook for unified error handling across the application.
 * Integrates with the toast notification system and provides
 * consistent logging and user feedback.
 * 
 * @returns {Object} An object containing the handleError function.
 */
export function useErrorHandler() {
  const { addToast } = useToast();

  /**
   * Handles an error by logging it to the console and notifying the user via a toast.
   * 
   * @param {Error|string|Object} error - The error object, message, or specialized error entity.
   * @param {Object} [options={}] - Configuration for how to handle this specific error.
   * @param {string} [options.title="Operational Failure"] - A header for the error (used in logs).
   * @param {boolean} [options.logOnly=false] - If true, the error is logged but no toast is shown.
   * @param {string} [options.fallback="An unexpected protocol error occurred."] - Message to show if the error has no message.
   */
  const handleError = (error, options = {}) => {
    const { 
      title = "Operational Failure", 
      logOnly = false,
      fallback = "An unexpected protocol error occurred."
    } = options;

    const message = error?.message || (typeof error === 'string' ? error : fallback);

    // 1. Surveillance Logging
    console.error(`[System Audit] ${title}:`, error);

    // 2. High-Fidelity User Notification
    if (!logOnly) {
      addToast(message, "error");
    }
  };

  return { handleError };
}
