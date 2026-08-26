import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/SectionHeader";
import { NewCycleForm, DailySymptomsForm } from "./CycleForms";
import { differenceInCalendarDays } from "date-fns";
import { Droplets, Heart, Sparkles } from "lucide-react";
import { nowInBR, todayBR } from "@/lib/datetime";
import { getPhase, getAvgCycleLength, PHASE_META, type CyclePhase } from "@/lib/cycle";

export const dynamic = "force-dynamic";

export default async function CicloPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const today = todayBR();

  const [{ data: cycles }, { data: todayLog }] = await Promise.all([
    supabase
      .from("menstrual_cycles")
      .select("start_date, end_date")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false })
      .limit(12),
    supabase
      .from("menstrual_daily_logs")
      .select("pain_level, symptoms")
      .eq("user_id", user.id)
      .eq("log_date", today)
      .maybeSingle(),
  ]);

  const latest = cycles?.[0];
  const cycleDay = latest
    ? differenceInCalendarDays(nowInBR(), new Date(latest.start_date)) + 1
    : null;

  const avgCycleLength = getAvgCycleLength(cycles ?? []);

  const nextPredicted =
    latest
      ? differenceInCalendarDays(
          new Date(
            new Date(latest.start_date).getTime() + avgCycleLength * 86400000
          ),
          nowInBR()
        )
      : null;

  const phaseKey = getPhase(cycleDay, avgCycleLength) as CyclePhase | null;
  const phase = phaseKey ? PHASE_META[phaseKey] : null;

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        title="Ciclo Menstrual"
        subtitle="Acompanhamento discreto e privado."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-moss-gradient text-white border-moss-dark/0 shadow-floating">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-white/80">Você está no</p>
                <p className="font-mono text-4xl font-bold leading-none mt-1">
                  {cycleDay ? `Dia ${cycleDay}` : "—"}
                </p>
                {nextPredicted !== null && cycleDay && (
                  <p className="mt-2 text-sm text-white/85">
                    Próxima menstruação estimada em{" "}
                    <span className="font-mono font-semibold">
                      {Math.max(nextPredicted, 0)}
                    </span>{" "}
                    {Math.max(nextPredicted, 0) === 1 ? "dia" : "dias"}.
                  </p>
                )}
                {!cycleDay && (
                  <p className="mt-2 text-sm text-white/90">
                    Registre o início do seu ciclo mais recente para começar o
                    acompanhamento.
                  </p>
                )}
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-white">
                <Droplets size={18} aria-hidden="true" />
              </span>
            </div>
            {phase && (
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-pill bg-white/15 px-2.5 py-1 text-[12px] font-semibold">
                <Sparkles size={12} aria-hidden="true" />
                {phase.label}
              </span>
            )}
            {phase && phase.description && (
              <p className="mt-2 text-[12px] text-white/75">{phase.description}</p>
            )}
            {phaseKey && (
              <ul className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-white/85">
                {(["menstrual", "fertil", "ovulacao", "tpm", "folicular", "lutea"] as CyclePhase[])
                  .filter((p) => p === phaseKey)
                  .map((p) => (
                    <li
                      key={p}
                      className="rounded-pill bg-white/10 px-2.5 py-1"
                    >
                      {PHASE_META[p].label}
                    </li>
                  ))}
              </ul>
            )}
          </Card>

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
        </div>

        <aside className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Visão geral" />
            <ul className="grid grid-cols-2 gap-3">
              <li className="rounded-2xl bg-moss-soft/60 p-3 text-center">
                <p className="font-mono text-2xl font-semibold text-moss-dark">
                  {avgCycleLength}
                </p>
                <p className="text-[12px] text-ink-soft">dias em média</p>
              </li>
              <li className="rounded-2xl bg-ember-soft/60 p-3 text-center">
                <p className="font-mono text-2xl font-semibold text-ember-dark">
                  {cycles?.length ?? 0}
                </p>
                <p className="text-[12px] text-ink-soft">ciclos registrados</p>
              </li>
            </ul>
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
