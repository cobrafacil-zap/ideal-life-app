import { cn } from "@/lib/cn";
import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
  /** Acentua a borda e o fundo para chamar atenção em dashboards */
  emphasis?: boolean;
  /** Remove fundo e borda — útil em superfícies agrupadas */
  bare?: boolean;
  as?: "div" | "section" | "article" | "aside";
}

export function Card({
  children,
  className,
  padded = true,
  emphasis = false,
  bare = false,
  as: Tag = "section",
  ...rest
}: CardProps) {
  return (
    <Tag
      {...rest}
      className={cn(
        "rounded-card border transition-shadow transition-colors duration-200",
        bare
          ? "bg-transparent border-transparent shadow-none"
          : cn(
              "bg-surface shadow-card",
              emphasis
                ? "border-ember/30 ring-1 ring-ember/10"
                : "border-line/60"
            ),
        padded && "p-6 sm:p-7",
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-3 flex items-start justify-between gap-3",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="font-display text-base font-semibold text-ink leading-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-[13px] text-ink-soft">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
