import { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { downloadElementAsPdf } from "../../lib/pdf-download";

export default function DownloadPdfButton({
  elementRef,
  filename,
  label = "Download PDF",
  disabled = false,
  className = "",
  orientation,
  windowWidth,
  allowedRoles,
}) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const role = profile?.role;

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return null;
  }

  const handleClick = async () => {
    setLoading(true);
    setError("");
    try {
      await downloadElementAsPdf(elementRef?.current, {
        filename,
        orientation,
        windowWidth,
      });
    } catch (err) {
      const message = err?.message || "Failed to generate PDF.";
      setError(message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const baseClasses =
    "inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className={`${baseClasses} ${className}`.trim()}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Generating PDF...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
              />
            </svg>
            {label}
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
