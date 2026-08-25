import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { GoalsForm } from "./GoalsForm";
import { signOut } from "./actions";
import { CircleUserRound, LogOut } from "lucide-react";

export default async function PerfilPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div className="space-y-6 animate-fade-up">
      <header className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ember-soft">
          <CircleUserRound size={28} className="text-ember-dark" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold">
            {profile?.full_name ?? user?.email}
          </h1>
          <p className="text-sm text-ink-soft">{user?.email}</p>
        </div>
      </header>

      <Card>
        <h2 className="mb-3 font-display text-base font-semibold">Suas metas</h2>
        <GoalsForm
          waterGoalMl={profile?.water_goal_ml ?? 3000}
          cardioGoalMin={profile?.cardio_weekly_goal_min ?? 150}
          workoutGoal={profile?.workout_weekly_goal ?? 4}
          calorieGoal={profile?.calorie_goal ?? null}
        />
      </Card>

      <Card className="opacity-70">
        <p className="text-sm font-semibold">Minha vida (em breve)</p>
        <p className="mt-1 text-[12px] text-ink-faint">
          Espaço reservado para os próximos módulos: finanças, relacionamento, casa,
          trabalho, estudos, espiritualidade e metas.
        </p>
      </Card>

      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-line py-3 text-sm font-medium text-ink-soft"
        >
          <LogOut size={16} />
          Sair da conta
        </button>
      </form>
    </div>
  );
}
