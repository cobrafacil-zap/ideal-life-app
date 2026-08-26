import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/SectionHeader";
import { MealLogForm } from "./MealLogForm";
import { MealItem } from "./MealItem";
import { PhotoMealUploader } from "./PhotoMealUploader";
import { EmptyState } from "@/components/EmptyState";
import { Info, Utensils } from "lucide-react";
import { todayISO } from "@/lib/format";
import { PORTION_TABLE, explainCalorieMath } from "@/lib/nutrition";
import { getSignedMealPhotoUrls, purgeOldMealPhotos } from "@/lib/meal-photos";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

// Throttle do purge de fotos antigas — evita stampede entre abas.
let lastPurge = 0;
const PURGE_INTERVAL_MS = 60 * 60 * 1000; // 1 h

export default async function AlimentacaoPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Phase 8: limpa fotos com 7+ dias, no máximo 1× por hora.
  const now = Date.now();
  if (now - lastPurge > PURGE_INTERVAL_MS) {
    lastPurge = now;
    void purgeOldMealPhotos(supabase, user.id);
  }

  const today = todayISO();

  const { data: meals } = await supabase
    .from("meals")
    .select("id, meal_type, notes, total_calories, logged_at")
    .eq("user_id", user.id)
    .eq("meal_date", today)
    .order("logged_at", { ascending: false });

  // Pega as fotos das refeições de hoje (se houver) para exibir thumbnail.
  const mealIds = (meals ?? []).map((m) => m.id);
  const photoByMeal = new Map<string, string>();
  if (mealIds.length > 0) {
    const { data: photos } = await supabase
      .from("meal_photos")
      .select("meal_id, storage_path")
      .in("meal_id", mealIds)
      .order("created_at", { ascending: false });
    const paths = (photos ?? []).map((p) => p.storage_path);
    const signed = await getSignedMealPhotoUrls(supabase, paths);
    for (const p of photos ?? []) {
      const url = signed.get(p.storage_path);
      if (url) photoByMeal.set(p.meal_id, url);
    }
  }

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

      <Card>
        <CardHeader
          title="Como calculamos as calorias"
          description="Referência rápida para suas estimativas."
        />
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ember-soft text-ember">
            <Info size={16} aria-hidden="true" />
          </span>
          <p className="text-[13px] leading-relaxed text-ink-soft">
            {explainCalorieMath()}
          </p>
        </div>
        <details className="mt-4 group">
          <summary
            className={cn(
              "cursor-pointer text-sm font-semibold text-ink hover:text-ember",
              "list-none [&::-webkit-details-marker]:hidden",
            )}
          >
            ▸ Ver tabela de calorias por porção comum
          </summary>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {PORTION_TABLE.map((p) => (
              <li
                key={p.label}
                className="rounded-2xl bg-surface p-3 ring-1 ring-line/60"
              >
                <p className="text-[12px] font-semibold text-ink">{p.label}</p>
                <p className="mt-0.5 text-[11px] text-ink-soft">{p.unit}</p>
                <p className="mt-1 font-mono text-base font-bold text-ember-dark">
                  {p.kcal} kcal
                </p>
                {(p.protein != null || p.carbs != null || p.fat != null) && (
                  <p className="mt-0.5 text-[10px] text-ink-faint">
                    P {p.protein ?? 0}g · C {p.carbs ?? 0}g · G {p.fat ?? 0}g
                  </p>
                )}
              </li>
            ))}
          </ul>
        </details>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader
              title="Foto do prato (IA)"
              description="Tire uma foto e a Gemini estima calorias e macros. A foto fica salva por 7 dias."
            />
            <PhotoMealUploader />
          </Card>

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
                  <li key={m.id} className="flex items-center gap-3">
                    {photoByMeal.get(m.id) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoByMeal.get(m.id)!}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-line/60"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <MealItem
                        id={m.id}
                        type={m.meal_type}
                        notes={m.notes}
                        calories={m.total_calories}
                        loggedAt={m.logged_at}
                      />
                    </div>
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
