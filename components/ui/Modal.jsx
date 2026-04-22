import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

export default function Modal({
  title,
  open,
  onClose,
  children,
  className,
  maxWidth = "max-w-2xl",
  fullScreen = false,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={clsx(
        "fixed inset-0 z-100000 flex items-center justify-center transition-all duration-500",
        fullScreen ? "p-0" : "p-2 min-[340px]:p-4 sm:p-8"
      )}
      role="dialog"
      aria-modal="true"
      aria-label={title || "Dialog"}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px] animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={clsx(
          "relative overflow-hidden bg-white flex flex-col border border-slate-200 animate-scale-in transition-all duration-300",
          fullScreen ? "w-screen h-screen rounded-none border-0" : [maxWidth, "w-full rounded-3xl shadow-2xl"],
          className
        )}
        style={{ maxHeight: fullScreen ? "100vh" : "calc(100vh - 4rem)" }}
      >
        {/* Sticky Header */}
        <div className={clsx(
          "sticky top-0 z-20 flex flex-col gap-3 border-b border-slate-200 bg-white",
          fullScreen ? "px-5 py-6 sm:px-8" : "px-responsive py-4"
        )}>
          <div className="flex w-full items-center justify-between gap-3 min-w-0">
            <h2 className="min-w-0 text-lg font-bold text-slate-900 tracking-tight truncate">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all active:scale-95"
              aria-label="Close dialog"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-responsive sidebar-scroll">
          {children}
        </div>
      </div>


    </div>,
    document.body
  );
}
