import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { getExerciseProgression } from "../../../actions";
import { getExerciseMediaSignedUrl } from "@/lib/exercise-images";
import { ZoomableMedia } from "@/components/ui/ZoomableMedia";
import { formatShortDate } from "@/lib/format";
import { fmtKg } from "@/lib/workout-volume";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export default async function HistoricoExercicioPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const points = await getExerciseProgression(params.id, { rangeDays: 180 });

  // Busca o exercício (id real OU sentinel orphan:name) para nome + mídia.
  let exerciseName = "Exercício";
  let exerciseForImage: {
    id: string;
    name: string;
    primary_muscle: string;
    secondary_muscles: string[];
    equipment: string | null;
    image_url: string | null;
    animation_url: string | null;
    user_id: string | null;
  } | null = null;

  if (params.id.startsWith("orphan:")) {
    exerciseName = decodeURIComponent(params.id.slice("orphan:".length));
    exerciseForImage = {
      id: params.id,
      name: exerciseName,
      primary_muscle: "outro",
      secondary_muscles: [],
      equipment: null,
      image_url: null,
      animation_url: null,
      user_id: null,
    };
  } else {
    const { data } = await supabase
      .from("exercises")
      .select(
        "id, name, primary_muscle, secondary_muscles, equipment, image_url, animation_url, user_id",
      )
      .eq("id", params.id)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .maybeSingle();
    if (data?.name) {
      exerciseName = data.name;
      exerciseForImage = data;
    }
  }

  const signedUrl = exerciseForImage
    ? await getExerciseMediaSignedUrl(
        supabase,
        exerciseForImage.image_url,
        exerciseForImage.animation_url,
        exerciseForImage.name,
      )
    : null;

  if (points.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center gap-3">
          <Link
            href="/treinos/historico"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-base/60 hover:text-ink"
            aria-label="Voltar"
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </Link>
          {exerciseForImage && (
            <ZoomableMedia
              exercise={exerciseForImage}
              signedUrl={signedUrl}
              size="md"
            />
          )}
          <h1 className="font-display text-xl font-bold text-ink">
            {exerciseName}
          </h1>
        </div>
        <p className="rounded-card border border-dashed border-line bg-surface/60 p-6 text-center text-[13px] text-ink-soft">
          Sem séries registradas nos últimos 180 dias.
        </p>
      </div>
    );
  }

  const first = points[0];
  const last = points[points.length - 1];
  const topDelta = first.top_load_kg != null && last.top_load_kg != null
    ? Math.round((last.top_load_kg - first.top_load_kg) * 100) / 100
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/treinos/historico"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-base/60 hover:text-ink"
          aria-label="Voltar"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        {exerciseForImage && (
          <ZoomableMedia
            exercise={exerciseForImage}
            signedUrl={signedUrl}
            size="md"
          />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-bold text-ink">
            {exerciseName}
          </h1>
          <p className="text-[12px] text-ink-soft">
            {points.length} {points.length === 1 ? "sessão" : "sessões"} nos últimos 180 dias
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat
          label="Carga máxima atual"
          value={fmtKg(last.top_load_kg)}
        />
        <Stat
          label="Volume da última sessão"
          value={fmtKg(last.total_volume_kg)}
        />
        <Stat
          label="Δ carga vs. 1ª sessão"
          value={
            topDelta == null
              ? "—"
              : topDelta === 0
                ? "estável"
                : `${topDelta > 0 ? "+" : ""}${fmtKg(topDelta)}`
          }
          tone={topDelta == null ? "neutral" : topDelta > 0 ? "good" : topDelta < 0 ? "bad" : "neutral"}
        />
      </div>

      <Card>
        <CardHeader
          title="Carga máxima por sessão"
          description="Maior carga registrada em cada sessão (em kg)."
        />
        <ul className="space-y-1">
          {points.map((p) => (
            <li
              key={p.session_id}
              className="flex items-center justify-between rounded-xl bg-base/30 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold text-ink">
                  {fmtKg(p.top_load_kg)}
                </p>
                <p className="text-[10px] text-ink-faint">
                  {p.top_load_kg != null && p.reps_at_top != null && p.reps_at_top > 0
                    ? `${p.reps_at_top} reps · `
                    : ""}
                  {p.total_sets} séries · {fmtKg(p.total_volume_kg)} volume
                </p>
              </div>
              <Link
                href={`/treinos/historico/sessao/${p.session_id}`}
                className="text-[11px] text-ink-soft hover:text-ember"
              >
                {formatShortDate(new Date(p.started_at))}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "neutral";
}) {
  return (
    <div className="rounded-2xl border border-line/60 bg-surface p-3">
      <p className="text-[10px] uppercase tracking-wide text-ink-faint">
        {label}
      </p>
      <p
        className={cn(
          "font-mono text-base font-bold",
          tone === "good" && "text-moss-dark",
          tone === "bad" && "text-ember-dark",
          !tone || tone === "neutral" ? "text-ink" : "",
        )}
      >
        {value}
      </p>
    </div>
  );
}
