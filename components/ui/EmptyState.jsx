import React from 'react';

export default function EmptyState({ icon, title, message, text, action }) {
  // Support both `message` and legacy `text` prop
  const body = message || text;

  return (
    <div className="text-center py-12 rounded-xl border border-slate-200 bg-slate-50 animate-slide-up">
      <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-4 text-slate-400">
        {icon || (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <p className="text-sm font-semibold text-slate-700">{title || "No data found"}</p>
      {body && (
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">{body}</p>
      )}
      {action && (
        <div className="mt-6">{action}</div>
      )}
    </div>
  );
}
