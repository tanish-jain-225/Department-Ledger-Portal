/**
 * Shared role assignment button used across admin pages.
 * Shows active state when currentRole matches role.
 */
export default function RoleButton({ label, role, currentRole, onClick }) {
  const active = currentRole === role;

  const activeStyles = {
    student: "bg-sky-600 text-white border-sky-600 shadow-sky-200",
    faculty: "bg-indigo-700 text-white border-indigo-700 shadow-indigo-200",
    admin:   "bg-slate-900 text-white border-slate-900 shadow-slate-200",
  };
  const idleStyles = {
    student: "text-sky-700 bg-sky-50 border-sky-100 hover:bg-sky-100",
    faculty: "text-indigo-700 bg-indigo-50 border-indigo-100 hover:bg-indigo-100",
    admin:   "text-slate-700 bg-slate-50 border-slate-100 hover:bg-slate-100",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300 shadow-sm
        ${active ? (activeStyles[role] || "bg-slate-900 text-white border-slate-900") : (idleStyles[role] || "text-slate-700 bg-slate-50 border-slate-100 hover:bg-slate-100")}`}
    >
      {active && <span className="mr-1 opacity-60">●</span>}
      {label}
    </button>
  );
}
