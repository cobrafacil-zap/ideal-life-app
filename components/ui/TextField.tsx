import { forwardRef } from "react";

export const TextField = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
>(function TextField({ label, id, ...props }, ref) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-soft">{label}</span>
      <input
        ref={ref}
        id={id}
        className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-[15px] text-ink placeholder:text-ink-faint focus:border-ember outline-none transition-colors"
        {...props}
      />
    </label>
  );
});
