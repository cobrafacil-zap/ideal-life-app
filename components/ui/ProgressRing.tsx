"use client";

import { cn } from "@/lib/cn";

export interface RingSpec {
  /** Valor atual (0..max) */
  value: number;
  /** Máximo; default 10 */
  max?: number;
  /** Classe de stroke do Tailwind, ex: "stroke-ember" */
  color: string;
  /** Label acessível (lido por leitores de tela) */
  label?: string;
}

/**
 * Elemento de assinatura do app: anéis concêntricos de progresso.
 * Usado no check-in do dia (energia/humor/disposição) e reaproveitado
 * em água, cardio e outros indicadores circulares.
 */
export function ProgressRings({
  rings,
  size = 180,
  strokeWidth = 12,
  gap = 4,
  className,
}: {
  rings: RingSpec[];
  size?: number;
  strokeWidth?: number;
  gap?: number;
  className?: string;
}) {
  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("-rotate-90", className)}
      role="img"
      aria-label={
        rings.length === 1
          ? rings[0].label
          : "Indicadores de progresso"
      }
    >
      {rings.map((ring, i) => {
        const max = ring.max ?? 10;
        const radius = center - strokeWidth / 2 - i * (strokeWidth + gap);
        const circumference = 2 * Math.PI * radius;
        const pct = Math.max(0, Math.min(1, ring.value / max));
        const offset = circumference * (1 - pct);

        return (
          <g key={i}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              strokeWidth={strokeWidth}
              className="stroke-line/70 fill-none"
            />
            <circle
              cx={center}
              cy={center}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={cn(
                "fill-none transition-[stroke-dashoffset] duration-700 ease-out",
                ring.color
              )}
            />
          </g>
        );
      })}
    </svg>
  );
}
