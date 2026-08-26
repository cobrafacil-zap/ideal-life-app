import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatHours } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * Treinos da semana — card horizontal com ring gold + tipografia.
 * Substitui o antigo mini-card do hero (que duplicava com o sidebar).
 *
 * Cor gold escolhida com função: progresso semanal ≠ ação imediata
 * (que é ember) nem conquista cumprida (que é moss). É "rotina em construção".
 */

interface WorkoutWeekHeroProps {
  hoursThisWeek: number;
  hoursGoal: number;
}

const RING_SIZE = 96;
const STROKE = 8;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function WorkoutWeekHero({
  hoursThisWeek,
  hoursGoal,
}: WorkoutWeekHeroProps) {
  const safeGoal = Math.max(hoursGoal, 0.5);
  const pct = Math.max(0, Math.min(100, (hoursThisWeek / safeGoal) * 100));
  const dashOffset = CIRCUMFERENCE * (1 - pct / 100);
  const completed = hoursThisWeek >= hoursGoal;
  const remaining = Math.max(0, hoursGoal - hoursThisWeek);

  return (
    <Card>
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            className="-rotate-90"
            role="img"
            aria-label={`${Math.round(pct)}% da meta semanal de treino`}
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
              stroke="var(--gold)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Dumbbell
              size={22}
              className={cn(
                completed ? "text-moss-dark" : "text-gold-dark",
              )}
              strokeWidth={2.2}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <CardHeader
              title="Treinos da semana"
              description="Horas de musculação acumuladas até agora."
              className="mb-0"
            />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold leading-none text-ink tabular-nums">
              {formatHours(hoursThisWeek)}
            </span>
            <span className="text-[13px] text-ink-soft">
              de {formatHours(hoursGoal)}
            </span>
          </div>
          {completed ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-moss-soft px-2.5 py-1 text-[12px] font-semibold text-moss-dark">
              Meta semanal atingida
            </p>
          ) : (
            <p className="mt-2 text-[12px] text-ink-soft">
              Faltam{" "}
              <span className="font-mono font-semibold text-ink">
                {formatHours(remaining)}
              </span>{" "}
              para fechar a semana.
            </p>
          )}
          <Link
            href="/saude"
            className="mt-3 inline-block text-[12px] font-medium text-ink-soft underline-offset-4 hover:text-ember hover:underline"
          >
            Detalhes em /saude →
          </Link>
        </div>
      </div>
    </Card>
  );
}
