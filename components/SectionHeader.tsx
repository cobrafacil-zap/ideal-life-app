import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export interface SectionHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/**
 * Cabeçalho de página/seção padronizado.
 * - Mobile: empilhado.
 * - Desktop: lado a lado, com ação alinhada à direita.
 */
export function SectionHeader({
  title,
  subtitle,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
