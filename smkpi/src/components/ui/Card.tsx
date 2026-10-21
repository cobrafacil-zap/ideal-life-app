import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  padded = true,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-surface shadow-card",
        padded && "p-5",
        hover && "card-hover",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-3", className)}>
      <div className="flex items-start gap-3 min-w-0">
        {icon ? (
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-iris-soft text-iris-dark">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h3 className="truncate font-display text-[15px] font-semibold text-ink">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-[13px] leading-relaxed text-ink-faint">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "accent" | "success" | "warning" | "danger";
}) {
  const tones: Record<string, string> = {
    default: "text-ink",
    accent: "text-iris",
    success: "text-jade",
    warning: "text-amber",
    danger: "text-rose",
  };
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">{label}</p>
      <p className={cn("mt-1 font-display text-2xl font-bold tabular", tones[tone])}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-ink-faint">{hint}</p> : null}
    </div>
  );
}
