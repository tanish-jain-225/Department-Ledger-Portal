import clsx from "clsx";
import { forwardRef } from "react";

const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={clsx(
        "block w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900",
        "placeholder:text-slate-400 placeholder:font-normal",
        "focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none",
        "transition-all duration-300",
        "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
});

export default Input;
