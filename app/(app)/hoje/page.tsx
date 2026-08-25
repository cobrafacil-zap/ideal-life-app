import { createClient } from "@/lib/supabase/server";
import { CheckinCard } from "./CheckinCard";
import { WaterCard } from "./WaterCard";
import { Card } from "@/components/ui/Card";
import { SummaryTile } from "@/components/home/SummaryTile";
import { Dumbbell, Flame, Activity, Droplets as DropletIcon, Scale, Target } from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

function startOfWeekISO() {
  const now = new Date();
  const day = now.getDay(); // 0 = domingo
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

export default async function HojePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().slice(0, 10);
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

  const caloriesToday = (mealsToday ?? []).reduce((sum, m) => sum + (m.total_calories ?? 0), 0);

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

  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <h1 className="font-display text-2xl font-bold">
          Bom dia{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-sm text-ink-soft capitalize">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </header>

      <Card>
        <h2 className="mb-4 text-center font-display text-base font-semibold">
          Como você está hoje?
        </h2>
        <CheckinCard
          initial={{
            energy: checkin?.energy ?? 5,
            mood: checkin?.mood ?? 5,
            disposition: checkin?.disposition ?? 5,
          }}
        />
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Seu progresso hoje</h2>
          <span className="font-mono text-sm text-moss-dark font-semibold">
            {goalsCompleted} de 5
          </span>
        </div>
        <Card>
          <div className="h-2 w-full rounded-pill bg-line/60 overflow-hidden">
            <div
              className="h-full rounded-pill bg-moss-gradient transition-all"
              style={{ width: `${(goalsCompleted / 5) * 100}%` }}
            />
          </div>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 font-display text-base font-semibold">Resumo do dia</h2>
        <div className="grid grid-cols-2 gap-3">
          <SummaryTile
            icon={Dumbbell}
            label="Treino"
            value={openSession?.workout_name ?? "Sem treino ativo"}
            sub={openSession ? "em andamento" : "planeje na aba Saúde"}
          />
          <SummaryTile
            icon={Flame}
            label="Alimentação"
            value={`${caloriesToday.toLocaleString("pt-BR")} kcal`}
            sub={`${(mealsToday ?? []).length} refeições hoje`}
            accent="moss"
          />
          <SummaryTile
            icon={Activity}
            label="Cardio (semana)"
            value={`${cardioMinutes} / ${cardioGoal} min`}
            progress={{ current: cardioMinutes, max: cardioGoal }}
          />
          <SummaryTile
            icon={Scale}
            label="Peso atual"
            value={lastWeight ? `${lastWeight.weight_kg} kg` : "—"}
            sub={profile?.weight_goal_kg ? `meta: ${profile.weight_goal_kg} kg` : "defina sua meta"}
            accent="moss"
          />
          {cycleDay !== null && (
            <SummaryTile
              icon={DropletIcon}
              label="Ciclo"
              value={`Dia ${cycleDay}`}
              sub="ver detalhes na aba Ciclo"
            />
          )}
          <SummaryTile
            icon={Target}
            label="Meta de água"
            value={waterConsumed >= waterGoal ? "Atingida!" : "Em progresso"}
            sub={`${(waterConsumed / 1000).toFixed(1)}L de ${(waterGoal / 1000).toFixed(1)}L`}
            accent="moss"
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-base font-semibold">Água</h2>
        <Card>
          <WaterCard consumedMl={waterConsumed} goalMl={waterGoal} />
        </Card>
      </div>
    </div>
  );
}
