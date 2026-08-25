import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { MealLogForm } from "./MealLogForm";

const mealLabels: Record<string, string> = {
  cafe_da_manha: "Café da manhã",
  almoco: "Almoço",
  lanche: "Lanche",
  jantar: "Jantar",
  ceia: "Ceia",
  outra: "Outra",
};

export default async function AlimentacaoPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().slice(0, 10);

  const { data: meals } = await supabase
    .from("meals")
    .select("id, meal_type, notes, total_calories, logged_at")
    .eq("user_id", user!.id)
    .eq("meal_date", today)
    .order("logged_at", { ascending: false });

  const totalCalories = (meals ?? []).reduce((s, m) => s + (m.total_calories ?? 0), 0);

  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <h1 className="font-display text-2xl font-bold">Alimentação</h1>
        <p className="text-sm text-ink-soft">Registre suas refeições do dia.</p>
      </header>

      <Card className="flex items-center justify-between bg-ember-gradient text-white shadow-floating">
        <div>
          <p className="text-sm text-white/80">Hoje você consumiu</p>
          <p className="font-mono text-3xl font-bold">
            {totalCalories.toLocaleString("pt-BR")} kcal
          </p>
        </div>
        <span className="font-mono text-sm text-white/80">{(meals ?? []).length} refeições</span>
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-base font-semibold">Registrar refeição</h2>
        <MealLogForm />
      </Card>

      <div>
        <h2 className="mb-3 font-display text-base font-semibold">Hoje</h2>
        {(meals ?? []).length === 0 ? (
          <Card>
            <p className="text-center text-sm text-ink-faint">
              Nenhuma refeição registrada ainda hoje.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {meals!.map((m) => (
              <Card key={m.id} padded={false} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{mealLabels[m.meal_type]}</p>
                    <p className="text-[13px] text-ink-soft">{m.notes}</p>
                  </div>
                  {m.total_calories != null && (
                    <span className="font-mono text-sm text-ink-soft">
                      {m.total_calories} kcal
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
