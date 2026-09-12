/**
 * Role assignment button used across admin pages.
 * Shows active state when currentRole matches role.
 */
export default function RoleButton({ label, role, currentRole, onClick, disabled = false, title }) {
  const active = currentRole === role;

  const activeStyles = {
    student: "bg-brand-700 text-white border-brand-700 shadow-sm",
    faculty: "bg-brand-700 text-white border-brand-700 shadow-sm",
    admin: "bg-brand-700 text-white border-brand-700 shadow-sm",
  };
  const idleStyles = {
    student: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900",
    faculty: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900",
    admin: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900",
  };

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      aria-disabled={disabled}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-300
        ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
        ${active
          ? (activeStyles[role] || activeStyles.admin)
          : (idleStyles[role] || idleStyles.admin)
        }`}
    >
      {label}
    </button>
  );
}
