import Link from "next/link";
import { cn } from "@/lib/cn";
import { Flame, Droplets, Dumbbell } from "lucide-react";
import { formatHours } from "@/lib/format";

/**
 * Hero de visualização da Home: 3 cards com gráfico (ring SVG)
 * para calorias, água e treino da semana. Sem botões de edição —
 * apenas resumo. Cada card leva ao módulo correspondente.
 */

interface DailyProgressHeroProps {
  // Calorias (hoje vs meta diária)
  caloriesConsumed: number;
  calorieGoal: number | null;
  // Água (hoje vs meta diária, em ml)
  waterConsumedMl: number;
  waterGoalMl: number;
  // Cardio da semana (minutos vs meta semanal)
  cardioMinutesWeek: number;
  cardioGoalMin: number;
  // Treinos (horas da semana vs meta em horas)
  workoutHoursWeek: number;
  workoutHoursGoal: number;
}

export function DailyProgressHero({
  caloriesConsumed,
  calorieGoal,
  waterConsumedMl,
  waterGoalMl,
  cardioMinutesWeek,
  cardioGoalMin,
  workoutHoursWeek,
  workoutHoursGoal,
}: DailyProgressHeroProps) {
  const caloriesCompleted =
    calorieGoal != null && caloriesConsumed >= calorieGoal;
  const waterCompleted = waterConsumedMl >= waterGoalMl;
  const cardioCompleted = cardioMinutesWeek >= cardioGoalMin;
  const workoutCompleted = workoutHoursWeek >= workoutHoursGoal;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <ProgressCard
        href="/alimentacao"
        icon={Flame}
        iconBg="bg-ember-soft"
        iconColor="text-ember-dark"
        label="Calorias hoje"
        ringColor="stroke-ember"
        current={caloriesConsumed}
        max={calorieGoal ?? 0}
        primary={caloriesConsumed.toLocaleString("pt-BR")}
        unit="kcal"
        secondary={
          calorieGoal
            ? `de ${calorieGoal.toLocaleString("pt-BR")} kcal`
            : "defina sua meta em /perfil"
        }
        completed={caloriesCompleted}
      />
      <ProgressCard
        href="/alimentacao"
        icon={Droplets}
        iconBg="bg-moss-soft"
        iconColor="text-moss-dark"
        label="Água hoje"
        ringColor="stroke-moss"
        current={waterConsumedMl}
        max={waterGoalMl}
        primary={`${(waterConsumedMl / 1000).toFixed(1).replace(".", ",")}L`}
        secondary={`meta ${(waterGoalMl / 1000).toFixed(1).replace(".", ",")}L`}
        completed={waterCompleted}
      />
      <ProgressCard
        href="/saude"
        icon={Dumbbell}
        iconBg="bg-gold-soft"
        iconColor="text-gold-dark"
        label="Treino (semana)"
        ringColor="stroke-gold"
        current={workoutHoursWeek}
        max={workoutHoursGoal}
        primary={`${formatHours(workoutHoursWeek)} / ${formatHours(workoutHoursGoal)}`}
        secondary={
          workoutCompleted
            ? "meta atingida"
            : workoutHoursGoal - workoutHoursWeek > 0
              ? `faltam ${formatHours(workoutHoursGoal - workoutHoursWeek)}`
              : `${cardioMinutesWeek} min cardio`
        }
        completed={workoutCompleted}
      />
    </div>
  );
}

interface ProgressCardProps {
  href: string;
  icon: typeof Flame;
  iconBg: string;
  iconColor: string;
  label: string;
  ringColor: string;
  current: number;
  max: number;
  primary: string;
  unit?: string;
  secondary: string;
  completed: boolean;
}

function ProgressCard({
  href,
  icon: Icon,
  iconBg,
  iconColor,
  label,
  ringColor,
  current,
  max,
  primary,
  unit,
  secondary,
  completed,
}: ProgressCardProps) {
  const safeMax = Math.max(max, 1);
  const pct = Math.min(1, current / safeMax);
  const size = 56;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = pct * circumference;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl border border-line/60 bg-surface p-3 transition-all",
        "hover:border-ember/40 hover:shadow-floating",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base",
      )}
      aria-label={`${label}: ${primary}`}
    >
      <div className="relative shrink-0" aria-hidden="true">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-line/70"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeLinecap="round"
            className={cn("transition-[stroke-dasharray] duration-500 ease-out", ringColor)}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-lg",
              iconBg,
              iconColor,
            )}
          >
            <Icon size={12} aria-hidden="true" />
          </span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium text-ink-soft">{label}</p>
        <p className="font-mono text-base font-bold leading-tight text-ink">
          {primary}
          {unit && (
            <span className="ml-1 text-[12px] font-normal text-ink-soft">
              {unit}
            </span>
          )}
        </p>
        <p className="truncate text-[11px] text-ink-faint">{secondary}</p>
      </div>

      {completed && (
        <span
          className="absolute right-2 top-2 inline-flex h-2 w-2 rounded-full bg-moss"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}