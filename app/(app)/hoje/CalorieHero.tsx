import Link from "next/link";
import { Flame, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

/**
 * Hero da Home — protagonista visual. Ring grande + display tipográfico
 * sobre fundo `bg-ember-gradient`. Diferente de tudo o resto da página,
 * serve pra criar hierarquia: calorias é o número mais importante do dia.
 *
 * Sem input — apenas visualização. O ring "respira" mesmo sem meta
 * cadastrada (mostra ring neutro de 100% vazio).
 */

interface CalorieHeroProps {
  consumed: number;
  goal: number | null;
  mealCount: number;
  /** Quando o dia está completo (todos os pilares atingidos), exibe selo. */
  dayComplete?: boolean;
}

const RING_SIZE = 180;
const STROKE = 14;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CalorieHero({
  consumed,
  goal,
  mealCount,
  dayComplete,
}: CalorieHeroProps) {
  const pct =
    goal != null && goal > 0 ? Math.max(0, Math.min(100, (consumed / goal) * 100)) : 0;
  const dashOffset = CIRCUMFERENCE * (1 - pct / 100);
  const avgPerMeal = mealCount > 0 ? Math.round(consumed / mealCount) : 0;

  return (
    <Card
      variant="feature"
      padded={false}
      className="relative overflow-hidden"
    >
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-16 h-40 w-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-center md:gap-10">
        <div className="flex items-center gap-5 md:flex-col md:items-start md:gap-3">
          {dayComplete && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill px-3 py-1",
                "bg-white/15 text-white text-[12px] font-semibold backdrop-blur-sm",
              )}
            >
              <Sparkles size={13} aria-hidden="true" />
              Dia completo
            </span>
          )}
          <div className="flex items-center gap-2 text-white/85">
            <Flame size={16} aria-hidden="true" />
            <span className="text-[12px] font-medium uppercase tracking-wide">
              Energia de hoje
            </span>
          </div>
        </div>

        <div className="relative shrink-0 self-center md:self-auto">
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            className="drop-shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
            role="img"
            aria-label={`${Math.round(pct)}% da meta calórica`}
          >
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={STROKE}
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="white"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={goal == null ? CIRCUMFERENCE : dashOffset}
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-[11px] uppercase tracking-wide text-white/75">
              {goal != null ? `${Math.round(pct)}%` : "sem meta"}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 text-white">
            <span className="font-display text-5xl font-bold leading-none tabular-nums sm:text-6xl">
              {consumed.toLocaleString("pt-BR")}
            </span>
            <span className="font-display text-2xl font-medium text-white/70">kcal</span>
          </div>
          {goal != null ? (
            <p className="mt-2 text-white/85">
              de{" "}
              <span className="font-mono font-semibold text-white">
                {goal.toLocaleString("pt-BR")} kcal
              </span>{" "}
              · faltam{" "}
              <span className="font-mono font-semibold text-white">
                {Math.max(0, goal - consumed).toLocaleString("pt-BR")}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-white/85">
              defina sua meta calórica em{" "}
              <Link href="/perfil" className="underline underline-offset-2 hover:text-white">
                /perfil
              </Link>
            </p>
          )}

          {mealCount > 0 && (
            <p className="mt-1 text-[13px] text-white/70">
              {mealCount} {mealCount === 1 ? "refeição registrada" : "refeições registradas"}{" "}
              · média {avgPerMeal.toLocaleString("pt-BR")} kcal cada
            </p>
          )}

          <Link
            href="/alimentacao"
            className={cn(
              "mt-5 inline-flex items-center gap-2 rounded-pill px-4 py-2",
              "bg-white/15 text-white text-[13px] font-semibold backdrop-blur-sm",
              "hover:bg-white/25 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ember-dark",
            )}
          >
            {mealCount === 0 ? "Registrar primeira refeição" : "Adicionar refeição"}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </Card>
  );
}
