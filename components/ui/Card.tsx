import { cn } from "@/lib/cn";
import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
  /** Acentua a borda e o fundo para chamar atenção em dashboards */
  emphasis?: boolean;
  /** Remove fundo e borda — útil em superfícies agrupadas */
  bare?: boolean;
  /** Estilo visual do card.
   *  - default: borda + bg-surface + shadow-card (uso geral).
   *  - feature: bg-ember-gradient, texto claro, sombra forte (hero/CTA).
   *  - ghost:   transparente, sem borda (agrupamentos inline).
   */
  variant?: "default" | "feature" | "ghost";
  as?: "div" | "section" | "article" | "aside";
}

export function Card({
  children,
  className,
  padded = true,
  emphasis = false,
  bare = false,
  variant = "default",
  as: Tag = "section",
  ...rest
}: CardProps) {
  // `bare` é legado e tem precedência sobre variant — preserva chamadas existentes.
  const effectiveVariant = bare ? "ghost" : variant;

  return (
    <Tag
      {...rest}
      className={cn(
        "rounded-card border transition-shadow transition-colors duration-200",
        effectiveVariant === "ghost"
          ? "bg-transparent border-transparent shadow-none"
          : effectiveVariant === "feature"
            ? cn(
                "bg-ember-gradient text-white border-ember-dark/20 shadow-floating",
                "ring-1 ring-white/10",
              )
            : cn(
                "bg-surface shadow-card",
                emphasis
                  ? "border-ember/30 ring-1 ring-ember/10"
                  : "border-line/60",
              ),
        padded && "p-6 sm:p-7",
        className,
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
  inverse,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** Inverte cores pra herdar do card variant=feature. */
  inverse?: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-3 flex items-start justify-between gap-3",
        className,
      )}
    >
      <div className="min-w-0">
        <h2
          className={cn(
            "font-display text-base font-semibold leading-tight",
            inverse ? "text-white" : "text-ink",
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              "mt-0.5 text-[13px]",
              inverse ? "text-white/75" : "text-ink-soft",
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
