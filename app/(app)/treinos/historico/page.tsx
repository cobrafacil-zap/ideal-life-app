import Link from "next/link";
import { redirect } from "next/navigation";
import { History as HistoryIcon, Dumbbell, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import {
  listExerciseHistory,
  listWorkoutHistory,
} from "../actions";
import { formatHours, formatLongDate } from "@/lib/format";
import { PRIMARY_MUSCLE_LABEL } from "@/lib/workout";
import type { PrimaryMuscleGroup } from "@/types/database";
import { fmtKg } from "@/lib/workout-volume";
import { HistoryClient } from "./HistoryClient";

export const dynamic = "force-dynamic";

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams?: { range?: "7" | "30" | "90" | "365" };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rangeParam = (searchParams?.range ?? "30") as "7" | "30" | "90" | "365";
  const rangeDays = Number(rangeParam) as 7 | 30 | 90 | 365;

  const [sessions, exercises] = await Promise.all([
    listWorkoutHistory({ rangeDays, limit: 60 }),
    listExerciseHistory({ rangeDays }),
  ]);

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        title="Histórico de treinos"
        subtitle="Veja sessões finalizadas e progressão por exercício."
      />

      <HistoryClient rangeDays={rangeDays} />

      <Card>
        <CardHeader
          title="Sessões finalizadas"
          description="Lista cronológica das suas últimas sessões."
        />
        {sessions.length === 0 ? (
          <EmptyState
            icon={HistoryIcon}
            title="Nenhuma sessão finalizada"
            description="Inicie um treino na agenda ou biblioteca para começar a registrar séries."
            action={
              <Link
                href="/treinos/agenda"
                className="inline-flex h-9 items-center gap-1 rounded-pill bg-ember px-4 text-[13px] font-semibold text-white hover:bg-ember-dark"
              >
                Ir para a agenda
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/treinos/historico/sessao/${s.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-line/60 bg-surface p-3 hover:border-ember/40 hover:shadow-card"
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ember-soft text-ember">
                    <Dumbbell size={16} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold text-ink">
                      {s.workout_name}
                    </p>
                    <p className="text-[11px] text-ink-soft">
                      {formatLongDate(new Date(s.started_at))} ·{" "}
                      {formatHours(s.duration_h ?? 0)} · {s.set_count} séries
                      {" · "}
                      {fmtKg(s.total_volume_kg)} volume
                    </p>
                  </div>
                  {s.user_rpe != null && (
                    <span className="rounded-pill bg-base/60 px-2 py-0.5 text-[10px] font-semibold text-ink-soft">
                      RPE {s.user_rpe}
                    </span>
                  )}
                  <ChevronRight size={14} aria-hidden="true" className="text-ink-faint" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Exercícios"
          description="Carga máxima registrada no período."
        />
        {exercises.length === 0 ? (
          <p className="rounded-2xl bg-base/40 p-4 text-center text-[12px] text-ink-soft">
            Sem exercícios registrados no período.
          </p>
        ) : (
          <ul className="space-y-2">
            {exercises.map((ex) => (
              <li key={ex.exercise_id}>
                <Link
                  href={`/treinos/historico/exercicio/${ex.exercise_id}`}
                  className="flex items-center gap-3 rounded-2xl border border-line/60 bg-surface p-3 hover:border-ember/40 hover:shadow-card"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold text-ink">
                      {ex.exercise_name}
                    </p>
                    <p className="text-[11px] text-ink-soft">
                      {PRIMARY_MUSCLE_LABEL[ex.primary_muscle as PrimaryMuscleGroup] ?? ex.primary_muscle ?? "—"}
                      {" · "}
                      {ex.sessions} {ex.sessions === 1 ? "sessão" : "sessões"}
                      {" · "}
                      {ex.total_sets} séries
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-ink">
                      {fmtKg(ex.top_load_kg)}
                    </p>
                    <p className="text-[10px] text-ink-faint">carga máxima</p>
                  </div>
                  <ChevronRight size={14} aria-hidden="true" className="text-ink-faint" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
