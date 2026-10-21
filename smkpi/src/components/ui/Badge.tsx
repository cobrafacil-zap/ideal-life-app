import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  tone = "neutral",
  icon,
}: {
  children: ReactNode;
  className?: string;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
  icon?: ReactNode;
}) {
  const tones: Record<string, string> = {
    neutral: "text-ink-soft bg-ink/5 ring-1 ring-inset ring-line",
    accent: "text-iris-dark bg-iris-soft ring-1 ring-inset ring-iris/20",
    success: "text-jade-dark bg-jade-soft ring-1 ring-inset ring-jade/20",
    warning: "text-amber-dark bg-amber-soft ring-1 ring-inset ring-amber/25",
    danger: "text-rose-dark bg-rose-soft ring-1 ring-inset ring-rose/25",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[11px] font-semibold leading-none",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
