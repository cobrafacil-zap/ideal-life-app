import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { NewCycleForm, DailySymptomsForm } from "./CycleForms";
import { CycleHeatmap, type CycleHeatmapLog } from "@/components/ciclo/CycleHeatmap";
import { CommonSymptomsCard } from "@/components/ciclo/CommonSymptomsCard";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Droplets, Heart, Sparkles } from "lucide-react";
import { nowInBR, todayBR, daysAgoBRISO } from "@/lib/datetime";
import {
  computeCycleDay,
  getAvgCycleLength,
  getPhase,
  PHASE_BG,
  PHASE_META,
  PHASE_TEXT_LIGHT,
  TONE_PILL_CLASS,
  type CyclePhase,
} from "@/lib/cycle";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export default async function CicloPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const today = todayBR();
  const startISO = daysAgoBRISO(27);

  const [{ data: cycles }, { data: todayLog }, { data: recentLogs }] =
    await Promise.all([
      supabase
        .from("menstrual_cycles")
        .select("id, start_date, end_date, flow_intensity")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false })
        .limit(12),
      supabase
        .from("menstrual_daily_logs")
        .select("pain_level, symptoms, mood, notes")
        .eq("user_id", user.id)
        .eq("log_date", today)
        .maybeSingle(),
      supabase
        .from("menstrual_daily_logs")
        .select("log_date, pain_level, symptoms")
        .eq("user_id", user.id)
        .gte("log_date", startISO)
        .order("log_date", { ascending: true }),
    ]);

  const latest = cycles?.[0];
  const cycleDay = computeCycleDay(latest?.start_date ?? null) ?? null;

  const avgCycleLength = getAvgCycleLength(cycles ?? []);

  const nextPredicted = latest
    ? differenceInCalendarDays(
        new Date(
          new Date(latest.start_date).getTime() + avgCycleLength * 86400000,
        ),
        nowInBR(),
      )
    : null;

  const phaseKey = getPhase(cycleDay, avgCycleLength) as CyclePhase | null;
  const phase = phaseKey ? PHASE_META[phaseKey] : null;

  const heroBg = phaseKey ? PHASE_BG[phaseKey] : "bg-moss-gradient";
  const heroTextLight = phaseKey ? PHASE_TEXT_LIGHT[phaseKey] : true;

  const hasAnyData =
    (cycles?.length ?? 0) > 0 || (recentLogs?.length ?? 0) > 0 || !!todayLog;

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        title="Ciclo Menstrual"
        subtitle="Acompanhamento discreto e privado."
      />

      {!hasAnyData && (
        <EmptyState
          icon={CalendarDays}
          title="Comece marcando o primeiro dia do seu ciclo"
          description="Depois disso, você vê aqui a fase atual, previsões e um histórico visual de dor e sintomas."
        />
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <Card
            padded={false}
            className={cn(
              "overflow-hidden border-transparent shadow-floating",
              heroBg,
            )}
          >
            <div
              className={cn(
                "p-6 sm:p-7",
                heroTextLight ? "text-white" : "text-ink",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className={cn(
                      "text-sm",
                      heroTextLight ? "text-white/80" : "text-ink-soft",
                    )}
                  >
                    Você está no
                  </p>
                  <p className="font-mono text-4xl font-bold leading-none mt-1">
                    {cycleDay ? `Dia ${cycleDay}` : "—"}
                  </p>
                  {nextPredicted !== null && cycleDay && (
                    <p
                      className={cn(
                        "mt-2 text-sm",
                        heroTextLight ? "text-white/85" : "text-ink-soft",
                      )}
                    >
                      Próxima menstruação estimada em{" "}
                      <span className="font-mono font-semibold">
                        {Math.max(nextPredicted, 0)}
                      </span>{" "}
                      {Math.max(nextPredicted, 0) === 1 ? "dia" : "dias"}.
                    </p>
                  )}
                  {!cycleDay && (
                    <p
                      className={cn(
                        "mt-2 text-sm",
                        heroTextLight ? "text-white/90" : "text-ink",
                      )}
                    >
                      Registre o início do seu ciclo mais recente para começar o
                      acompanhamento.
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-2xl",
                    heroTextLight
                      ? "bg-white/15 text-white"
                      : "bg-ink/10 text-ink",
                  )}
                >
                  <Droplets size={18} aria-hidden="true" />
                </span>
              </div>

              {phase && (
                <span
                  className={cn(
                    "mt-4 inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[12px] font-semibold",
                    heroTextLight ? "bg-white/15" : "bg-ink/10",
                  )}
                >
                  <Sparkles size={12} aria-hidden="true" />
                  {phase.label}
                </span>
              )}
              {phase && phase.description && (
                <p
                  className={cn(
                    "mt-2 text-[12px]",
                    heroTextLight ? "text-white/75" : "text-ink-soft",
                  )}
                >
                  {phase.description}
                </p>
              )}
            </div>
          </Card>

          {latest && (
            <Card>
              <CardHeader
                title="Histórico dos últimos 28 dias"
                description="Cada célula é um dia. A cor indica a fase do ciclo; a intensidade, a dor registrada."
              />
              <CycleHeatmap
                logs={(recentLogs ?? []) as CycleHeatmapLog[]}
                currentCycleStart={latest.start_date}
                cycleLength={avgCycleLength}
              />
            </Card>
          )}

          <Card>
            <CardHeader
              title="Sintomas de hoje"
              description="Toque nos sintomas para registrar e ajuste o nível de dor."
            />
            <DailySymptomsForm
              initialPain={todayLog?.pain_level ?? undefined}
              initialSymptoms={todayLog?.symptoms ?? []}
            />
          </Card>

          {phaseKey && (
            <Card>
              <CardHeader
                title="O que é comum sentir nesta fase"
                description="Padrões gerais — não substituem avaliação médica."
              />
              <CommonSymptomsCard phase={phaseKey} />
            </Card>
          )}
        </div>

        <aside className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Visão geral" />
            <ul className="grid grid-cols-2 gap-3">
              <li className="rounded-2xl bg-moss-soft p-3 text-center">
                <p className="font-mono text-2xl font-semibold text-moss-dark">
                  {avgCycleLength}
                </p>
                <p className="text-[12px] text-ink-soft">dias em média</p>
              </li>
              <li className="rounded-2xl bg-ember-soft p-3 text-center">
                <p className="font-mono text-2xl font-semibold text-ember-dark">
                  {cycles?.length ?? 0}
                </p>
                <p className="text-[12px] text-ink-soft">ciclos registrados</p>
              </li>
            </ul>

            {(cycles?.length ?? 0) > 1 && (
              <div className="mt-4">
                <p className="mb-2 text-[11px] uppercase tracking-wide text-ink-faint">
                  Ciclos anteriores
                </p>
                <ul className="flex flex-wrap gap-2">
                  {cycles!.slice(0, 6).map((c, i) => {
                    const start = c.start_date
                      ? format(parseISO(c.start_date), "d MMM", { locale: ptBR })
                      : "—";
                    const flow = c.flow_intensity ?? "moderado";
                    return (
                      <li
                        key={c.id ?? i}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[11px] font-semibold",
                          TONE_PILL_CLASS.ember,
                        )}
                      >
                        <span className="font-mono">{start}</span>
                        <span className="opacity-70">·</span>
                        <span className="capitalize">{flow}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Novo ciclo"
              description="Marque o primeiro dia de menstruação para recalcular as previsões."
            />
            <NewCycleForm />
          </Card>

          <Card padded={false} className="bg-ember-soft/40 border-ember/20">
            <div className="flex items-start gap-3 p-4 sm:p-5">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ember text-white">
                <Heart size={16} aria-hidden="true" />
              </span>
              <p className="text-[12px] leading-relaxed text-ink-soft">
                As previsões de ovulação e período fértil são estimativas
                baseadas nos ciclos registrados e não devem ser usadas
                isoladamente como método contraceptivo ou diagnóstico médico.
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}