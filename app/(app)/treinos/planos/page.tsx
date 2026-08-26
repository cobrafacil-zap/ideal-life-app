import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Dumbbell, ChevronRight, Power } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/EmptyState";
import { listWorkoutPlans } from "../actions";

export const dynamic = "force-dynamic";

export default async function PlanosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const plans = await listWorkoutPlans();

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        title="Planos de treino"
        subtitle="Organize exercícios, séries e cargas alvo."
        action={
          <Link href="/treinos/planos/novo">
            <Button variant="secondary" leadingIcon={<Plus size={14} />}>
              Novo plano
            </Button>
          </Link>
        }
      />

      {plans.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Sem planos ainda"
          description="Crie um plano com exercícios, séries e cargas alvo."
          action={
            <Link href="/treinos/planos/novo">
              <Button variant="secondary">Criar plano</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <CardHeader
            title="Seus planos"
            description="Apenas um pode estar ativo por vez."
          />
          <ul className="space-y-2">
            {plans.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/treinos/planos/${p.id}`}
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
                      {p.exercise_count}{" "}
                      {p.exercise_count === 1 ? "exercício" : "exercícios"}
                      {p.description ? ` · ${p.description}` : ""}
                    </p>
                  </div>
                  {p.is_active && (
                    <span className="inline-flex items-center gap-1 rounded-pill bg-moss-soft px-2 py-0.5 text-[10px] font-semibold text-moss-dark">
                      <Power size={10} aria-hidden="true" />
                      ativo
                    </span>
                  )}
                  <ChevronRight size={14} aria-hidden="true" className="text-ink-faint" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
