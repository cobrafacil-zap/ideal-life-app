import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { WeightSection } from "./WeightSection";
import { PhysicalProfileForm } from "./PhysicalProfileForm";
import { CardioSection } from "./CardioSection";
import { Dumbbell } from "lucide-react";

function startOfWeekISO() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

function bmiClassification(bmi: number) {
  if (bmi < 18.5) return "Abaixo do peso";
  if (bmi < 25) return "Peso adequado";
  if (bmi < 30) return "Sobrepeso";
  return "Obesidade";
}

export default async function SaudePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: weightHistory }, { data: cardioThisWeek }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
      supabase
        .from("body_measurements")
        .select("weight_kg, measured_at")
        .eq("user_id", user!.id)
        .order("measured_at", { ascending: false })
        .limit(30),
      supabase
        .from("cardio_sessions")
        .select("duration_min")
        .eq("user_id", user!.id)
        .gte("performed_at", startOfWeekISO()),
    ]);

  const currentWeight = weightHistory?.[0]?.weight_kg ?? null;
  const heightM = profile?.height_cm ? profile.height_cm / 100 : null;
  const bmi = currentWeight && heightM ? currentWeight / (heightM * heightM) : null;

  const cardioMinutes = (cardioThisWeek ?? []).reduce((s, c) => s + c.duration_min, 0);

  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <h1 className="font-display text-2xl font-bold">Saúde Física</h1>
        <p className="text-sm text-ink-soft">Peso, IMC, cardio e treinos.</p>
      </header>

      <Card>
        <h2 className="mb-3 font-display text-base font-semibold">Perfil físico</h2>
        {bmi && (
          <div className="mb-4 rounded-2xl bg-moss-soft p-4">
            <p className="text-sm text-moss-dark">IMC atual</p>
            <p className="font-mono text-3xl font-bold text-moss-dark">{bmi.toFixed(1)}</p>
            <p className="text-sm text-moss-dark">{bmiClassification(bmi)}</p>
            <p className="mt-2 text-[11px] text-moss-dark/80">
              O IMC é uma referência geral e não substitui avaliação médica ou de um
              profissional de educação física.
            </p>
          </div>
        )}
        <PhysicalProfileForm
          heightCm={profile?.height_cm ?? null}
          weightGoalKg={profile?.weight_goal_kg ?? null}
        />
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-base font-semibold">Evolução do peso</h2>
        <WeightSection history={weightHistory ?? []} />
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-base font-semibold">Cardio</h2>
        <CardioSection
          minutesThisWeek={cardioMinutes}
          goalMinutes={profile?.cardio_weekly_goal_min ?? 150}
        />
      </Card>

      <Card className="flex items-center gap-3 opacity-70">
        <Dumbbell size={20} className="text-ink-faint shrink-0" />
        <div>
          <p className="text-sm font-semibold">Montagem de treinos e séries</p>
          <p className="text-[12px] text-ink-faint">
            Em construção — chega na próxima etapa (criar treinos, registrar séries e
            acompanhar progressão de carga).
          </p>
        </div>
      </Card>
    </div>
  );
}
