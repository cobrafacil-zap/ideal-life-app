import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { wellBeingAverage } from "@/lib/well-being";
import { pickDailyInsight } from "@/lib/insights";
import { findLastRecordRow } from "@/lib/last-record";
import { computeAge, computeTDEE, activityFactor } from "@/lib/health";
import { WaterCard } from "./WaterCard";
import { WellBeingCard } from "./WellBeingCard";
import { DaySummaryPanel } from "./DaySummaryPanel";
import { InsightCard } from "./InsightCard";
import { PendingChecklist, type PendingItem } from "./PendingChecklist";
import { YesterdayComparison } from "./YesterdayComparison";
import { WeekBlock } from "./WeekBlock";
import { WeightProgressCard } from "./WeightProgressCard";
import { EndDayModal } from "./EndDayModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { startOfWeekISO } from "@/lib/format";
import { nowInBR, todayBR, daysAgoBRISO } from "@/lib/datetime";
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
    { data: workoutsThisWeek },
    { data: weight7dAgo },
    { data: waterLast7 },
    { data: lastMealRow },
    { data: lastWaterRow },
    { data: lastCheckinRow },
    { data: todaySummary },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", user.id)
      .eq("checkin_date", today)
      .maybeSingle(),
    supabase.from("water_logs").select("amount_ml").eq("user_id", user.id).eq("log_date", today),
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
    supabase
      .from("daily_checkins")
      .select("energy, mood, disposition, checkin_date")
      .eq("user_id", user.id)
      .lt("checkin_date", today)
      .order("checkin_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("workout_sessions")
      .select("id, duration_h")
      .eq("user_id", user.id)
      .not("finished_at", "is", null)
      .gte("started_at", startOfWeekISO()),
    // Peso de 7 dias atrás (para delta semanal).
    supabase
      .from("body_measurements")
      .select("weight_kg, measured_at")
      .eq("user_id", user.id)
      .lte("measured_at", `${daysAgoBRISO(7)}T23:59:59-03:00`)
      .order("measured_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Água: todos os logs dos últimos 7 dias (média).
    supabase
      .from("water_logs")
      .select("amount_ml, log_date")
      .eq("user_id", user.id)
      .gte("log_date", daysAgoBRISO(7)),
    // "Último registro" — última refeição antes de hoje.
    findLastRecordRow(supabase, {
      table: "meals",
      select: "total_calories, meal_date",
      column: "meal_date",
      userId: user.id,
      beforeDate: today,
    }),
    // "Último registro" — última água antes de hoje.
    findLastRecordRow(supabase, {
      table: "water_logs",
      select: "amount_ml, log_date",
      column: "log_date",
      userId: user.id,
      beforeDate: today,
    }),
    // "Último registro" — último check-in (já temos `lastCheckin` mas queremos a data exata).
    findLastRecordRow(supabase, {
      table: "daily_checkins",
      select: "energy, mood, disposition, checkin_date",
      column: "checkin_date",
      userId: user.id,
      beforeDate: today,
    }),
    // Resumo do dia de hoje (se já foi encerrado).
    supabase
      .from("daily_summaries")
      .select("*")
      .eq("user_id", user.id)
      .eq("summary_date", today)
      .maybeSingle(),
  ]);

  // Avatar (signed URL).
  const avatarUrl = await getAvatarSignedUrl(supabase, profile?.avatar_url);

  const waterConsumed = (waterLogs ?? []).reduce((sum, w) => sum + w.amount_ml, 0);
  const waterGoal = profile?.water_goal_ml ?? 3000;

  const cardioMinutes = (cardioThisWeek ?? []).reduce((sum, c) => sum + c.duration_min, 0);
  const cardioGoal = profile?.cardio_weekly_goal_min ?? 150;

  const workoutHoursWeek = (workoutsThisWeek ?? []).reduce(
    (s, w) => s + (w.duration_h ?? 0),
    0,
  );
  const workoutHoursGoal = profile?.workout_weekly_goal_hours ?? 4;
  const workoutsCountThisWeek = (workoutsThisWeek ?? []).length;

  const caloriesToday = (mealsToday ?? []).reduce(
    (sum, m) => sum + (m.total_calories ?? 0),
    0
  );

  // "Último registro" — data mais recente entre os 3 pilares (antes de hoje).
  const lastRecordDateCandidates = [
    lastMealRow?.date ?? null,
    lastWaterRow?.date ?? null,
    lastCheckinRow?.date ?? null,
  ].filter(Boolean) as string[];
  const lastRecordDate =
    lastRecordDateCandidates.length > 0
      ? lastRecordDateCandidates.sort().reverse()[0] ?? null
      : null;

  // Totais do último registro por pilar (pega o que tiver).
  const caloriesLast = lastMealRow?.row.total_calories ?? 0;
  const waterLastMl = (lastWaterRow?.row as { amount_ml: number } | undefined)?.amount_ml ?? 0;
  const wellbeingLastPct =
    lastCheckinRow && lastCheckinRow.row
      ? Math.round(
          ((lastCheckinRow.row.energy ?? 0) +
            (lastCheckinRow.row.mood ?? 0) +
            (lastCheckinRow.row.disposition ?? 0)) /
            30 *
            100,
        )
      : null;

  const cycleDay = latestCycle?.start_date
    ? Math.floor((nowInBR().getTime() - new Date(latestCycle.start_date).getTime()) / 86400000) + 1
    : null;

  const currentWeight = recentWeights?.[0]?.weight_kg ?? null;
  const previousWeight = recentWeights?.[1]?.weight_kg ?? null;
  const weightDelta =
    currentWeight != null && previousWeight != null
      ? currentWeight - previousWeight
      : null;

  // Delta de peso em 7 dias.
  const weight7dAgoValue = weight7dAgo?.weight_kg ?? null;
  const weightDelta7d =
    currentWeight != null && weight7dAgoValue != null
      ? currentWeight - weight7dAgoValue
      : null;

  // Média de água nos últimos 7 dias (por dia com dados).
  const waterByDay = new Map<string, number>();
  for (const w of waterLast7 ?? []) {
    if (!w.log_date) continue;
    waterByDay.set(w.log_date, (waterByDay.get(w.log_date) ?? 0) + w.amount_ml);
  }
  const waterAvg7dMl =
    waterByDay.size > 0
      ? Math.round([...waterByDay.values()].reduce((a, b) => a + b, 0) / waterByDay.size)
      : 0;

  const todayOverall = wellBeingAverage(checkin);
  const todayOverallPct = todayOverall != null ? Math.round(todayOverall * 10) : null;
  const lastOverall = wellBeingAverage(lastCheckin);

  // TDEE — só computa se todos os campos do Mifflin estão presentes.
  let tdeeKcal: number | null = null;
  if (
    currentWeight != null &&
    profile?.height_cm != null &&
    profile?.birth_date != null &&
    profile?.biological_sex &&
    profile.biological_sex !== "nao_informado" &&
    profile.activity_level
  ) {
    const age = computeAge(profile.birth_date);
    if (age != null && age > 0 && age < 120) {
      tdeeKcal = computeTDEE(
        currentWeight,
        profile.height_cm,
        age,
        profile.biological_sex,
        profile.activity_level,
      );
    } else if (currentWeight > 0) {
      // Fallback simples se birth_date for inválida.
      const factor = activityFactor(profile.activity_level);
      tdeeKcal = Math.round(currentWeight * 22 * factor);
    }
  } else if (currentWeight != null && profile?.activity_level) {
    // Sem birth/sex — cai na heurística kg × activity factor.
    const factor = activityFactor(profile.activity_level);
    tdeeKcal = Math.round(currentWeight * 22 * factor);
  }

  // % geral do dia — média de 4 pilares (kcal/água/treino/bem-estar).
  const kcalRatio =
    profile?.calorie_goal != null && profile.calorie_goal > 0
      ? Math.max(0, Math.min(1, caloriesToday / profile.calorie_goal))
      : 0;
  const waterRatio = waterGoal > 0 ? Math.max(0, Math.min(1, waterConsumed / waterGoal)) : 0;
  const workoutRatio =
    workoutHoursGoal > 0
      ? Math.max(0, Math.min(1, workoutHoursWeek / workoutHoursGoal))
      : 0;
  const wellbeingRatio =
    todayOverall != null ? Math.max(0, Math.min(1, todayOverall / 10)) : 0;
  const overallPct = Math.round(
    ((kcalRatio + waterRatio + workoutRatio + wellbeingRatio) / 4) * 100,
  );

  // "Dia completo" — todos os 4 pilares atingidos (não exigimos peso).
  const dayComplete =
    kcalRatio >= 1 &&
    waterRatio >= 1 &&
    workoutRatio >= 1 &&
    wellbeingRatio >= 1;

  // Insight do dia — função pura.
  const insight = pickDailyInsight({
    today: checkin,
    last: lastCheckin,
    waterConsumed,
    waterGoal,
    waterLastRecord: waterLastMl,
    caloriesToday,
    caloriesGoal: profile?.calorie_goal ?? null,
    cardioMinutes,
    cardioGoal,
    workoutHoursWeek,
    workoutHoursGoal,
    workoutsThisWeek: workoutsCountThisWeek,
    currentWeight,
    weightStart: profile?.weight_goal_start_kg ?? null,
    weightGoal: profile?.weight_goal_kg ?? null,
    dayComplete,
  });

  // Checklist — derivado do estado atual.
  const pendingItems: PendingItem[] = [];
  // Água
  if (waterConsumed < waterGoal) {
    const remaining = waterGoal - waterConsumed;
    const suggested = remaining >= 500 ? 500 : remaining >= 300 ? 300 : remaining >= 200 ? 200 : remaining;
    pendingItems.push({
      kind: "water",
      label: `Beber +${suggested}ml de água`,
      description: `Faltam ${(remaining / 1000).toFixed(1).replace(".", ",")}L pra meta.`,
      done: false,
      amountMl: suggested,
    });
  } else {
    pendingItems.push({
      kind: "water",
      label: "Hidratação do dia",
      description: "Você atingiu a meta de água.",
      done: true,
    });
  }
  // Calorias
  if (profile?.calorie_goal != null && caloriesToday < profile.calorie_goal) {
    const remaining = profile.calorie_goal - caloriesToday;
    pendingItems.push({
      kind: "calories",
      label: `Você ainda tem ${remaining.toLocaleString("pt-BR")} kcal disponíveis`,
      description: "Registre uma refeição quando comer.",
      done: false,
      href: "/alimentacao",
    });
  } else if (profile?.calorie_goal != null && caloriesToday > 0) {
    pendingItems.push({
      kind: "calories",
      label: "Meta calórica",
      description: `${caloriesToday.toLocaleString("pt-BR")} kcal atingidos hoje.`,
      done: true,
    });
  }
  // Treino
  if (workoutHoursWeek < workoutHoursGoal && !openSession) {
    const restante = (workoutHoursGoal - workoutHoursWeek).toFixed(1).replace(".", ",");
    pendingItems.push({
      kind: "workout",
      label: "Registrar treino de hoje",
      description: `Faltam ${restante}h esta semana.`,
      done: false,
      href: "/saude",
    });
  } else if (workoutsCountThisWeek > 0) {
    pendingItems.push({
      kind: "workout",
      label: "Treinos da semana",
      description: `${workoutsCountThisWeek} sessão(ões) concluída(s).`,
      done: true,
    });
  }
  // Check-in
  if (!checkin) {
    pendingItems.push({
      kind: "checkin",
      label: "Fazer check-in do dia",
      description: "Reserve 30 segundos para registrar como você está.",
      done: false,
      href: "/saude",
    });
  } else {
    pendingItems.push({
      kind: "checkin",
      label: "Check-in de hoje",
      description: "Como você está hoje.",
      done: true,
    });
  }

  // Greeting.
  const greeting = (() => {
    const h = nowInBR().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();

  const todayLabel = format(nowInBR(), "EEEE, d 'de' MMMM", { locale: ptBR });
  const fallbackPhrase = phraseForDate(today);

  // Resumo do último dia encerrado (se houver).
  const lastClosedPct =
    todaySummary?.completed_count != null
      ? (todaySummary.completed_count / 5) * 100
      : null;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* HEADER DE PERFIL — avatar inline ao nome */}
      <header className="flex items-center gap-4">
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
              className="h-14 w-14 object-cover"
            />
          ) : (
            <div className="h-14 w-14 grid place-items-center bg-ember-soft text-ember-dark font-display font-semibold text-xl">
              {firstName.charAt(0).toUpperCase() || "U"}
            </div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">
            {greeting}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-0.5 text-sm text-ink-soft capitalize">{todayLabel}</p>
        </div>
      </header>

      {/* INSIGHT DO DIA — interpretação dinâmica */}
      <InsightCard insight={insight} fallbackPhrase={fallbackPhrase} />

      {/* PAINEL "SEU DIA — X%" — protagonista compacto */}
      <DaySummaryPanel
        overallPct={overallPct}
        tdeeKcal={tdeeKcal}
        calorieGoal={profile?.calorie_goal ?? null}
        caloriesConsumed={caloriesToday}
        waterConsumed={waterConsumed}
        waterGoal={waterGoal}
        workoutHoursWeek={workoutHoursWeek}
        workoutHoursGoal={workoutHoursGoal}
        wellbeingPct={todayOverallPct}
        dayComplete={dayComplete}
      />

      {/* CHECKLIST "O QUE FALTA HOJE" */}
      <PendingChecklist items={pendingItems} />

      {/* 2-col: Água + Bem-estar (compactos, complementam o painel) */}
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader
            title="Hidratação"
            description="Toque nos atalhos para registrar."
          />
          <WaterCard consumedMl={waterConsumed} goalMl={waterGoal} />
        </Card>

        <WellBeingCard
          todayAvg={todayOverall}
          lastAvg={lastOverall}
          lastCheckinDate={lastCheckin?.checkin_date ?? null}
        />
      </div>

      {/* COMPARATIVO "HOJE × ÚLTIMO REGISTRO" */}
      <YesterdayComparison
        lastRecordDate={lastRecordDate}
        caloriesToday={caloriesToday}
        caloriesLast={caloriesLast}
        waterTodayMl={waterConsumed}
        waterLastMl={waterLastMl}
        wellbeingTodayPct={todayOverallPct}
        wellbeingLastPct={wellbeingLastPct}
      />

      {/* "SUA SEMANA" — bloco agregado */}
      <WeekBlock
        workoutsCount={workoutsCountThisWeek}
        workoutsHours={workoutHoursWeek}
        workoutsGoalHours={workoutHoursGoal}
        cardioMinutes={cardioMinutes}
        cardioGoalMin={cardioGoal}
        waterAvgMl={waterAvg7dMl}
        weightDelta7d={weightDelta7d}
      />

      {/* "PROGRESSO DO PESO" — meta → atual */}
      <WeightProgressCard
        current={currentWeight}
        start={profile?.weight_goal_start_kg ?? null}
        goal={profile?.weight_goal_kg ?? null}
      />

      {/* Linha auxiliar: sessão aberta + ciclo */}
      <div className="flex flex-wrap gap-2 text-[12px] text-ink-soft">
        {openSession && (
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-ember-soft px-3 py-1 text-ember-dark">
            <span className="font-semibold">{openSession.workout_name}</span>
            em andamento
          </span>
        )}
        {cycleDay != null && (
          <Link
            href="/ciclo"
            className="inline-flex items-center gap-1.5 rounded-pill bg-lilac-soft px-3 py-1 text-lilac-dark hover:bg-lilac-soft/80 transition-colors"
          >
            <span className="font-semibold">Ciclo · dia {cycleDay}</span>
          </Link>
        )}
        {!openSession && cycleDay == null && (
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-base/60 px-3 py-1 text-ink-soft">
            ✨ Tudo tranquilo por aqui
          </span>
        )}
      </div>

      {/* "ENCERRAR MEU DIA" — botão + modal */}
      <div className="pt-2">
        <EndDayModal
          today={{
            kcal: caloriesToday,
            waterMl: waterConsumed,
            cardioMin: cardioMinutes,
            workoutMin: Math.round(workoutHoursWeek * 60),
            wellbeingPct: todayOverallPct,
            completedCount: Math.round(overallPct / 20), // 0–5 baseado em pilares atingidos
          }}
          alreadyClosed={!!todaySummary}
          lastClosedPct={lastClosedPct}
        />
      </div>
    </div>
  );
}
