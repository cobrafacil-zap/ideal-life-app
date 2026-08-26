import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/SectionHeader";
import { WeightSection } from "./WeightSection";
import { PhysicalProfileForm } from "./PhysicalProfileForm";
import { CardioSection } from "./CardioSection";
import { DietSuggestion } from "./DietSuggestion";
import { Dumbbell, HeartPulse, Info, AlertTriangle, Flame } from "lucide-react";
import { startOfWeekISO } from "@/lib/format";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  bmiCategory,
  computeAge,
  computeBMI,
  computeTDEE,
  kgToLose,
  type BMICategoryMeta,
} from "@/lib/health";
import { generateDietPlan, type DietPlan } from "@/lib/diet-template";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const TONE_CLASS: Record<BMICategoryMeta["tone"], string> = {
  info: "bg-line/60 text-ink-soft",
  ok: "bg-moss-soft text-moss-dark",
  warn: "bg-amber-50 text-amber-700 border border-amber-200",
  danger: "bg-ember-soft text-ember-dark border border-ember/30",
};

export default async function SaudePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: weightHistory }, { data: cardioThisWeek }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("body_measurements")
        .select("weight_kg, measured_at")
        .eq("user_id", user.id)
        .order("measured_at", { ascending: false })
        .limit(30),
      supabase
        .from("cardio_sessions")
        .select("duration_min, duration_h, kcal_burned")
        .eq("user_id", user.id)
        .gte("performed_at", startOfWeekISO()),
    ]);

  const currentWeight = weightHistory?.[0]?.weight_kg ?? null;
  const heightCm = profile?.height_cm ?? null;
  const bmi = currentWeight && heightCm ? computeBMI(currentWeight, heightCm) : null;
  const bmiCat = bmi ? bmiCategory(bmi) : null;

  const age = computeAge(profile?.birth_date);
  const tdee =
    bmi && age && heightCm && profile?.biological_sex
      ? computeTDEE(
          currentWeight!,
          heightCm,
          age,
          profile.biological_sex,
          profile.activity_level,
        )
      : null;

  const profileIncomplete =
    !profile?.birth_date ||
    !profile?.biological_sex ||
    profile.biological_sex === "nao_informado" ||
    !profile.activity_level;

  const dietPlan: DietPlan | null =
    bmi && tdee && !profileIncomplete
      ? generateDietPlan(tdee, profile?.biological_sex ?? null)
      : null;

  const cardioMinutes = (cardioThisWeek ?? []).reduce((s, c) => s + c.duration_min, 0);
  const cardioKcalWeek = (cardioThisWeek ?? []).reduce(
    (s, c) => s + (c.kcal_burned ?? 0),
    0,
  );

  const kg = currentWeight ? kgToLose(currentWeight, profile?.weight_goal_kg) : 0;
  const showAlert = bmiCat && bmiCat.key !== "magreza" && bmiCat.key !== "saudavel";

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        title="Saúde Física"
        subtitle="Peso, IMC, cardio e treinos em um só lugar."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {showAlert && bmi && (
            <div className={cn("flex items-start gap-3 rounded-2xl p-4 sm:p-5", TONE_CLASS[bmiCat!.tone])}>
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/70 text-ember-dark">
                <AlertTriangle size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold">Atenção: {bmiCat!.label}</p>
                <p className="mt-1 text-[13px]">
                  IMC atual <strong>{bmi.toFixed(1)}</strong>.{" "}
                  {kg > 0
                    ? `Você precisa perder aproximadamente ${kg.toFixed(1)} kg para atingir sua meta.`
                    : "Defina uma meta de peso para calcular quanto falta."}
                </p>
                <DietSuggestion plan={dietPlan} profileIncomplete={profileIncomplete} />
              </div>
            </div>
          )}

          <Card>
            <CardHeader
              title="Perfil físico"
              description="Sua altura e meta de peso alimentam o cálculo de IMC e o Resumo do dia."
            />
            {bmi && bmiCat ? (
              <div className="mb-4 rounded-2xl bg-moss-soft p-4 sm:p-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm text-moss-dark">IMC atual</p>
                    <p className="font-mono text-3xl font-bold text-moss-dark leading-none">
                      {bmi.toFixed(1)}
                    </p>
                    <p className="mt-1 text-sm font-medium text-moss-dark">
                      {bmiCat.label}
                    </p>
                  </div>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/60 text-moss-dark">
                    <HeartPulse size={18} aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-moss-dark/80">
                  O IMC é uma referência geral e não substitui avaliação médica
                  ou de um profissional de educação física.
                </p>
              </div>
            ) : (
              <div className="mb-4 rounded-2xl border border-dashed border-line bg-surface/60 p-4 text-[13px] text-ink-soft">
                Informe sua altura e registre seu peso para ver o IMC.
              </div>
            )}
            <PhysicalProfileForm
              heightCm={heightCm}
              weightGoalKg={profile?.weight_goal_kg ?? null}
              birthDate={profile?.birth_date ?? null}
              biologicalSex={
                (profile?.biological_sex as
                  | "feminino"
                  | "masculino"
                  | "nao_informado"
                  | null
                  | undefined) ?? null
              }
              activityLevel={
                (profile?.activity_level as
                  | "sedentario"
                  | "leve"
                  | "moderado"
                  | "ativo"
                  | "muito_ativo"
                  | null
                  | undefined) ?? null
              }
            />
          </Card>

          <Card>
            <CardHeader
              title="Meta semanal de queima"
              description="Calculada a partir do seu peso atual × meta de peso (regra 7700 kcal/kg, ~0,5 kg/semana)."
            />
            <WeeklyBurnCard
              goalKcal={profile?.weekly_burn_goal_kcal ?? null}
              burnedKcal={cardioKcalWeek}
            />
          </Card>

          <Card>
            <CardHeader
              title="Cardio"
              description="Registre sessões para acompanhar a meta semanal."
            />
            <CardioSection
              minutesThisWeek={cardioMinutes}
              goalMinutes={profile?.cardio_weekly_goal_min ?? 150}
              kcalThisWeek={cardioKcalWeek}
            />
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader title="Evolução do peso" />
            <WeightSection history={weightHistory ?? []} />
          </Card>

          <Card className="border-dashed">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ember-soft text-ember">
                <Dumbbell size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">
                  Montagem de treinos e séries
                </p>
                <p className="mt-1 text-[12px] text-ink-soft">
                  Em construção — chega na próxima etapa (criar treinos, registrar
                  séries e acompanhar progressão de carga).
                </p>
              </div>
            </div>
          </Card>

          <Card padded={false} className="bg-ember-soft/40 border-ember/20">
            <div className="flex items-start gap-3 p-4 sm:p-5">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ember text-white">
                <Info size={16} aria-hidden="true" />
              </span>
              <p className="text-[12px] leading-relaxed text-ink-soft">
                Os dados são privados. Apenas você tem acesso, protegido por
                Row Level Security no Supabase.
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function WeeklyBurnCard({
  goalKcal,
  burnedKcal,
}: {
  goalKcal: number | null;
  burnedKcal: number;
}) {
  if (!goalKcal || goalKcal <= 0) {
    return (
      <div className="rounded-2xl bg-moss-soft p-4 text-[13px] text-moss-dark">
        Sem meta de queima: você já está no peso-meta ou ela ainda não foi
        definida. Registre peso e meta no Perfil físico para gerar a meta.
      </div>
    );
  }

  const pct = Math.min(100, Math.round((burnedKcal / goalKcal) * 100));
  const completed = burnedKcal >= goalKcal;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-ink-soft">Queimado na semana</span>
        <span className="font-mono text-ink">
          {burnedKcal} / {goalKcal} kcal
          <span className="ml-1 text-ink-soft">({pct}%)</span>
        </span>
      </div>
      <ProgressBar
        value={burnedKcal}
        max={goalKcal}
        colorClass={completed ? "bg-moss-gradient" : "bg-ember-gradient"}
      />
      {completed ? (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-moss-soft px-2.5 py-1 text-[12px] font-semibold text-moss-dark">
          Meta atingida — mantendo ritmo nesta semana.
        </p>
      ) : (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-ember-soft px-2.5 py-1 text-[12px] font-semibold text-ember-dark">
          <Flame size={12} aria-hidden="true" />
          Faltam {goalKcal - burnedKcal} kcal para bater a meta semanal.
        </p>
      )}
    </div>
  );
}
