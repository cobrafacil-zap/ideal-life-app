import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/SectionHeader";
import { GoalsForm } from "./GoalsForm";
import { signOut, updateProfileName } from "./actions";
import { CircleUserRound, LogOut, Compass, Save } from "lucide-react";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.full_name ?? user.user_metadata?.full_name ?? "";

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        title="Perfil"
        subtitle="Metas, conta e preferências."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ember-gradient text-white shadow-floating">
                <CircleUserRound size={28} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold text-ink truncate">
                  {displayName || "Sem nome ainda"}
                </h2>
                <p className="text-sm text-ink-soft truncate">{user?.email}</p>
              </div>
            </div>

            <form
              action={async (formData) => {
                "use server";
                await updateProfileName(String(formData.get("full_name") ?? ""));
              }}
              className="mt-5 space-y-3"
            >
              <TextField
                label="Nome"
                name="full_name"
                defaultValue={displayName}
                placeholder="Como podemos te chamar?"
                maxLength={80}
                autoComplete="name"
              />
              <Button
                type="submit"
                leadingIcon={<Save size={14} />}
                variant="secondary"
              >
                Salvar nome
              </Button>
            </form>
          </Card>

          <Card>
            <CardHeader
              title="Suas metas"
              description="Defina metas diárias e semanais. O Resumo do dia usa esses números."
            />
            <GoalsForm
              waterGoalMl={profile?.water_goal_ml ?? 3000}
              cardioGoalMin={profile?.cardio_weekly_goal_min ?? 150}
              workoutGoal={profile?.workout_weekly_goal ?? 4}
              calorieGoal={profile?.calorie_goal ?? null}
            />
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="border-dashed">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ember-soft text-ember">
                <Compass size={16} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Minha vida (em breve)</p>
                <p className="mt-1 text-[12px] text-ink-soft">
                  Espaço reservado para os próximos módulos: finanças,
                  relacionamento, casa, trabalho, estudos, espiritualidade e
                  metas pessoais.
                </p>
                <ul className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-ink-soft">
                  {["Finanças", "Relacionamento", "Casa", "Trabalho", "Estudos", "Espiritualidade"].map(
                    (m) => (
                      <li
                        key={m}
                        className="rounded-pill border border-line/70 bg-base/50 px-2.5 py-1"
                      >
                        {m}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </Card>

          <form action={signOut}>
            <Button
              type="submit"
              variant="outline"
              fullWidth
              leadingIcon={<LogOut size={16} />}
            >
              Sair da conta
            </Button>
          </form>
        </aside>
      </div>
    </div>
  );
}
