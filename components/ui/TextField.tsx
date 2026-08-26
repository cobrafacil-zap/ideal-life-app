import { cn } from "@/lib/cn";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  hint?: ReactNode;
  error?: string;
  trailingAdornment?: ReactNode;
  size?: "md" | "lg";
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    { label, hint, error, id, trailingAdornment, className, size = "md", ...props },
    ref
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const describedBy: string[] = [];
    if (hint) describedBy.push(`${inputId}-hint`);
    if (error) describedBy.push(`${inputId}-error`);

    return (
      <label htmlFor={inputId} className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink-soft">
          {label}
        </span>
        <span className="relative block">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error || undefined}
            aria-describedby={describedBy.join(" ") || undefined}
            className={cn(
              "w-full rounded-xl border bg-surface text-ink placeholder:text-ink-faint",
              "border-line focus:border-ember focus:ring-2 focus:ring-ember/20 outline-none",
              "transition-colors",
              size === "lg" ? "px-4 py-3.5 text-[15px]" : "px-4 py-3 text-[15px]",
              error && "border-ember focus:border-ember focus:ring-ember/30",
              trailingAdornment && "pr-12",
              className
            )}
            {...props}
          />
          {trailingAdornment && (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ink-faint">
              {trailingAdornment}
            </span>
          )}
        </span>
        {hint && !error && (
          <span
            id={`${inputId}-hint`}
            className="mt-1 block text-[12px] text-ink-faint"
          >
            {hint}
          </span>
        )}
        {error && (
          <span
            id={`${inputId}-error`}
            className="mt-1 block text-[12px] text-ember-dark"
            role="alert"
          >
            {error}
          </span>
        )}
      </label>
    );
  }
);
