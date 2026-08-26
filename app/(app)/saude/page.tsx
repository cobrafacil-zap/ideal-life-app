import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/SectionHeader";
import { WeightSection } from "./WeightSection";
import { PhysicalProfileForm } from "./PhysicalProfileForm";
import { CardioSection } from "./CardioSection";
import { Dumbbell, HeartPulse, Info } from "lucide-react";
import { startOfWeekISO } from "@/lib/format";

export const dynamic = "force-dynamic";

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
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        title="Saúde Física"
        subtitle="Peso, IMC, cardio e treinos em um só lugar."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Perfil físico"
              description="Sua altura e meta de peso alimentam o cálculo de IMC e o Resumo do dia."
            />
            {bmi ? (
              <div className="mb-4 rounded-2xl bg-moss-soft p-4 sm:p-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm text-moss-dark">IMC atual</p>
                    <p className="font-mono text-3xl font-bold text-moss-dark leading-none">
                      {bmi.toFixed(1)}
                    </p>
                    <p className="mt-1 text-sm font-medium text-moss-dark">
                      {bmiClassification(bmi)}
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
              heightCm={profile?.height_cm ?? null}
              weightGoalKg={profile?.weight_goal_kg ?? null}
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
