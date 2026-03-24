import clsx from "clsx";

export default function Select({ className, children, ...props }) {
  return (
    <select
      className={clsx(
        "block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm",
        "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:shadow-brand-500/10 focus:shadow-md focus:outline-none",
        "transition-all duration-200",
        "disabled:bg-slate-50 disabled:text-slate-400",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
