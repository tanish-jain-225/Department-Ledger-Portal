import clsx from "clsx";
import { forwardRef } from "react";

const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={clsx(
        "block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm",
        "placeholder:text-slate-400",
        "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:shadow-brand-500/10 focus:shadow-md focus:outline-none",
        "transition-all duration-200",
        "disabled:bg-slate-50 disabled:text-slate-400",
        className
      )}
      {...props}
    />
  );
});

export default Input;
