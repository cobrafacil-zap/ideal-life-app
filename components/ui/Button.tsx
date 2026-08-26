import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all " +
  "active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ember-gradient text-white shadow-card hover:brightness-[1.03]",
  secondary: "bg-moss-soft text-moss-dark hover:bg-moss-soft/80",
  ghost: "bg-transparent text-ink-soft hover:bg-line/40",
  outline: "border border-line bg-surface text-ink hover:bg-line/30",
  danger: "bg-ember text-white hover:brightness-95",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-3 text-[15px]",
  lg: "px-5 py-3.5 text-base",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  leadingIcon,
  trailingIcon,
  fullWidth,
  className,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={loading || disabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
      ) : (
        leadingIcon && <span className="shrink-0" aria-hidden="true">{leadingIcon}</span>
      )}
      <span className="truncate">{children}</span>
      {!loading && trailingIcon && (
        <span className="shrink-0" aria-hidden="true">
          {trailingIcon}
        </span>
      )}
    </button>
  );
}
