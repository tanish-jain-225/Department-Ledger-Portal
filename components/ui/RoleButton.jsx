/**
 * Role assignment button used across admin pages.
 * Shows active state when currentRole matches role.
 */
export default function RoleButton({ label, role, currentRole, onClick }) {
  const active = currentRole === role;

  const activeStyles = {
    student: "bg-brand-700 text-white border-brand-700",
    faculty: "bg-indigo-900 text-white border-indigo-900",
    admin: "bg-slate-950 text-white border-slate-950",
  };
  const idleStyles = {
    student: "bg-slate-600 text-white border-slate-600 hover:bg-slate-700",
    faculty: "bg-slate-600 text-white border-slate-600 hover:bg-slate-700",
    admin: "bg-slate-600 text-white border-slate-600 hover:bg-slate-700",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-300
        ${active
          ? (activeStyles[role] || activeStyles.admin)
          : (idleStyles[role] || idleStyles.admin)
        }`}
    >
      {label}
    </button>
  );
}
