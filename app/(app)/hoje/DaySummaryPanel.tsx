import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/cn";
import { formatLiters, formatHours } from "@/lib/format";

/**
 * Painel "SEU DIA — X%" — substitui o antigo CalorieHero.
 *
 * Mostra o % geral do dia (média dos 4 pilares) em 1 ring 120px + as 4
 * linhas-resumo abaixo. Gasto estimado e meta de consumo ficam em duas
 * linhas separadas (sub do ring) — sem confusão.
 *
 * Sem input. Server component.
 */

interface DaySummaryPanelProps {
  /** 0–100: média ponderada dos pilares. */
  overallPct: number;
  /** Gasto energético total estimado (TDEE). Pode ser null. */
  tdeeKcal: number | null;
  /** Meta de consumo. Pode ser null. */
  calorieGoal: number | null;
  caloriesConsumed: number;
  waterConsumed: number;
  waterGoal: number;
  workoutHoursWeek: number;
  workoutHoursGoal: number;
  /** 0–100 ou null (sem check-in). */
  wellbeingPct: number | null;
  /** Se dayComplete, mostra selo. */
  dayComplete: boolean;
}

const RING_SIZE = 120;
const STROKE = 10;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DaySummaryPanel({
  overallPct,
  tdeeKcal,
  calorieGoal,
  caloriesConsumed,
  waterConsumed,
  waterGoal,
  workoutHoursWeek,
  workoutHoursGoal,
  wellbeingPct,
  dayComplete,
}: DaySummaryPanelProps) {
  const dashOffset = CIRCUMFERENCE * (1 - Math.max(0, Math.min(100, overallPct)) / 100);

  return (
    <Card>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-5 sm:flex-col sm:items-start">
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-soft">
            Seu dia
          </p>
          <div className="relative shrink-0">
            <svg
              width={RING_SIZE}
              height={RING_SIZE}
              viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
              className="-rotate-90"
              role="img"
              aria-label={`${Math.round(overallPct)}% dos pilares cumpridos hoje`}
            >
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="var(--line)"
                strokeOpacity="0.4"
                strokeWidth={STROKE}
              />
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="var(--ember)"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                className="transition-[stroke-dashoffset] duration-700 ease-out"
              />
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-3xl font-bold leading-none text-ink tabular-nums">
                {Math.round(overallPct)}%
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-wide text-ink-faint">
                pilares
              </span>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[12px] text-ink-soft">
              {dayComplete ? (
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-moss-soft px-2 py-0.5 font-semibold text-moss-dark">
                  Dia completo ✨
                </span>
              ) : (
                "Como você está hoje, em números."
              )}
            </p>
          </div>

          <ul className="space-y-2.5">
            <PillarRow
              emoji="🔥"
              label="Calorias"
              value={`${caloriesConsumed.toLocaleString("pt-BR")} kcal`}
              progress={
                calorieGoal != null && calorieGoal > 0
                  ? { current: caloriesConsumed, max: calorieGoal }
                  : null
              }
            />
            <PillarRow
              emoji="💧"
              label="Água"
              value={`${formatLiters(waterConsumed)} / ${formatLiters(waterGoal)}`}
              progress={{ current: waterConsumed, max: waterGoal }}
            />
            <PillarRow
              emoji="🏋️"
              label="Treino (semana)"
              value={`${formatHours(workoutHoursWeek)} / ${formatHours(workoutHoursGoal)}`}
              progress={{
                current: workoutHoursWeek,
                max: Math.max(workoutHoursGoal, 0.5),
              }}
            />
            <PillarRow
              emoji="❤️"
              label="Bem-estar"
              value={
                wellbeingPct != null ? `${Math.round(wellbeingPct)}%` : "sem check-in"
              }
              progress={
                wellbeingPct != null
                  ? { current: wellbeingPct, max: 100 }
                  : null
              }
            />
          </ul>

          {(tdeeKcal != null || calorieGoal != null) && (
            <div className="mt-4 grid grid-cols-1 gap-1 border-t border-line/40 pt-3 text-[12px] sm:grid-cols-2">
              {tdeeKcal != null && (
                <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-start">
                  <span className="text-ink-soft">Gasto estimado</span>
                  <span className="font-mono font-semibold text-ink">
                    ~{tdeeKcal.toLocaleString("pt-BR")} kcal
                  </span>
                </div>
              )}
              {calorieGoal != null && (
                <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-start">
                  <span className="text-ink-soft">Meta de consumo</span>
                  <span className="font-mono font-semibold text-ink">
                    {calorieGoal.toLocaleString("pt-BR")} kcal
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function PillarRow({
  emoji,
  label,
  value,
  progress,
}: {
  emoji: string;
  label: string;
  value: string;
  progress: { current: number; max: number } | null;
}) {
  return (
    <li className="flex items-center gap-3">
      <span aria-hidden="true" className="text-base leading-none">
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[12px] font-medium text-ink-soft">{label}</span>
          <span className="font-mono text-[13px] font-semibold tabular-nums text-ink">
            {value}
          </span>
        </div>
        {progress && (
          <ProgressBar
            value={progress.current}
            max={progress.max}
            colorClass="bg-moss-gradient"
            className="mt-1"
          />
        )}
      </div>
    </li>
  );
}
