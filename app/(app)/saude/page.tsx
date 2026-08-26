import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/SectionHeader";
import { WeightSection } from "./WeightSection";
import { PhysicalProfileForm } from "./PhysicalProfileForm";
import { CardioSection } from "./CardioSection";
import { DietSuggestion } from "./DietSuggestion";
import { GoalProgressCard } from "@/components/saude/GoalProgressCard";
import { Trend } from "@/components/Trend";
import {
  Dumbbell,
  HeartPulse,
  Info,
  AlertTriangle,
  Flame,
  Scale,
  Ruler,
  Activity,
  Calendar,
} from "lucide-react";
import { startOfWeekISO, formatHours } from "@/lib/format";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  bmiCategory,
  computeAge,
  computeBMI,
  computeTDEE,
  kgToLose,
  parseHeightCm,
  type BMICategoryMeta,
} from "@/lib/health";
import { computeWeeklyBurnGoalKcal } from "@/lib/goals";
import { generateDietPlan, type DietPlan } from "@/lib/diet-template";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const TONE_CLASS: Record<BMICategoryMeta["tone"], string> = {
  info: "bg-line/60 text-ink-soft",
  ok: "bg-moss-soft text-moss-dark",
  warn: "bg-amber-50 text-amber-700 border border-amber-200",
  danger: "bg-ember-soft text-ember-dark border border-ember/30",
};

const SEX_LABEL: Record<string, string> = {
  feminino: "Feminino",
  masculino: "Masculino",
  nao_informado: "Não informado",
};

const ACTIVITY_LABEL: Record<string, string> = {
  sedentario: "Sedentário",
  leve: "Leve",
  moderado: "Moderado",
  ativo: "Ativo",
  muito_ativo: "Atleta",
};

const GOAL_LABEL: Record<string, string> = {
  perder: "Perder peso",
  manter: "Manter",
  ganhar: "Ganhar massa",
  recompor: "Recompor",
};

export default async function SaudePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: weightHistory },
    { data: cardioThisWeek },
    { data: workoutsThisWeek },
  ] = await Promise.all([
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
    supabase
      .from("workout_sessions")
      .select("id, duration_h")
      .eq("user_id", user.id)
      .not("finished_at", "is", null)
      .gte("started_at", startOfWeekISO()),
  ]);

  // --- DERIVADOS ---

  // Sanitização da altura (defesa contra o bug "altura em metros").
  const heightCm = parseHeightCm(profile?.height_cm);

  const currentWeight = weightHistory?.[0]?.weight_kg ?? null;
  const previousWeight = weightHistory?.[1]?.weight_kg ?? null;
  const weightDelta =
    currentWeight != null && previousWeight != null
      ? currentWeight - previousWeight
      : null;

  const bmi =
    currentWeight != null && heightCm != null
      ? computeBMI(currentWeight, heightCm)
      : null;
  const bmiCat = bmi != null ? bmiCategory(bmi) : null;

  const age = computeAge(profile?.birth_date);
  const tdee =
    bmi != null && age && heightCm && profile?.biological_sex
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
    bmi != null && tdee && !profileIncomplete
      ? generateDietPlan(tdee, profile?.biological_sex ?? null)
      : null;

  const cardioMinutes = (cardioThisWeek ?? []).reduce((s, c) => s + c.duration_min, 0);
  const cardioKcalWeek = (cardioThisWeek ?? []).reduce(
    (s, c) => s + (c.kcal_burned ?? 0),
    0,
  );

  const workoutHoursWeek = (workoutsThisWeek ?? []).reduce(
    (s, w) => s + (w.duration_h ?? 0),
    0,
  );
  const workoutHoursGoal = profile?.workout_weekly_goal_hours ?? 4;

  const goalType =
    (profile?.goal_type as "perder" | "manter" | "ganhar" | "recompor" | null) ??
    "manter";
  const weeklyRate = profile?.weekly_rate_kg ?? 0.5;
  const weeklyBurnGoal =
    goalType === "perder"
      ? computeWeeklyBurnGoalKcal({
          currentWeightKg: currentWeight,
          goalWeightKg: profile?.weight_goal_kg ?? null,
          goalType,
          weeklyRateKgPerWeek: weeklyRate,
        })
      : 0;

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
          {showAlert && bmi != null && (
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

          {/* ────────────────────────────────────────────
              SEU CORPO HOJE
              ──────────────────────────────────────────── */}
          <Card>
            <CardHeader
              title="Seu corpo hoje"
              description="Dados corporais atuais que alimentam IMC, TDEE e sugestões."
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
              <Stat
                icon={Scale}
                label="Peso atual"
                value={currentWeight != null ? `${currentWeight.toFixed(1)} kg` : "—"}
              >
                {weightDelta != null && (
                  <Trend
                    value={weightDelta}
                    label="vs. última medida"
                    mode="down-good"
                  />
                )}
              </Stat>
              <Stat
                icon={Ruler}
                label="Altura"
                value={heightCm != null ? `${heightCm} cm` : "—"}
              />
              <Stat
                icon={HeartPulse}
                label="IMC"
                value={bmi != null ? bmi.toFixed(1) : "—"}
              >
                {bmiCat && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[11px] font-semibold",
                      TONE_CLASS[bmiCat.tone],
                    )}
                  >
                    {bmiCat.label}
                  </span>
                )}
              </Stat>
              <Stat
                icon={Calendar}
                label="Idade"
                value={age != null ? `${age} anos` : "—"}
              />
              <Stat
                icon={Activity}
                label="Sexo biológico"
                value={
                  profile?.biological_sex
                    ? SEX_LABEL[profile.biological_sex] ?? "—"
                    : "—"
                }
              />
              <Stat
                icon={Flame}
                label="Atividade"
                value={
                  profile?.activity_level
                    ? ACTIVITY_LABEL[profile.activity_level] ?? "—"
                    : "—"
                }
              />
            </div>

            {heightCm === null && (
              <p className="mt-4 text-[12px] text-ink-soft">
                Defina sua altura em &ldquo;Seus objetivos&rdquo; para ver o IMC.
              </p>
            )}

            <div className="mt-5 border-t border-line/60 pt-5">
              <h3 className="mb-2 font-display text-sm font-semibold text-ink">
                Evolução do peso
              </h3>
              <WeightSection history={weightHistory ?? []} />
            </div>
          </Card>

          {/* ────────────────────────────────────────────
              SEUS OBJETIVOS
              ──────────────────────────────────────────── */}
          <Card>
            <CardHeader
              title="Seus objetivos"
              description="Onde você quer chegar — define meta de peso, ritmo semanal e queima."
            />

            <div className="mb-4 rounded-2xl bg-base/40 p-4">
              <div className="mb-2 flex items-center justify-between text-[12px] text-ink-soft">
                <span>Objetivo atual</span>
                <span className="font-mono font-semibold text-ink">
                  {GOAL_LABEL[goalType] ?? "Manter"}
                </span>
              </div>
              {goalType === "perder" ? (
                <GoalProgressCard
                  weightStart={profile?.weight_goal_start_kg ?? null}
                  currentWeight={currentWeight}
                  weightGoal={profile?.weight_goal_kg ?? null}
                />
              ) : goalType === "ganhar" ? (
                <p className="text-[13px] text-ink-soft">
                  Para ganhar massa, defina uma meta acima do seu peso atual.
                  Ajuste também treino e alimentação na aba correspondente.
                </p>
              ) : goalType === "recompor" ? (
                <p className="text-[13px] text-ink-soft">
                  Recomposição corporal: foco em manter o peso e ajustar
                  treino e alimentação para remodelar composição.
                </p>
              ) : (
                <p className="text-[13px] text-ink-soft">
                  Manter o peso atual. Defina uma meta acima ou abaixo se quiser
                  mudar de objetivo.
                </p>
              )}
            </div>

            <PhysicalProfileForm
              heightCm={heightCm}
              weightGoalKg={profile?.weight_goal_kg ?? null}
              weightStartKg={profile?.weight_goal_start_kg ?? null}
              weeklyRateKg={profile?.weekly_rate_kg ?? null}
              goalType={goalType}
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

          {/* Meta semanal só aparece quando goal_type === 'perder' */}
          {goalType === "perder" && weeklyBurnGoal > 0 && (
            <Card>
              <CardHeader
                title="Meta semanal de queima"
                description={`Regra 7700 kcal/kg × taxa de ${weeklyRate.toFixed(1)} kg/sem = ${weeklyBurnGoal.toLocaleString("pt-BR")} kcal/sem.`}
              />
              <WeeklyBurnCard
                goalKcal={weeklyBurnGoal}
                burnedKcal={cardioKcalWeek}
              />
            </Card>
          )}

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

          <Card>
            <CardHeader
              title="Treinos (semana)"
              description="Horas de musculação registradas na semana."
            />
            <WorkoutWeekCard
              hoursThisWeek={workoutHoursWeek}
              hoursGoal={workoutHoursGoal}
            />
          </Card>
        </div>

        <aside className="space-y-6">
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

