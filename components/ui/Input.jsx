import clsx from "clsx";
import { forwardRef } from "react";

const Input = forwardRef(function Input({ className, error, ...props }, ref) {
  return (
    <>
      <input
        ref={ref}
        className={clsx(
          "block w-full rounded-xl border bg-white px-3.5 min-[350px]:px-4 py-2.5 text-sm text-slate-900 shadow-sm",
          "placeholder:text-slate-400",
          "focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:bg-slate-50/30 focus:outline-none",
          "transition-all duration-300",
          "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-400/10"
            : "border-slate-300",
          className
        )}
        aria-invalid={error ? "true" : undefined}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </>
  );
});

export default Input;
