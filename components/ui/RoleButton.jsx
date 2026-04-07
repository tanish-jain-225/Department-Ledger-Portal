/**
 * Role assignment button used across admin pages.
 * Shows active state when currentRole matches role.
 */
export default function RoleButton({ label, role, currentRole, onClick }) {
  const active = currentRole === role;

  const activeStyles = {
    student: "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20",
    faculty: "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20",
    admin: "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20",
  };
  const idleStyles = {
    student: "bg-slate-200 text-slate-600 border-slate-200 hover:bg-slate-300 hover:text-slate-900",
    faculty: "bg-slate-200 text-slate-600 border-slate-200 hover:bg-slate-300 hover:text-slate-900",
    admin: "bg-slate-200 text-slate-600 border-slate-200 hover:bg-slate-300 hover:text-slate-900",
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
