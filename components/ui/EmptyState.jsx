import React from 'react';

export default function EmptyState({ icon, title, message, action }) {
  return (
    <div className="text-center py-24 premium-card border-dashed border-2 bg-slate-50/50 animate-slide-up">
      <div className="h-20 w-20 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-center mx-auto mb-6 shadow-xl text-slate-300 transition-transform hover:scale-110 duration-500 animate-float">
        {icon || (
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <p className="text-slate-900 font-black text-2xl tracking-tighter">{title || "No data discovered"}</p>
      <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto font-medium leading-relaxed italic">
        {message || "The ledger is currently empty for this sector. Initialize a new record to begin synchronization."}
      </p>
      {action && (
        <div className="mt-8">
          {action}
        </div>
      )}
    </div>
  );
}
