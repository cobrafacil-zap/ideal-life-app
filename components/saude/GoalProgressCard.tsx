import { ProgressBar } from "@/components/ui/ProgressBar";

export interface GoalProgressCardProps {
  weightStart: number | null;
  currentWeight: number | null;
  weightGoal: number | null;
}

/**
 * Card "Seu objetivo" — mostra peso inicial / atual / meta + barra de progresso.
 * Renderizado dentro de "Seus objetivos" no /saude, apenas para goal_type='perder'.
 */
export function GoalProgressCard({
  weightStart,
  currentWeight,
  weightGoal,
}: GoalProgressCardProps) {
  const start = weightStart ?? currentWeight ?? null;
  const goal = weightGoal ?? null;

  if (!start || !goal) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/60 p-4 text-[13px] text-ink-soft">
        Defina sua meta de peso (e, se for o caso, o peso inicial) para acompanhar
        a evolução aqui.
      </div>
    );
  }

  const current = currentWeight ?? start;
  const totalToGo = Math.max(0, start - goal);
  const lost = Math.max(0, start - current);
  const pct =
    totalToGo > 0 ? Math.min(100, Math.round((lost / totalToGo) * 100)) : 0;

  return (
    <div className="rounded-2xl bg-moss-soft/40 p-4 sm:p-5">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Stat label="Peso inicial" value={start} />
        <Stat label="Peso atual" value={current} highlight />
        <Stat label="Meta" value={goal} />
      </div>
      <div className="mt-4">
        <ProgressBar
          value={lost}
          max={Math.max(totalToGo, 0.1)}
          colorClass="bg-moss-gradient"
          height="md"
          showValue={false}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[12px] text-ink-soft">
        <span>
          <strong className="font-mono text-ink">{lost.toFixed(1)} kg</strong>{" "}
          perdidos de {totalToGo.toFixed(1)} kg
        </span>
        <span className="font-mono font-semibold text-moss-dark">{pct}%</span>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number | null;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-ink-faint">
        {label}
      </p>
      <p
        className={
          "mt-0.5 font-mono text-lg font-bold leading-tight " +
          (highlight ? "text-moss-dark" : "text-ink")
        }
      >
        {value != null ? `${value.toFixed(1)} kg` : "—"}
      </p>
    </div>
  );
}