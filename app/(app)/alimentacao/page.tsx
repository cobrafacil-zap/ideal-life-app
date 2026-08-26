import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/SectionHeader";
import { MealLogForm } from "./MealLogForm";
import { MealItem } from "./MealItem";
import { EmptyState } from "@/components/EmptyState";
import { Utensils } from "lucide-react";
import { todayISO } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AlimentacaoPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const today = todayISO();

  const { data: meals } = await supabase
    .from("meals")
    .select("id, meal_type, notes, total_calories, logged_at")
    .eq("user_id", user.id)
    .eq("meal_date", today)
    .order("logged_at", { ascending: false });

  const totalCalories = (meals ?? []).reduce(
    (s, m) => s + (m.total_calories ?? 0),
    0
  );
  const mealCount = (meals ?? []).length;
  const avgPerMeal = mealCount > 0 ? Math.round(totalCalories / mealCount) : 0;

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        title="Alimentação"
        subtitle="Registre suas refeições para acompanhar a energia do dia."
      />

      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:p-6 sm:flex-row sm:items-center sm:justify-between bg-ember-gradient text-white">
          <div>
            <p className="text-sm text-white/85">Hoje você consumiu</p>
            <p className="font-mono text-3xl sm:text-4xl font-bold leading-tight">
              {totalCalories.toLocaleString("pt-BR")} kcal
            </p>
          </div>
          <div className="flex gap-6 sm:gap-8">
            <div>
              <p className="text-[12px] text-white/80">Refeições</p>
              <p className="font-mono text-lg font-semibold">{mealCount}</p>
            </div>
            <div>
              <p className="text-[12px] text-white/80">Média</p>
              <p className="font-mono text-lg font-semibold">{avgPerMeal} kcal</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader
              title="Registrar refeição"
              description="Adicione uma descrição e, se quiser, as calorias e macros."
            />
            <MealLogForm />
          </Card>
        </div>

        <aside className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Hoje"
              description="Suas refeições mais recentes aparecem no topo."
            />
            {mealCount === 0 ? (
              <EmptyState
                icon={Utensils}
                title="Nenhuma refeição registrada"
                description="Quando você salvar uma refeição, ela aparecerá aqui para consulta rápida."
              />
            ) : (
              <ul className="space-y-2">
                {meals!.map((m) => (
                  <li key={m.id}>
                    <MealItem
                      id={m.id}
                      type={m.meal_type}
                      notes={m.notes}
                      calories={m.total_calories}
                      loggedAt={m.logged_at}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="bg-ember-soft/40 border-ember/20">
            <p className="text-[12px] leading-relaxed text-ink-soft">
              Dica: anote também a sensação após comer (energia, sono, humor).
              Esses dados vão alimentar os relatórios de evolução.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
