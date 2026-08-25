"use client";

interface Ring {
  value: number; // 0-10 ou 0-100 dependendo de `max`
  max: number;
  color: string; // classe de stroke, ex: "stroke-ember"
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
}: {
  rings: Ring[];
  size?: number;
  strokeWidth?: number;
  gap?: number;
}) {
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      {rings.map((ring, i) => {
        const radius = center - strokeWidth / 2 - i * (strokeWidth + gap);
        const circumference = 2 * Math.PI * radius;
        const pct = Math.max(0, Math.min(1, ring.value / ring.max));
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
              className={`fill-none transition-[stroke-dashoffset] duration-700 ease-out ${ring.color}`}
            />
          </g>
        );
      })}
    </svg>
  );
}
