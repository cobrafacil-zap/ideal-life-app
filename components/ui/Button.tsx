import { clsx } from "clsx";
import { Loader2 } from "lucide-react";

export function Button({
  children,
  variant = "primary",
  loading = false,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px] font-semibold transition-all active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100",
        variant === "primary" && "bg-ember-gradient text-white shadow-card",
        variant === "secondary" && "bg-moss-soft text-moss-dark",
        variant === "ghost" && "bg-transparent text-ink-soft hover:bg-line/40",
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
