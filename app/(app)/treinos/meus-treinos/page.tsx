import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Dumbbell, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/EmptyState";
import { listWorkoutPlans } from "../actions";

export const dynamic = "force-dynamic";

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function summarizeWeekdays(days: (number | null)[]): string {
  const valid = days.filter((d): d is number => d != null).sort((a, b) => a - b);
  if (valid.length === 0) return "Sem dia fixo";
  if (valid.length === 1) return WEEKDAY_SHORT[valid[0]];
  if (valid.length === 2) return `${WEEKDAY_SHORT[valid[0]]} e ${WEEKDAY_SHORT[valid[1]]}`;
  return valid.map((d) => WEEKDAY_SHORT[d]).join(" · ");
}

export default async function MeusTreinosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const plans = await listWorkoutPlans();

  // Coleta dias da semana por plano (1 plano pode ter vários dias — porém o
  // schema atual suporta 1 por plano via scheduled_weekday. Para a lista,
  // mostramos o(s) dia(s) do plano + descrição opcional.)
  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        title="Meus treinos"
        subtitle="Crie treinos com exercícios, séries e cargas alvo."
        action={
          <Link href="/treinos/meus-treinos/novo">
            <Button variant="secondary" leadingIcon={<Plus size={14} />}>
              Criar treino
            </Button>
          </Link>
        }
      />

      {plans.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Crie seu primeiro treino"
          description="Escolha um nome, marque os dias da semana e adicione exercícios da biblioteca."
          action={
            <Link href="/treinos/meus-treinos/novo">
              <Button variant="primary" leadingIcon={<Plus size={14} />}>
                Criar treino
              </Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <CardHeader
            title="Seus treinos"
            description="Toque para abrir e executar."
          />
          <ul className="space-y-2">
            {plans.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/treinos/meus-treinos/${p.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-line/60 bg-surface p-3 hover:border-ember/40 hover:shadow-card"
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ember-soft text-ember">
                    <Dumbbell size={18} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold text-ink">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-ink-soft">
                      {summarizeWeekdays([p.scheduled_weekday])} ·{" "}
                      {p.exercise_count}{" "}
                      {p.exercise_count === 1 ? "exercício" : "exercícios"}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    aria-hidden="true"
                    className="text-ink-faint"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
