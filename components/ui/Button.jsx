import clsx from "clsx";

const base =
  "btn-premium inline-flex items-center justify-center gap-2 rounded-2xl font-black text-sm transition-all duration-300 " +
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15 " +
  "disabled:opacity-40 disabled:pointer-events-none active:scale-95 group";

const variants = {
  primary:
    "bg-slate-900 text-white shadow-xl shadow-slate-900/10 hover:bg-slate-800 hover:shadow-slate-900/20",
  secondary:
    "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900",
  soft: "bg-brand-50 text-brand-700 border border-brand-100/50 hover:bg-brand-100 hover:text-brand-800",
  brand:
    "bg-brand-600 text-white shadow-xl shadow-brand-500/20 hover:bg-brand-700 hover:shadow-brand-500/30",
  danger:
    "bg-red-600 text-white shadow-xl shadow-red-500/10 hover:bg-red-700 hover:shadow-red-500/20",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
};

const sizes = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

export default function Button({
  as: Comp = "button",
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}) {
  return (
    <Comp
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </Comp>
  );
}
