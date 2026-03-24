import clsx from "clsx";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 " +
  "disabled:opacity-60 disabled:pointer-events-none active:scale-95";

const variants = {
  primary:
    "bg-brand-600 text-white shadow-lg shadow-brand-500/15 hover:bg-brand-700 hover:shadow-brand-500/25",
  secondary:
    "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 hover:border-brand-300",
  soft: "bg-brand-50 text-brand-700 border border-brand-100 hover:bg-brand-100",
  danger:
    "bg-red-600 text-white shadow-lg shadow-red-500/15 hover:bg-red-700",
  ghost: "text-slate-700 hover:bg-slate-100",
};

const sizes = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-sm",
};

export default function Button({
  as: Comp = "button",
  variant = "primary",
  size = "md",
  className,
  ...props
}) {
  return (
    <Comp
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
