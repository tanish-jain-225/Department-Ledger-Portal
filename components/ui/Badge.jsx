import clsx from "clsx";

const variants = {
  neutral: "bg-slate-100 text-slate-600 border-slate-200/50",
  brand: "bg-brand-50 text-brand-700 border-brand-200/50",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
  warning: "bg-amber-50 text-amber-800 border-amber-200/50",
  danger: "bg-red-50 text-red-700 border-red-200/50",
};

export default function Badge({ variant = "neutral", className, ...props }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-xl border px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em]",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
