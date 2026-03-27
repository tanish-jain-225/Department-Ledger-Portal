import { useState } from "react";

export default function SectionCard({ title, icon, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  
  return (
    <section className="premium-card overflow-hidden border border-slate-100">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-8 py-6 hover:bg-slate-50/50 transition-all duration-300"
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-xl transition-colors ${open ? 'bg-brand-50 text-brand-600' : 'bg-slate-50 text-slate-400'}`}>
            {icon}
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">{title}</h2>
          {count !== undefined && (
            <span className="ml-2 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 group-hover:bg-brand-100 group-hover:text-brand-700 transition-colors">
              {count}
            </span>
          )}
        </div>
        <div className={`p-2 rounded-full hover:bg-slate-100 transition-all ${open ? 'rotate-180' : ''}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={3}
            stroke="currentColor"
            className="h-4 w-4 text-slate-400"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>
      
      <div className={`transition-all duration-500 ease-in-out ${open ? 'max-h-[2000px] opacity-100 px-8 pb-8 pt-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="border-t border-slate-50 pt-6">
          {children}
        </div>
      </div>
    </section>
  );
}
