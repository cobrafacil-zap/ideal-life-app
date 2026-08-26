"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Apple, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DietPlan } from "@/lib/diet-template";

/**
 * Botão "Ver sugestão de dieta" + card expansível com o plano gerado.
 * Estado local — sem persistência (regenera a cada visita).
 */
export function DietSuggestion({
  plan,
  profileIncomplete,
}: {
  plan: DietPlan | null;
  profileIncomplete: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (profileIncomplete) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-line bg-surface/60 p-4 text-[13px] text-ink-soft">
        Complete seu <strong className="font-semibold text-ink">perfil</strong>{" "}
        (data de nascimento, sexo biológico e nível de atividade) para receber
        uma sugestão de dieta personalizada.
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        leadingIcon={<Apple size={14} />}
      >
        {open ? "Ocultar sugestão de dieta" : "Ver sugestão de dieta"}
      </Button>

      {open && (
        <Card className="mt-3 bg-moss-soft/40">
          <CardHeader
            title="Plano sugerido"
            description={`${plan.totalKcal} kcal/dia — 5 refeições`}
          />
          <ul className="space-y-3">
            {plan.meals.map((m) => (
              <li key={m.label} className="rounded-xl bg-white/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-[13px] font-semibold text-ink">
                    {m.label}
                  </p>
                  <span
                    className={cn(
                      "rounded-pill bg-moss-soft px-2 py-0.5 text-[11px] font-semibold text-moss-dark",
                    )}
                  >
                    {m.kcal} kcal
                  </span>
                </div>
                <ul className="mt-1.5 space-y-1 text-[13px] text-ink-soft">
                  {m.items.map((it) => (
                    <li key={it}>• {it}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-start gap-2 text-[11px] text-ink-soft">
            <Sparkles size={12} className="mt-0.5 shrink-0 text-moss-dark" />
            <ul className="space-y-0.5">
              {plan.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}
