import clsx from "clsx";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-all duration-200 " +
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 focus-visible:ring-offset-0 " +
  "disabled:opacity-45 disabled:pointer-events-none";

const variants = {
  primary:
    "bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 border border-brand-700 shadow-sm",
  secondary:
    "bg-slate-700 text-white hover:bg-slate-800 active:bg-slate-900 border border-slate-700 shadow-sm",
  soft:
    "bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200 border border-brand-100",
  brand:
    "bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 border border-brand-700 shadow-sm",
  success:
    "bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900 border border-emerald-700 shadow-sm",
  danger:
    "bg-red-700 text-white hover:bg-red-800 active:bg-red-900 border border-red-700 shadow-sm",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-3.5 min-[350px]:px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export default function Button({
  as: Comp = "button",
  variant = "primary",
  size = "md",
  className,
  children,
  loading = false,
  ...props
}) {
  return (
    <Comp
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span>Loading...</span>
        </>
      ) : children}
    </Comp>
  );
}
