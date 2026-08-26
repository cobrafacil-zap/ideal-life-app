import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/SectionHeader";
import { SummaryTile } from "@/components/home/SummaryTile";
import { Trend } from "@/components/Trend";
import { WellBeingRing } from "@/components/home/WellBeingRing";
import { wellBeingAverage } from "@/lib/well-being";
import { CheckinCard } from "./CheckinCard";
import { WaterCard } from "./WaterCard";
import {
  Dumbbell,
  Flame,
  Activity,
  Droplets as DropletIcon,
  Scale,
  Target,
  Sparkles,
  Smile,
} from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { startOfWeekISO } from "@/lib/format";
import { nowInBR, todayBR } from "@/lib/datetime";
import { phraseForDate } from "@/lib/motivational-phrases";
import { getAvatarSignedUrl } from "@/lib/avatar";

export const dynamic = "force-dynamic";

export default async function HojePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const today = todayBR();
  const firstName = user.user_metadata?.full_name?.split(" ")[0] ?? "";

  const [
    { data: profile },
    { data: checkin },
    { data: waterLogs },
    { data: recentWeights },
    { data: cardioThisWeek },
    { data: mealsToday },
    { data: openSession },
    { data: latestCycle },
    { data: lastCheckin },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", user.id)
      .eq("checkin_date", today)
      .maybeSingle(),
    supabase.from("water_logs").select("amount_ml").eq("user_id", user.id).eq("log_date", today),
    // Pega até 2 medições para calcular trend.
    supabase
      .from("body_measurements")
      .select("weight_kg, measured_at")
      .eq("user_id", user.id)
      .order("measured_at", { ascending: false })
      .limit(2),
    supabase
      .from("cardio_sessions")
      .select("duration_min, duration_h, kcal_burned")
      .eq("user_id", user.id)
      .gte("performed_at", startOfWeekISO()),
    supabase
      .from("meals")
      .select("total_calories")
      .eq("user_id", user.id)
      .eq("meal_date", today),
    supabase
      .from("workout_sessions")
      .select("workout_name, started_at")
      .eq("user_id", user.id)
      .is("finished_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("menstrual_cycles")
      .select("start_date")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // 9ª query: último check-in ANTERIOR a hoje (pode ser de dias atrás).
    supabase
      .from("daily_checkins")
      .select("energy, mood, disposition, checkin_date")
      .eq("user_id", user.id)
      .lt("checkin_date", today)
      .order("checkin_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // Avatar (signed URL).
  const avatarUrl = await getAvatarSignedUrl(supabase, profile?.avatar_url);

  const waterConsumed = (waterLogs ?? []).reduce((sum, w) => sum + w.amount_ml, 0);
  const waterGoal = profile?.water_goal_ml ?? 3000;

  const cardioMinutes = (cardioThisWeek ?? []).reduce((sum, c) => sum + c.duration_min, 0);
  const cardioGoal = profile?.cardio_weekly_goal_min ?? 150;
  const cardioKcalWeek = (cardioThisWeek ?? []).reduce(
    (sum, c) => sum + (c.kcal_burned ?? 0),
    0,
  );

  const caloriesToday = (mealsToday ?? []).reduce(
    (sum, m) => sum + (m.total_calories ?? 0),
    0
  );

  const cycleDay = latestCycle?.start_date
    ? differenceInCalendarDays(nowInBR(), new Date(latestCycle.start_date)) + 1
    : null;

  // Peso: atual + anterior (para trend).
  const currentWeight = recentWeights?.[0]?.weight_kg ?? null;
  const previousWeight = recentWeights?.[1]?.weight_kg ?? null;
  const weightDelta =
    currentWeight != null && previousWeight != null
      ? currentWeight - previousWeight
      : null;

  // Bem-estar: hoje + último check-in anterior.
  const todayOverall = wellBeingAverage(checkin); // 0–10
  const lastOverall = wellBeingAverage(lastCheckin); // 0–10 ou null
  const wellBeingDelta =
    todayOverall != null && lastOverall != null
      ? Math.round((todayOverall - lastOverall) * 10) // escala 0–10 → 0–100pp
      : null;
  const daysSinceLast = lastCheckin?.checkin_date
    ? differenceInCalendarDays(nowInBR(), new Date(lastCheckin.checkin_date))
    : null;

  const goalsCompleted = [
    !!checkin,
    waterConsumed >= waterGoal,
    caloriesToday > 0,
    cardioMinutes > 0,
    !!currentWeight,
  ].filter(Boolean).length;

  const greeting = (() => {
    const h = nowInBR().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();

  const todayLabel = format(nowInBR(), "EEEE, d 'de' MMMM", { locale: ptBR });
  const phrase = phraseForDate(today);

  // Texto curto da comparação ("ontem" / "3 dia(s) atrás").
  const compareLabel =
    daysSinceLast == null
      ? "sem check-in anterior"
      : daysSinceLast === 1
        ? "ontem"
        : daysSinceLast === 0
          ? "hoje"
          : `${daysSinceLast} dia(s) atrás`;

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        title={
          <span className="capitalize">
            {greeting}
            {firstName ? `, ${firstName}` : ""}
          </span>
        }
        subtitle={<span className="capitalize">{todayLabel}</span>}
        action={
          <Link
            href="/perfil"
            aria-label="Abrir perfil"
            className="block rounded-full ring-2 ring-line/40 hover:ring-ember transition-colors overflow-hidden focus-visible:outline-none focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-12 w-12 object-cover"
              />
            ) : (
              <div className="h-12 w-12 grid place-items-center bg-ember-soft text-ember-dark font-display font-semibold text-lg">
                {firstName.charAt(0).toUpperCase() || "U"}
              </div>
            )}
          </Link>
        }
      />

      <p className="-mt-3 px-1 text-[13px] italic text-ink-soft">
        ✨ {phrase}
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Bem-estar hoje"
              description="Energia, humor e disposição em um único indicador."
            />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <WellBeingRing value={todayOverall ?? 0} />
              <div className="flex-1 min-w-0">
                {todayOverall == null ? (
                  <p className="text-[13px] text-ink-soft">
                    Você ainda não registrou o check-in de hoje. Ajuste energia,
                    humor e disposição no card abaixo para acompanhar seu bem-estar.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {wellBeingDelta != null ? (
                      <Trend
                        value={wellBeingDelta}
                        label={`vs. ${compareLabel}`}
                        formatter={(n) =>
                          `${n > 0 ? "+" : ""}${Math.round(n)} pp`
                        }
                        mode="up-good"
                      />
                    ) : (
                      <p className="text-[12px] text-ink-soft">
                        Sem check-in anterior para comparar.
                      </p>
                    )}
                    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-soft">
                      <li>
                        <Smile size={12} className="inline -mt-0.5 mr-1 text-ember" />
                        Energia <strong className="font-mono text-ink">{checkin!.energy}</strong>
                      </li>
                      <li>
                        Humor <strong className="font-mono text-ink">{checkin!.mood}</strong>
                      </li>
                      <li>
                        Disposição <strong className="font-mono text-ink">{checkin!.disposition}</strong>
                      </li>
                    </ul>
                    <div className="pt-1">
                      <p className="text-[11px] uppercase tracking-wide text-ink-faint">
                        Progresso do dia
                      </p>
                      <div
                        className="mt-1 h-2 w-full rounded-pill bg-line/60 overflow-hidden"
                        role="progressbar"
                        aria-valuenow={goalsCompleted}
                        aria-valuemin={0}
                        aria-valuemax={5}
                        aria-label="Progresso do dia"
                      >
                        <div
                          className="h-full rounded-pill bg-moss-gradient transition-all duration-500 ease-out"
                          style={{ width: `${(goalsCompleted / 5) * 100}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[12px] text-ink-soft">
                        {goalsCompleted} de 5 metas cumpridas hoje
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Como você está hoje?"
              description="Registre energia, humor e disposição. Você pode ajustar a qualquer momento."
            />
            <CheckinCard
              initial={{
                energy: checkin?.energy ?? 5,
                mood: checkin?.mood ?? 5,
                disposition: checkin?.disposition ?? 5,
              }}
            />
          </Card>

          <Card>
            <CardHeader
              title="Água"
              description="Toque nos atalhos para registrar copos ou garrafas."
            />
            <WaterCard consumedMl={waterConsumed} goalMl={waterGoal} />
          </Card>
        </div>

        {/* Sidebar com resumo (vira coluna no desktop) */}
        <aside className="space-y-6">
          <Card>
            <CardHeader title="Resumo do dia" />
            <div className="grid grid-cols-2 gap-3">
              <Link href="/saude" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base rounded-2xl">
                <SummaryTile
                  icon={Dumbbell}
                  label="Treino"
                  value={openSession?.workout_name ?? "—"}
                  sub={openSession ? "em andamento" : "nenhum ativo"}
                />
              </Link>
              <Link href="/alimentacao" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base rounded-2xl">
                <SummaryTile
                  icon={Flame}
                  label="Alimentação"
                  value={`${caloriesToday.toLocaleString("pt-BR")} kcal`}
                  sub={`${(mealsToday ?? []).length} refeições hoje`}
                  accent="moss"
                />
              </Link>
              <Link href="/saude" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base rounded-2xl">
                <SummaryTile
                  icon={Activity}
                  label="Cardio (semana)"
                  value={`${cardioMinutes} / ${cardioGoal} min`}
                  progress={{ current: cardioMinutes, max: cardioGoal }}
                />
              </Link>
              <Link href="/saude" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base rounded-2xl">
                <SummaryTile
                  icon={Scale}
                  label="Peso atual"
                  value={currentWeight != null ? `${currentWeight} kg` : "—"}
                  sub={
                    profile?.weight_goal_kg
                      ? `meta: ${profile.weight_goal_kg} kg`
                      : "defina sua meta"
                  }
                  accent="moss"
                />
              </Link>
              {weightDelta != null && (
                <div className="col-span-2">
                  <Trend
                    value={weightDelta}
                    label="vs. última medida"
                    mode="down-good"
                  />
                </div>
              )}
              {cycleDay !== null && (
                <Link href="/ciclo" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base rounded-2xl">
                  <SummaryTile
                    icon={DropletIcon}
                    label="Ciclo"
                    value={`Dia ${cycleDay}`}
                    sub="acompanhe na aba Ciclo"
                  />
                </Link>
              )}
              <Link href="/hoje" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base rounded-2xl">
                <SummaryTile
                  icon={Target}
                  label="Água"
                  value={
                    waterConsumed >= waterGoal
                      ? "Atingida!"
                      : `${(waterConsumed / 1000).toFixed(1)}L`
                  }
                  sub={`meta ${(waterGoal / 1000).toFixed(1)}L`}
                  accent="moss"
                  progress={{ current: waterConsumed, max: waterGoal }}
                />
              </Link>
            </div>
            {goalsCompleted === 5 && (
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-pill bg-moss-soft px-3 py-1 text-[12px] font-semibold text-moss-dark">
                <Sparkles size={14} aria-hidden="true" />
                Dia completo — bem-estar em dia.
              </p>
            )}
          </Card>

          <Card className="hidden lg:block">
            <CardHeader
              title="Atalhos"
              description="Ações rápidas para os módulos mais usados."
            />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Link
                href="/saude"
                className="rounded-xl border border-line/60 bg-surface px-3 py-2.5 hover:border-ember/40 transition-colors"
              >
                Registrar peso
              </Link>
              <Link
                href="/alimentacao"
                className="rounded-xl border border-line/60 bg-surface px-3 py-2.5 hover:border-ember/40 transition-colors"
              >
                Nova refeição
              </Link>
              <Link
                href="/ciclo"
                className="rounded-xl border border-line/60 bg-surface px-3 py-2.5 hover:border-ember/40 transition-colors"
              >
                Sintomas de hoje
              </Link>
              <Link
                href="/perfil"
                className="rounded-xl border border-line/60 bg-surface px-3 py-2.5 hover:border-ember/40 transition-colors"
              >
                Ajustar metas
              </Link>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}