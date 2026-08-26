import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/SectionHeader";
import { SummaryTile } from "@/components/home/SummaryTile";
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
} from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { startOfWeekISO, todayISO } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HojePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = todayISO();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? "";

  const [
    { data: profile },
    { data: checkin },
    { data: waterLogs },
    { data: lastWeight },
    { data: cardioThisWeek },
    { data: mealsToday },
    { data: openSession },
    { data: latestCycle },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
    supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", user!.id)
      .eq("checkin_date", today)
      .maybeSingle(),
    supabase.from("water_logs").select("amount_ml").eq("user_id", user!.id).eq("log_date", today),
    supabase
      .from("body_measurements")
      .select("weight_kg, measured_at")
      .eq("user_id", user!.id)
      .order("measured_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("cardio_sessions")
      .select("duration_min")
      .eq("user_id", user!.id)
      .gte("performed_at", startOfWeekISO()),
    supabase
      .from("meals")
      .select("total_calories")
      .eq("user_id", user!.id)
      .eq("meal_date", today),
    supabase
      .from("workout_sessions")
      .select("workout_name, started_at")
      .eq("user_id", user!.id)
      .is("finished_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("menstrual_cycles")
      .select("start_date")
      .eq("user_id", user!.id)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const waterConsumed = (waterLogs ?? []).reduce((sum, w) => sum + w.amount_ml, 0);
  const waterGoal = profile?.water_goal_ml ?? 3000;

  const cardioMinutes = (cardioThisWeek ?? []).reduce((sum, c) => sum + c.duration_min, 0);
  const cardioGoal = profile?.cardio_weekly_goal_min ?? 150;

  const caloriesToday = (mealsToday ?? []).reduce(
    (sum, m) => sum + (m.total_calories ?? 0),
    0
  );

  const cycleDay = latestCycle?.start_date
    ? differenceInCalendarDays(new Date(), new Date(latestCycle.start_date)) + 1
    : null;

  const goalsCompleted = [
    !!checkin,
    waterConsumed >= waterGoal,
    caloriesToday > 0,
    cardioMinutes > 0,
    !!lastWeight,
  ].filter(Boolean).length;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();

  const todayLabel = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

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
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="space-y-6 lg:col-span-2">
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

        {/* Sidebar com resumo + metas (vira coluna no desktop) */}
        <aside className="space-y-6">
          <Card>
            <CardHeader
              title="Progresso de hoje"
              description={`${goalsCompleted} de 5 metas cumpridas`}
              action={
                <span className="font-mono text-sm font-semibold text-moss-dark">
                  {Math.round((goalsCompleted / 5) * 100)}%
                </span>
              }
            />
            <div
              className="h-2 w-full rounded-pill bg-line/60 overflow-hidden"
              role="progressbar"
              aria-valuenow={goalsCompleted}
              aria-valuemin={0}
              aria-valuemax={5}
              aria-label="Progresso de hoje"
            >
              <div
                className="h-full rounded-pill bg-moss-gradient transition-all duration-500 ease-out"
                style={{ width: `${(goalsCompleted / 5) * 100}%` }}
              />
            </div>
            {goalsCompleted === 5 && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-pill bg-moss-soft px-3 py-1 text-[12px] font-semibold text-moss-dark">
                <Sparkles size={14} aria-hidden="true" />
                Dia completo — bem-estar em dia.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader title="Resumo do dia" />
            <div className="grid grid-cols-2 gap-3">
              <SummaryTile
                icon={Dumbbell}
                label="Treino"
                value={openSession?.workout_name ?? "—"}
                sub={openSession ? "em andamento" : "nenhum ativo"}
                onClick={() => (window.location.href = "/saude")}
              />
              <SummaryTile
                icon={Flame}
                label="Alimentação"
                value={`${caloriesToday.toLocaleString("pt-BR")} kcal`}
                sub={`${(mealsToday ?? []).length} refeições hoje`}
                accent="moss"
                onClick={() => (window.location.href = "/alimentacao")}
              />
              <SummaryTile
                icon={Activity}
                label="Cardio (semana)"
                value={`${cardioMinutes} / ${cardioGoal} min`}
                progress={{ current: cardioMinutes, max: cardioGoal }}
                onClick={() => (window.location.href = "/saude")}
              />
              <SummaryTile
                icon={Scale}
                label="Peso atual"
                value={lastWeight ? `${lastWeight.weight_kg} kg` : "—"}
                sub={
                  profile?.weight_goal_kg
                    ? `meta: ${profile.weight_goal_kg} kg`
                    : "defina sua meta"
                }
                accent="moss"
                onClick={() => (window.location.href = "/saude")}
              />
              {cycleDay !== null && (
                <SummaryTile
                  icon={DropletIcon}
                  label="Ciclo"
                  value={`Dia ${cycleDay}`}
                  sub="acompanhe na aba Ciclo"
                  onClick={() => (window.location.href = "/ciclo")}
                />
              )}
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
                onClick={() => (window.location.href = "/hoje")}
              />
            </div>
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
