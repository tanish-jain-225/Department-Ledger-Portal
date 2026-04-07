import clsx from "clsx";

const variants = {
  neutral: "bg-slate-700 text-white border-transparent",
  gray: "bg-slate-700 text-white border-transparent",
  brand: "bg-brand-700 text-white border-transparent",
  success: "bg-emerald-700 text-white border-transparent",
  warning: "bg-amber-700 text-white border-transparent",
  danger: "bg-red-700 text-white border-transparent",
};

export default function Badge({ variant = "neutral", className, ...props }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
