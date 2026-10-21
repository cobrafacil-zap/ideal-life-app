import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-line px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-iris-soft text-iris-dark">
          {icon}
        </div>
      ) : null}
      <h4 className="font-display text-[15px] font-semibold text-ink">{title}</h4>
      {description ? (
        <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-ink-faint">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
