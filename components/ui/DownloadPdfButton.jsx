import { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { downloadElementAsPdf } from "../../lib/pdf-download";

/**
 * Reusable PDF download button.
 * All PDF exports in the project use this component.
 *
 * Props:
 *   elementRef   — React ref pointing to the DOM element to capture
 *   filename     — Output filename (use buildFilename() from lib/pdf-download)
 *   label        — Button label text (default: "Download PDF")
 *   orientation  — 'portrait' | 'landscape' (default: 'portrait')
 *   windowWidth  — Render width in px (default: 794 = A4 portrait at 96dpi)
 *   allowedRoles — Array of roles that can see this button (optional)
 *   disabled     — Disable the button
 *   className    — Extra classes for the button element
 */
export default function DownloadPdfButton({
  elementRef,
  filename,
  label = "Download PDF",
  orientation = "portrait",
  windowWidth = 1122,
  allowedRoles,
  disabled = false,
  className = "",
}) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Role gate
  if (allowedRoles && (!profile?.role || !allowedRoles.includes(profile.role))) {
    return null;
  }

  const handleClick = async () => {
    if (!elementRef?.current) {
      setError("Nothing to export.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await downloadElementAsPdf(elementRef.current, { filename, orientation, windowWidth });
    } catch (err) {
      const msg = err?.message || "Failed to generate PDF.";
      setError(msg);
      setTimeout(() => setError(""), 6000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className={[
          "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
          "bg-brand-700 text-white hover:bg-brand-800",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className,
        ].filter(Boolean).join(" ")}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span>Preparing...</span>
          </>
        ) : (
          <>
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>{label}</span>
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-600 max-w-xs">{error}</p>
      )}
    </div>
  );
}
