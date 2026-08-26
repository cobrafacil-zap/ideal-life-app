import Link from "next/link";
import { Scale } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/cn";

/**
 * "PROGRESSO DO PESO" — card com barra de progresso do peso vs meta.
 *
 * Requer `weightStart` (peso no momento em que a meta foi definida) e
 * `weightGoal`. `weightStart` pode vir null quando o usuário ainda não
 * cadastrou — nesse caso, exibimos fallback "defina sua meta em /saude".
 *
 * Quando `current` está entre start e goal: % = (start - current) / (start - goal).
 */

interface WeightProgressCardProps {
  current: number | null;
  start: number | null;
  goal: number | null;
}

export function WeightProgressCard({
  current,
  start,
  goal,
}: WeightProgressCardProps) {
  if (current == null || start == null || goal == null || start <= goal) {
    return (
      <Card>
        <CardHeader
          title="Progresso do peso"
          description="Defina sua meta de peso em /saude."
        />
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-base text-ink-soft">
            <Scale size={16} aria-hidden="true" />
          </span>
          <p className="text-[13px] text-ink-soft">
            Você ainda não cadastrou uma meta de peso.
          </p>
        </div>
        <Link
          href="/saude"
          className={cn(
            "mt-3 inline-block text-[12px] font-medium text-ink-soft underline-offset-4 hover:text-ember hover:underline",
          )}
        >
          Cadastrar meta →
        </Link>
      </Card>
    );
  }

  const total = start - goal;
  const perdidos = Math.max(0, start - current);
  const restantes = Math.max(0, current - goal);
  const pct = Math.max(0, Math.min(100, (perdidos / total) * 100));
  const complete = perdidos >= total;

  return (
    <Card>
      <CardHeader
        title="Progresso do peso"
        description={
          complete
            ? "Você atingiu sua meta de peso! 🎉"
            : "Do início da meta até o objetivo final."
        }
      />
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-mono text-lg font-semibold leading-none text-ink tabular-nums">
          {current.toFixed(1).replace(".", ",")} kg
        </p>
        <p className="text-[12px] text-ink-soft">
          Meta: {goal.toFixed(1).replace(".", ",")} kg
        </p>
      </div>

      <ProgressBar
        value={perdidos}
        max={total}
        colorClass="bg-moss-gradient"
        className="mt-3"
      />

      <div className="mt-3 flex items-center justify-between text-[12px]">
        <span className="text-ink-soft">
          <span className="font-mono font-semibold text-ink">
            {perdidos.toFixed(1).replace(".", ",")} kg
          </span>{" "}
          eliminados
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 font-semibold",
            complete ? "bg-moss-soft text-moss-dark" : "bg-gold-soft text-gold-dark",
          )}
        >
          {Math.round(pct)}% do caminho
        </span>
      </div>

      {!complete && restantes > 0 && (
        <p className="mt-2 text-[11px] text-ink-faint">
          Faltam {restantes.toFixed(1).replace(".", ",")} kg para sua meta.
        </p>
      )}
    </Card>
  );
}
