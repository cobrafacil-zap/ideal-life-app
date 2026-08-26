import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Dumbbell,
  ListChecks,
  CalendarDays,
  History,
  ChevronRight,
  Play,
  AlertCircle,
  Check,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/EmptyState";
import { ExerciseLibrary } from "./ExerciseLibrary";
import { getExerciseImageSignedUrl } from "@/lib/exercise-images";
import { formatHours, formatShortDate } from "@/lib/format";
import { todayBR } from "@/lib/datetime";
import { startOfWeekISO } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Exercise } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function TreinosPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    { data: exercises },
    { data: plans },
    { data: activeSession },
    { data: weekSessions },
    { data: todaySession },
  ] = await Promise.all([
    supabase
      .from("exercises")
      .select(
        "id, user_id, name, primary_muscle, secondary_muscles, equipment, image_url, created_at",
      )
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order("name", { ascending: true })
      .limit(300),
    supabase
      .from("workout_plans")
      .select("id, name, is_active, sort_order, updated_at")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("updated_at", { ascending: false })
      .limit(20),
    supabase
      .from("workout_sessions")
      .select("id, workout_name, workout_plan_id, started_at")
      .eq("user_id", user.id)
      .is("finished_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("workout_sessions")
      .select("id, workout_name, started_at, duration_h, finished_at")
      .eq("user_id", user.id)
      .not("finished_at", "is", null)
      .gte("started_at", startOfWeekISO())
      .order("started_at", { ascending: false }),
    supabase
      .from("workout_sessions")
      .select("id, workout_name, finished_at, duration_h")
      .eq("user_id", user.id)
      .not("finished_at", "is", null)
      .gte("started_at", `${todayBR()}T00:00:00`)
      .lte("started_at", `${todayBR()}T23:59:59`)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // Signed URLs para os exercícios do usuário + catálogo (até 20 primeiros para preview).
  const exerciseList = (exercises ?? []) as Pick<
    Exercise,
    | "id"
    | "user_id"
    | "name"
    | "primary_muscle"
    | "secondary_muscles"
    | "equipment"
    | "image_url"
    | "created_at"
  >[];

  const signedUrlMap: Record<string, string | null> = {};
  await Promise.all(
    exerciseList.slice(0, 60).map(async (ex) => {
      signedUrlMap[ex.id] = ex.image_url
        ? await getExerciseImageSignedUrl(supabase, ex.image_url)
        : null;
    }),
  );

  const weekHours = (weekSessions ?? []).reduce(
    (s, w) => s + (w.duration_h ?? 0),
    0,
  );
  const weekCount = weekSessions?.length ?? 0;
  const activePlan = (plans ?? []).find((p) => p.is_active) ?? null;

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        title="Treinos"
        subtitle="Biblioteca de exercícios, planos e histórico de séries."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {activeSession && (
            <Card padded={false} className="border-ember/30 bg-ember-soft/40">
              <div className="flex items-center gap-3 p-4 sm:p-5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ember text-white">
                  <Play size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-bold text-ink">
                    Treino em andamento
                  </p>
                  <p className="text-[12px] text-ink-soft">
                    {activeSession.workout_name} — iniciado{" "}
                    {formatShortDate(new Date(activeSession.started_at))}
                  </p>
                </div>
                <Link
                  href={`/treinos/sessao/${activeSession.id}`}
                  className="inline-flex h-9 items-center gap-1 rounded-pill bg-ember px-4 text-[13px] font-semibold text-white hover:bg-ember-dark"
                >
                  Retomar
                </Link>
              </div>
            </Card>
          )}

          {todaySession && !activeSession && (
            <Card padded={false} className="bg-moss-soft/40 border-moss/20">
              <div className="flex items-center gap-3 p-4 sm:p-5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-moss text-white">
                  <Check size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-bold text-ink">
                    Você treinou hoje
                  </p>
                  <p className="text-[12px] text-ink-soft">
                    {todaySession.workout_name} —{" "}
                    {formatHours(todaySession.duration_h ?? 0)}
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader
              title="Biblioteca de exercícios"
              description="Crie seus exercícios ou use o catálogo global. Imagens são suas — nada baixado da internet."
            />
            <ExerciseLibrary
              initialExercises={exerciseList}
              signedUrls={signedUrlMap}
            />
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader
              title="Sua semana"
              description="Horas registradas nesta semana."
            />
            <div className="flex items-baseline justify-between">
              <p className="font-mono text-3xl font-bold text-ink">
                {formatHours(weekHours)}
              </p>
              <p className="text-[12px] text-ink-soft">
                {weekCount} {weekCount === 1 ? "sessão" : "sessões"}
              </p>
            </div>
            {activePlan ? (
              <p className="mt-3 text-[12px] text-ink-soft">
                Plano ativo: <strong className="text-ink">{activePlan.name}</strong>
              </p>
            ) : (
              <p className="mt-3 inline-flex items-start gap-1.5 rounded-2xl bg-base/40 p-3 text-[12px] text-ink-soft">
                <AlertCircle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                Nenhum plano ativo. Crie um plano para iniciar um treino guiado.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Planos"
              description="Crie, edite e ative seus planos de treino."
            />
            {(plans ?? []).length === 0 ? (
              <EmptyState
                icon={ListChecks}
                title="Sem planos ainda"
                description="Crie um plano com exercícios, séries e cargas alvo."
                action={
                  <Link href="/treinos/planos/novo">
                    <Button variant="secondary">Criar plano</Button>
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-2">
                {(plans ?? []).slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/treinos/planos/${p.id}`}
                      className="flex items-center gap-2 rounded-2xl border border-line/60 bg-surface px-3 py-2 text-sm hover:border-ember/40 hover:shadow-card"
                    >
                      <Dumbbell size={14} aria-hidden="true" className="text-ink-soft" />
                      <span className="flex-1 truncate">{p.name}</span>
                      {p.is_active && (
                        <span className="rounded-pill bg-moss-soft px-2 py-0.5 text-[10px] font-semibold text-moss-dark">
                          ativo
                        </span>
                      )}
                      <ChevronRight size={14} aria-hidden="true" className="text-ink-faint" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex gap-2">
              <Link href="/treinos/planos" className="flex-1">
                <Button variant="ghost" fullWidth trailingIcon={<ChevronRight size={14} />}>
                  Ver todos
                </Button>
              </Link>
              <Link href="/treinos/planos/novo">
                <Button variant="secondary" leadingIcon={<Plus size={14} />}>
                  Novo
                </Button>
              </Link>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Atalhos"
              description="Agenda semanal e histórico."
            />
            <div className="space-y-2">
              <ShortcutLink
                href="/treinos/agenda"
                icon={CalendarDays}
                title="Agenda semanal"
                description="Marque planos para cada dia da semana."
              />
              <ShortcutLink
                href="/treinos/historico"
                icon={History}
                title="Histórico"
                description="Progressão de cargas e volume por exercício."
              />
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ShortcutLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Dumbbell;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-line/60 bg-surface p-3 text-sm",
        "hover:border-ember/40 hover:shadow-card",
      )}
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-base/60 text-ink-soft">
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{title}</p>
        <p className="text-[11px] text-ink-soft">{description}</p>
      </div>
      <ChevronRight size={14} aria-hidden="true" className="text-ink-faint" />
    </Link>
  );
}
