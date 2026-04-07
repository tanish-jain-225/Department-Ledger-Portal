import clsx from "clsx";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-all duration-200 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 " +
  "disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]";

const variants = {
  primary:
    "bg-brand-700 text-white hover:bg-brand-800 shadow-sm",
  secondary:
    "bg-slate-700 text-white hover:bg-slate-800 shadow-sm",
  soft:
    "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  brand:
    "bg-brand-700 text-white hover:bg-brand-800 shadow-sm",
  success:
    "bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm",
  danger:
    "bg-red-700 text-white hover:bg-red-800 shadow-sm",
  ghost:
    "bg-slate-600 text-white hover:bg-slate-700 shadow-sm",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
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
          <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span>Loading...</span>
        </>
      ) : children}
    </Comp>
  );
}
