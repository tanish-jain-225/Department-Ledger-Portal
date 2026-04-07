import { useState } from "react";

export default function SectionCard({ title, icon, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="premium-card overflow-hidden border border-slate-200">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg transition-colors ${open ? "bg-brand-50 text-brand-600" : "bg-slate-100 text-slate-500"}`}>
            {icon}
          </div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          {count !== undefined && (
            <span className="rounded-full bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-0.5">
              {count}
            </span>
          )}
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-100">
          {children}
        </div>
      )}
    </section>
  );
}
