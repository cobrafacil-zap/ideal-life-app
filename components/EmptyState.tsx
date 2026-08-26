import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center gap-2 rounded-card border border-dashed border-line bg-surface/60 p-8",
        className
      )}
    >
      {Icon && (
        <span className="mb-1 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ember-soft text-ember">
          <Icon size={20} strokeWidth={2.1} aria-hidden="true" />
        </span>
      )}
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {description && (
        <p className="max-w-sm text-[13px] text-ink-soft">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
