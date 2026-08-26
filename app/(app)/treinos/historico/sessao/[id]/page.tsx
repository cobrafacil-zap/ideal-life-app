import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { getWorkoutSessionDetail } from "../../../actions";
import { formatHours, formatLongDate } from "@/lib/format";
import { fmtKg, totalVolume } from "@/lib/workout-volume";

export const dynamic = "force-dynamic";

export default async function HistoricoSessaoPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const detail = await getWorkoutSessionDetail(params.id);
  if (!detail) notFound();

  // Agrupa séries por exercício.
  const groups = new Map<
    string,
    {
      name: string;
      sets: typeof detail.sets;
    }
  >();
  for (const s of detail.sets) {
    if (!groups.has(s.exercise_name)) {
      groups.set(s.exercise_name, { name: s.exercise_name, sets: [] });
    }
    groups.get(s.exercise_name)!.sets.push(s);
  }
  for (const g of groups.values()) g.sets.sort((a, b) => a.set_number - b.set_number);

  const vol = totalVolume(
    detail.sets.map((s) => ({
      reps: s.reps,
      load: s.load,
      load_unit: s.load_unit,
    })),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href="/treinos/historico"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-base/60 hover:text-ink"
          aria-label="Voltar"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        <h1 className="font-display text-xl font-bold text-ink">
          {detail.workout_name}
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Data" value={formatLongDate(new Date(detail.started_at))} />
        <Stat label="Duração" value={formatHours((detail.duration_min ?? 0) / 60)} />
        <Stat label="Volume total" value={fmtKg(vol)} />
      </div>

      {detail.user_rpe != null && (
        <p className="inline-flex items-center gap-2 rounded-2xl bg-base/40 px-3 py-2 text-[12px] text-ink-soft">
          RPE da sessão:{" "}
          <strong className="font-mono text-ink">{detail.user_rpe}/10</strong>
        </p>
      )}

      <ul className="space-y-3">
        {Array.from(groups.values()).map((g) => {
          const groupVol = totalVolume(
            g.sets.map((s) => ({
              reps: s.reps,
              load: s.load,
              load_unit: s.load_unit,
            })),
          );
          return (
            <li key={g.name}>
              <Card>
                <CardHeader
                  title={g.name}
                  description={`${g.sets.length} séries · ${fmtKg(groupVol)}`}
                />
                <ul className="divide-y divide-line/40">
                  {g.sets.map((s) => (
                    <li
                      key={s.id}
                      className="grid grid-cols-[40px_1fr_1fr_1fr_1fr] items-center gap-2 py-2 text-[12px]"
                    >
                      <span className="font-mono text-ink-soft">#{s.set_number}</span>
                      <span className="font-mono">{s.reps ?? "—"} reps</span>
                      <span className="font-mono">
                        {s.load != null ? `${s.load} ${s.load_unit}` : "—"}
                      </span>
                      <span className="text-[11px] text-ink-soft">
                        RPE {s.rpe ?? "—"}
                      </span>
                      <span className="text-[11px] text-ink-soft">
                        Dor {s.discomfort ?? "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line/60 bg-surface p-3">
      <p className="text-[10px] uppercase tracking-wide text-ink-faint">
        {label}
      </p>
      <p className="font-mono text-base font-bold text-ink">{value}</p>
    </div>
  );
}