function Stat({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: typeof Scale;
  label: string;
  value: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line/60 bg-surface p-4">
      <div className="mb-2 flex items-center gap-2 text-ink-soft">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-base/40">
          <Icon size={14} aria-hidden="true" />
        </span>
        <span className="text-[12px] font-medium">{label}</span>
      </div>
      <p className="font-mono text-lg font-bold leading-none text-ink">
        {value}
      </p>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

function WorkoutWeekCard({
  hoursThisWeek,
  hoursGoal,
}: {
  hoursThisWeek: number;
  hoursGoal: number;
}) {
  const completed = hoursThisWeek >= hoursGoal;
  const safeMax = Math.max(hoursGoal, 0.5);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-ink-soft">Horas na semana</span>
        <span className="font-mono text-ink">
          {formatHours(hoursThisWeek)} / {formatHours(hoursGoal)}
        </span>
      </div>
      <ProgressBar
        value={hoursThisWeek}
        max={safeMax}
        colorClass={completed ? "bg-moss-gradient" : "bg-gold-gradient"}
      />
      {completed ? (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-moss-soft px-2.5 py-1 text-[12px] font-semibold text-moss-dark">
          Meta semanal atingida
        </p>
      ) : (
        <p className="mt-2 text-[12px] text-ink-soft">
          Faltam {formatHours(Math.max(0, hoursGoal - hoursThisWeek))} para fechar a meta.
        </p>
      )}
      <p className="mt-3 text-[11px] text-ink-faint">
        O registro detalhado de séries e cargas chega na próxima etapa.
      </p>
    </div>
  );
}

function WeeklyBurnCard({
  goalKcal,
  burnedKcal,
}: {
  goalKcal: number;
  burnedKcal: number;
}) {
  const pct = Math.min(100, Math.round((burnedKcal / goalKcal) * 100));
  const completed = burnedKcal >= goalKcal;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-ink-soft">Queimado na semana</span>
        <span className="font-mono text-ink">
          {burnedKcal} / {goalKcal.toLocaleString("pt-BR")} kcal
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