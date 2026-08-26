"use client";

import { useState } from "react";
import {
  CATEGORY_LABEL,
  commonSymptomsForPhase,
  type CycleSymptom,
  type CycleSymptomCategory,
} from "@/lib/cycle-symptoms";
import type { CyclePhase } from "@/lib/cycle";
import { cn } from "@/lib/cn";

interface CommonSymptomsCardProps {
  phase: CyclePhase | null;
}

const CATEGORY_ICON: Record<CycleSymptomCategory, string> = {
  fisico: "🩺",
  emocional: "💭",
  energia: "⚡",
};

/**
 * Lista os sintomas comuns esperados para a fase atual. Ao tocar em um
 * sintoma, o usuário pode pré-preencher o form de sintomas de hoje
 * (via callback, mas mantemos simples aqui — apenas adiciona ao form).
 */
export function CommonSymptomsCard({ phase }: CommonSymptomsCardProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!phase) {
    return null;
  }

  const symptoms = commonSymptomsForPhase(phase);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Agrupa por categoria mantendo a ordem.
  const grouped: Record<CycleSymptomCategory, CycleSymptom[]> = {
    fisico: [],
    emocional: [],
    energia: [],
  };
  for (const s of symptoms) grouped[s.category].push(s);

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-ink-soft">
        O que costuma aparecer nesta fase — toque para registrar como
        sintoma de hoje.
      </p>
      {(["fisico", "emocional", "energia"] as CycleSymptomCategory[]).map(
        (cat) =>
          grouped[cat].length > 0 ? (
            <div key={cat}>
              <p className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-ink-faint">
                <span aria-hidden="true">{CATEGORY_ICON[cat]}</span>
                {CATEGORY_LABEL[cat]}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {grouped[cat].map((s) => {
                  const active = selected.has(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggle(s.id)}
                      aria-pressed={active}
                      title={s.tip}
                      className={cn(
                        "rounded-pill px-3 py-1.5 text-[12px] font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-base",
                        active
                          ? "bg-moss-soft text-moss-dark ring-1 ring-moss/30"
                          : "bg-line/40 text-ink-soft hover:bg-line/70",
                      )}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null,
      )}
      {selected.size > 0 && (
        <p className="text-[11px] text-ink-faint">
          {selected.size} selecionado(s) — serão enviados com o próximo
          registro.
        </p>
      )}
    </div>
  );
}