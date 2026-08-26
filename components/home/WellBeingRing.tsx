"use client";

import { ProgressRings } from "@/components/ui/ProgressRing";

export interface WellBeingRingProps {
  /** Média de energia/humor/disposição (0–10). */
  value: number;
  size?: number;
  className?: string;
  label?: string;
}

/**
 * Ring único com o percentual de bem-estar (0–100%) calculado a partir de
 * energy + mood + disposition (0–10 cada). Usado na Home para resumir
 * visualmente o check-in do dia.
 *
 * Para o cálculo, importe `wellBeingAverage` de `@/lib/well-being`.
 */
export function WellBeingRing({
  value,
  size = 120,
  className,
  label = "Bem-estar hoje",
}: WellBeingRingProps) {
  const safeValue = Math.max(0, Math.min(10, Number.isFinite(value) ? value : 0));
  const pct = Math.round((safeValue / 10) * 100);

  return (
    <div
      className={["relative inline-flex items-center justify-center", className]
        .filter(Boolean)
        .join(" ")}
    >
      <ProgressRings
        rings={[{ value: safeValue, max: 10, color: "stroke-ember", label }]}
        size={size}
        strokeWidth={12}
      />
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-bold leading-none text-ink">
          {pct}%
        </span>
        <span className="mt-1 text-[11px] uppercase tracking-wide text-ink-faint">
          bem-estar
        </span>
      </div>
    </div>
  );
}