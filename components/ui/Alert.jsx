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
        "flex gap-3 rounded-xl border px-4 py-3 text-sm",
        styles[variant],
        className
      )}
      {...props}
    >
      <div className="min-w-0">{children}</div>
    </div>
  );
}

