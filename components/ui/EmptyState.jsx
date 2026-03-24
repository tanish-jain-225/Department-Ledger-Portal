import clsx from "clsx";

export default function EmptyState({ className, icon, action, children, ...props }) {
  return (
    <div
      className={clsx(
        "rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          {icon}
        </div>
      )}
      <p className="text-slate-500 text-sm font-medium">{children}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
