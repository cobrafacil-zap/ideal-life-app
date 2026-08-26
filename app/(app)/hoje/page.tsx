import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/SectionHeader";
import { SummaryTile } from "@/components/home/SummaryTile";
import { wellBeingAverage } from "@/lib/well-being";
import { WaterCard } from "./WaterCard";
import { CalorieHero } from "./CalorieHero";
import { WellBeingCard } from "./WellBeingCard";
import { YesterdayComparison } from "./YesterdayComparison";
import { WorkoutWeekHero } from "./WorkoutWeekHero";
import {
  Scale,
  Heart,
  Utensils,
  Droplets,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { startOfWeekISO } from "@/lib/format";
import { nowInBR, todayBR, daysAgoBRISO } from "@/lib/datetime";
import { phraseForDate } from "@/lib/motivational-phrases";
import { getAvatarSignedUrl } from "@/lib/avatar";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export default async function HojePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const today = todayBR();
  const yesterday = daysAgoBRISO(1);
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
    { data: mealsYesterday },
    { data: waterYesterday },
    { data: checkinYesterday },
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
    supabase
      .from("meals")
      .select("total_calories")
      .eq("user_id", user.id)
      .eq("meal_date", yesterday),
    supabase
      .from("water_logs")
      .select("amount_ml")
      .eq("user_id", user.id)
      .eq("log_date", yesterday),
    supabase
      .from("daily_checkins")
      .select("energy, mood, disposition, checkin_date")
      .eq("user_id", user.id)
      .eq("checkin_date", yesterday)
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

  const workoutHoursWeek = (workoutsThisWeek ?? []).reduce(
    (s, w) => s + (w.duration_h ?? 0),
    0,
  );
  const workoutHoursGoal = profile?.workout_weekly_goal_hours ?? 4;

  const caloriesToday = (mealsToday ?? []).reduce(
    (sum, m) => sum + (m.total_calories ?? 0),
    0
  );

  const caloriesYesterday = (mealsYesterday ?? []).reduce(
    (sum, m) => sum + (m.total_calories ?? 0),
    0,
  );
  const waterYesterdayMl = (waterYesterday ?? []).reduce(
    (sum, w) => sum + w.amount_ml,
    0,
  );
  const yesterdayOverall = wellBeingAverage(checkinYesterday);
  const yesterdayOverallPct =
    yesterdayOverall != null ? Math.round(yesterdayOverall * 10) : null;

  const cycleDay = latestCycle?.start_date
    ? Math.floor((nowInBR().getTime() - new Date(latestCycle.start_date).getTime()) / 86400000) + 1
    : null;

  const currentWeight = recentWeights?.[0]?.weight_kg ?? null;
  const previousWeight = recentWeights?.[1]?.weight_kg ?? null;
  const weightDelta =
    currentWeight != null && previousWeight != null
      ? currentWeight - previousWeight
      : null;

  const todayOverall = wellBeingAverage(checkin);
  const todayOverallPct =
    todayOverall != null ? Math.round(todayOverall * 10) : null;
  const lastOverall = wellBeingAverage(lastCheckin);

  // "Dia completo" — todos os pilares atingidos. Vira selo no hero.
  const dayComplete =
    !!checkin &&
    waterConsumed >= waterGoal &&
    caloriesToday > 0 &&
    cardioMinutes > 0 &&
    currentWeight != null;

  // Próximo passo sugerido (ordem de prioridade do que está pendente).
  const nextStep = (() => {
    if (!checkin) {
      return {
        href: "/saude",
        icon: Heart,
        label: "Fazer check-in",
        description: "Comece medindo como você está hoje.",
      };
    }
    if (waterConsumed < waterGoal) {
      return {
        href: "/hoje",
        icon: Droplets,
        label: "Beber água",
        description: `Faltam ${((waterGoal - waterConsumed) / 1000).toFixed(1).replace(".", ",")}L para sua meta.`,
      };
    }
    if ((mealsToday ?? []).length === 0) {
      return {
        href: "/alimentacao",
        icon: Utensils,
        label: "Registrar refeição",
        description: "Anote o que comeu hoje.",
      };
    }
    if (workoutHoursWeek < workoutHoursGoal && !openSession) {
      return {
        href: "/saude",
        icon: Plus,
        label: "Marcar treino",
        description: `Faltam ${(workoutHoursGoal - workoutHoursWeek).toFixed(1).replace(".", ",")}h esta semana.`,
      };
    }
    return null;
  })();

  const greeting = (() => {
    const h = nowInBR().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();

  const todayLabel = format(nowInBR(), "EEEE, d 'de' MMMM", { locale: ptBR });
  const phrase = phraseForDate(today);

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

      {/* HERO: protagonista visual único */}
      <CalorieHero
        consumed={caloriesToday}
        goal={profile?.calorie_goal ?? null}
        mealCount={(mealsToday ?? []).length}
        dayComplete={dayComplete}
      />

      {/* Dois pilares lado a lado: Água (cliente) + Bem-estar (reusa WellBeingRing) */}
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader
            title="Hidratação"
            description="Toque nos atalhos para registrar copos ou garrafas."
          />
          <WaterCard consumedMl={waterConsumed} goalMl={waterGoal} />
        </Card>

        <WellBeingCard
          todayAvg={todayOverall}
          lastAvg={lastOverall}
          lastCheckinDate={lastCheckin?.checkin_date ?? null}
        />
      </div>

      {/* Comparativo editorial — 1 card, 3 seções com divisor */}
      <YesterdayComparison
        caloriesToday={caloriesToday}
        caloriesYesterday={caloriesYesterday}
        waterTodayMl={waterConsumed}
        waterYesterdayMl={waterYesterdayMl}
        wellBeingTodayPct={todayOverallPct}
        wellBeingYesterdayPct={yesterdayOverallPct}
      />

      {/* Treinos da semana — gold (rotina em construção) */}
      <WorkoutWeekHero
        hoursThisWeek={workoutHoursWeek}
        hoursGoal={workoutHoursGoal}
      />

      {/* Footer: 3 colunas — peso atual, próximo passo, atalhos */}
      <div className="grid gap-5 md:grid-cols-3">
        <SummaryTile
          variant="feature"
          icon={Scale}
          label="Peso atual"
          value={currentWeight != null ? `${currentWeight} kg` : "—"}
          sub={
            profile?.weight_goal_kg
              ? `meta ${profile.weight_goal_kg} kg${
                  weightDelta != null
                    ? ` · ${
                        weightDelta > 0 ? "+" : ""
                      }${weightDelta.toFixed(1).replace(".", ",")} kg vs. última`
                    : ""
                }`
              : "definir meta em /saude"
          }
          accent="moss"
          href="/saude"
        />

        {nextStep ? (
          <Card>
            <CardHeader
              title="Próximo passo"
              description="Ação sugerida pra hoje."
            />
            <Link
              href={nextStep.href}
              className={cn(
                "flex items-start gap-3 rounded-2xl bg-base/50 p-3 transition-colors",
                "hover:bg-base/80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base",
              )}
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ember-soft text-ember">
                <nextStep.icon size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{nextStep.label}</p>
                <p className="mt-0.5 text-[12px] text-ink-soft">
                  {nextStep.description}
                </p>
              </div>
              <span aria-hidden="true" className="text-ink-soft self-center">→</span>
            </Link>
          </Card>
        ) : (
          <Card>
            <CardHeader title="Tudo em dia" description="Sem ações pendentes." />
            <p className="text-[13px] text-ink-soft">
              Você está em dia com seus pilares hoje. Continue assim. ✨
            </p>
          </Card>
        )}

        <Card>
          <CardHeader title="Atalhos" description="Ações rápidas." />
          <ul className="space-y-1">
            {[
              { href: "/saude", label: "Registrar peso" },
              { href: "/alimentacao", label: "Nova refeição" },
              { href: "/ciclo", label: "Sintomas de hoje" },
              { href: "/perfil", label: "Ajustar metas" },
            ].map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-2 text-sm",
                    "hover:bg-base/70 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base",
                  )}
                >
                  <span className="font-medium text-ink">{a.label}</span>
                  <span aria-hidden="true" className="text-ink-faint">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Linha auxiliar: treino/cardio/ciclo — info secundária que cabe em 3 chips curtos */}
      <div className="flex flex-wrap gap-2 text-[12px] text-ink-soft">
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-base/60 px-3 py-1">
          <span className="font-semibold text-ink">
            {cardioMinutes}/{cardioGoal} min
          </span>
          cardio semanal
          {cardioKcalWeek > 0 && (
            <span className="font-mono text-ink-faint">· {cardioKcalWeek} kcal</span>
          )}
        </span>
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
      </div>
    </div>
  );
}
