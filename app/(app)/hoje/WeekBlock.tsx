import { Dumbbell, Activity, Droplets, Scale } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

/**
 * "SUA SEMANA" — bloco agregado com 4 stats pequenos.
 *
 * Não compete visualmente com o DaySummaryPanel (que é o protagonista):
 * tudo aqui é só uma linha de pills com ícones pequenos.
 */

interface WeekBlockProps {
  /** Treinos da semana (sessões finalizadas com horas registradas). */
  workoutsCount: number;
  workoutsHours: number;
  workoutsGoalHours: number;
  cardioMinutes: number;
  cardioGoalMin: number;
  /** Média de água diária nos últimos 7 dias com dados (em ml). */
  waterAvgMl: number;
  /** Delta de peso nos últimos 7 dias (em kg). Positivo = subiu, negativo = perdeu. */
  weightDelta7d: number | null;
}

const ICON_CLASS = "h-3.5 w-3.5";

export function WeekBlock({
  workoutsCount,
  workoutsHours,
  workoutsGoalHours,
  cardioMinutes,
  cardioGoalMin,
  waterAvgMl,
  weightDelta7d,
}: WeekBlockProps) {
  // Treinos: progresso "0/Y" = horas da semana / meta em horas. Count complementa.
  const treinoLabel = `${workoutsHours.toFixed(1).replace(".", ",")}h / ${workoutsGoalHours.toFixed(0)}h`;

  return (
    <Card>
      <CardHeader
        title="Sua semana"
        description="Como está o ritmo dos últimos dias."
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          icon={Dumbbell}
          label="Treinos"
          value={treinoLabel}
          sub={
            workoutsCount > 0
              ? `${workoutsCount} ${workoutsCount === 1 ? "sessão" : "sessões"}`
              : "nenhum"
          }
          accent="gold"
        />
        <Stat
          icon={Activity}
          label="Cardio"
          value={`${cardioMinutes} / ${cardioGoalMin} min`}
          sub={cardioMinutes > 0 ? "" : "nenhum"}
          accent="ember"
        />
        <Stat
          icon={Droplets}
          label="Água (média)"
          value={`${(waterAvgMl / 1000).toFixed(1).replace(".", ",")} L/dia`}
          sub="últimos 7 dias"
          accent="moss"
        />
        <Stat
          icon={Scale}
          label="Peso (7d)"
          value={
            weightDelta7d == null
              ? "—"
              : `${weightDelta7d > 0 ? "+" : ""}${weightDelta7d.toFixed(1).replace(".", ",")} kg`
          }
          sub="vs. 7 dias atrás"
          accent={weightDelta7d == null ? "moss" : weightDelta7d < 0 ? "moss" : "ember"}
        />
      </div>
    </Card>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof Dumbbell;
  label: string;
  value: string;
  sub: string;
  accent: "ember" | "moss" | "gold";
}) {
  const accentBg: Record<typeof accent, string> = {
    ember: "bg-ember-soft",
    moss: "bg-moss-soft",
    gold: "bg-gold-soft",
  };
  const accentText: Record<typeof accent, string> = {
    ember: "text-ember",
    moss: "text-moss-dark",
    gold: "text-gold-dark",
  };
  return (
    <div className="rounded-2xl border border-line/40 bg-base/30 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-md", accentBg[accent])}>
          <Icon className={cn(ICON_CLASS, accentText[accent])} aria-hidden="true" />
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-ink-soft">
          {label}
        </span>
      </div>
      <p className="font-mono text-base font-semibold leading-none tabular-nums text-ink">
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-[11px] text-ink-faint">{sub}</p>
      )}
    </div>
  );
}
