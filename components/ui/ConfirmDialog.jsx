import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function ConfirmDialog({
  open: openProp,
  show,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}) {
  const open = openProp ?? show;
  const confirmRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onCancel?.();
    }
    window.addEventListener("keydown", onKey);
    confirmRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open || !mounted) return null;

  const colors =
    variant === "danger"
      ? {
          icon: "text-red-500 bg-red-100",
          btn: "bg-red-600 hover:bg-red-700 shadow-red-500/15",
        }
      : {
          icon: "text-amber-500 bg-amber-100",
          btn: "bg-amber-600 hover:bg-amber-700 shadow-amber-500/15",
        };

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Premium Light Glassmorphic Backdrop */}
      <div 
        className="absolute inset-0 bg-white/20 backdrop-blur-3xl animate-fade-in" 
        onClick={onCancel} 
      />

      <div className="relative w-full max-w-sm bg-white/80 backdrop-blur-2xl rounded-2xl shadow-[0_32px_128px_-16px_rgba(0,0,0,0.1)] border-2 border-white/60 overflow-hidden animate-scale-in">
        <div className="p-6 text-center text-slate-900 border-none">
          {/* Icon */}
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${colors.icon} mb-4`}
          >
            {variant === "danger" ? (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            ) : (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            )}
          </div>

          <h3 className="text-xl font-black">{title}</h3>
          {message && (
            <p className="mt-3 text-sm text-slate-500 leading-relaxed font-medium">{message}</p>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/20 bg-white/50 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-white transition-all active:scale-95 uppercase tracking-widest"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-black text-white shadow-lg transition-all active:scale-95 uppercase tracking-widest ${colors.btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
