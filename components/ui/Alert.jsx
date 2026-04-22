import clsx from "clsx";

const styles = {
  info: "bg-brand-50 border-brand-200 text-brand-900",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  danger: "bg-red-50 border-red-200 text-red-900",
};

export default function Alert({ variant = "info", className, children, ...props }) {
  return (
    <div
      className={clsx(
        "flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm sm:gap-3 sm:px-4 sm:py-3",
        styles[variant],
        className
      )}
      {...props}
    >
      <div className="min-w-0 flex-1 wrap-break-word">{children}</div>
    </div>
  );
}

