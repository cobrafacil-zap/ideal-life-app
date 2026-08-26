import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { listDiscomfortHistory } from "../actions";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const entries = await listDiscomfortHistory({ rangeDays: 90, minLevel: 1 });

  // Conta recorrências por exercício.
  const byExercise = new Map<string, number>();
  for (const e of entries) {
    byExercise.set(e.exercise_name, (byExercise.get(e.exercise_name) ?? 0) + 1);
  }
  const recurring = Array.from(byExercise.entries())
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        title="Feedback de desconforto"
        subtitle="Desconfortos físicos que você registrou durante séries — sem diagnóstico, só histórico."
      />

      <Card padded={false} className="bg-base/40 border-line">
        <div className="flex items-start gap-3 p-4 sm:p-5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-line text-ink-soft">
            <Info size={16} aria-hidden="true" />
          </span>
          <p className="text-[12px] leading-relaxed text-ink-soft">
            Estes registros servem só para você acompanhar desconfortos
            percebidos. O Vitta <strong>não diagnostica</strong> lesões nem
            afirma que determinada carga é segura. Se desconfortos forem
            recorrentes no mesmo exercício ou região, vale conversar com um
            profissional de educação física ou fisioterapeuta.
          </p>
        </div>
      </Card>

      {recurring.length > 0 && (
        <Card>
          <CardHeader
            title="Exercícios com desconforto recorrente"
            description="Apareceram em 2 ou mais séries nos últimos 90 dias."
          />
          <ul className="space-y-2">
            {recurring.map(([name, count]) => (
              <li
                key={name}
                className="flex items-center gap-3 rounded-2xl border border-line/60 bg-surface p-3"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ember-soft text-ember">
                  <AlertTriangle size={14} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-ink">
                    {name}
                  </p>
                  <p className="text-[11px] text-ink-soft">
                    {count} {count === 1 ? "série" : "séries"} com desconforto
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Histórico de desconforto"
          description="Séries com desconforto relatado (0–10)."
        />
        {entries.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Nenhum desconforto registrado"
            description="Quando você marcar desconforto em uma série, ela aparece aqui."
          />
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li
                key={e.set_id}
                className="flex items-start gap-3 rounded-2xl border border-line/60 bg-surface p-3"
              >
                <DiscomfortBadge value={e.discomfort} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-ink">
                    {e.exercise_name}
                  </p>
                  <p className="text-[11px] text-ink-soft">
                    Série #{e.set_number}
                    {e.load != null ? ` · ${e.load} ${e.load_unit}` : ""}
                    {e.reps != null ? ` · ${e.reps} reps` : ""}
                    {e.rpe != null ? ` · RPE ${e.rpe}` : ""}
                  </p>
                  <p className="text-[10px] text-ink-faint">
                    {e.workout_name} · {formatShortDate(new Date(e.started_at))}
                  </p>
                </div>
                <Link
                  href={`/treinos/historico/sessao/${e.session_id}`}
                  className="text-[11px] font-medium text-ink-soft hover:text-ember"
                >
                  ver sessão
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function DiscomfortBadge({ value }: { value: number }) {
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono text-[12px] font-bold",
        value <= 3
          ? "bg-moss-soft text-moss-dark"
          : value <= 6
            ? "bg-gold-soft text-gold-dark"
            : "bg-ember-soft text-ember-dark",
      )}
      aria-label={`Desconforto ${value} de 10`}
    >
      {value}
    </span>
  );
}
