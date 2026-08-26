"use client";

import { useMemo, useState } from "react";
import { Calculator, Minus, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  PORTION_TABLE,
  type FoodCategory,
  type PortionItem,
} from "@/lib/nutrition";

export interface CalculatedTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface CalorieCalculatorProps {
  /** Callback recebe os totais calculados — o pai aplica ao form. */
  onApply: (totals: CalculatedTotals) => void;
  /** Callback pra resetar depois de aplicar (limpa o que foi adicionado). */
  onApplied?: () => void;
}

const ALL_CATEGORIES: Array<"all" | FoodCategory> = ["all", ...CATEGORY_ORDER];

/**
 * Calculadora visual de calorias com base na tabela expandida de alimentos.
 *
 * - filtro por categoria (chips no topo);
 * - busca dentro da categoria;
 * - cada item adicionado tem um contador de porções (1, 2, 3…);
 * - total agregado em kcal + macros;
 * - botão "Usar no formulário" injeta os totais.
 */
export function CalorieCalculator({ onApply, onApplied }: CalorieCalculatorProps) {
  const [query, setQuery] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [category, setCategory] = useState<"all" | FoodCategory>("all");

  // Aplica busca + categoria; depois agrupa pela categoria para render.
  const filtered: PortionItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PORTION_TABLE.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (q && !p.label.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, category]);

  const totals: CalculatedTotals = useMemo(() => {
    let kcal = 0;
    let p = 0;
    let c = 0;
    let f = 0;
    for (const item of PORTION_TABLE) {
      const n = counts[item.label] ?? 0;
      if (n === 0) continue;
      kcal += item.kcal * n;
      p += (item.protein ?? 0) * n;
      c += (item.carbs ?? 0) * n;
      f += (item.fat ?? 0) * n;
    }
    return {
      calories: Math.round(kcal),
      protein: Math.round(p * 10) / 10,
      carbs: Math.round(c * 10) / 10,
      fat: Math.round(f * 10) / 10,
    };
  }, [counts]);

  const totalPortions = Object.values(counts).reduce((a, b) => a + b, 0);

  function bump(label: string, delta: number) {
    setCounts((prev) => {
      const next = { ...prev };
      const current = next[label] ?? 0;
      const updated = current + delta;
      if (updated <= 0) {
        delete next[label];
      } else {
        next[label] = Math.min(updated, 99);
      }
      return next;
    });
  }

  function clearAll() {
    setCounts({});
  }

  function apply() {
    if (totalPortions === 0) return;
    onApply(totals);
    clearAll();
    onApplied?.();
  }

  const addedItems = PORTION_TABLE.filter((p) => (counts[p.label] ?? 0) > 0);

  // Agrupa itens filtrados por categoria (na ordem do CATEGORY_ORDER).
  const grouped: Array<{ cat: FoodCategory; items: PortionItem[] }> = useMemo(() => {
    const map = new Map<FoodCategory, PortionItem[]>();
    for (const it of filtered) {
      const arr = map.get(it.category) ?? [];
      arr.push(it);
      map.set(it.category, arr);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      cat: c,
      items: map.get(c)!,
    }));
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Busca + filtro */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar alimento (bife, arroz, ovo...)"
            aria-label="Buscar alimento"
            className="block w-full rounded-xl border border-line bg-surface pl-9 pr-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base"
          />
        </div>
      </div>

      {/* Chips de categoria */}
      <div className="flex flex-wrap gap-1.5 no-scrollbar overflow-x-auto pb-1">
        {ALL_CATEGORIES.map((c) => {
          const active = category === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={active}
              className={cn(
                "shrink-0 rounded-pill px-2.5 py-1 text-[11px] font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base",
                active
                  ? "bg-ember-gradient text-white shadow-card"
                  : "bg-line/40 text-ink-soft hover:bg-line",
              )}
            >
              {c === "all" ? "Todas" : CATEGORY_LABEL[c]}
            </button>
          );
        })}
      </div>

      {/* Itens selecionados — chips no topo */}
      {addedItems.length > 0 && (
        <div className="rounded-2xl border border-line/60 bg-base/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wide text-ink-faint">
              {totalPortions} porção(ões)
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 text-[11px] text-ink-soft hover:text-ember"
              aria-label="Limpar tudo"
            >
              <X size={12} aria-hidden="true" />
              Limpar
            </button>
          </div>
          <ul className="flex flex-wrap gap-2">
            {addedItems.map((it) => (
              <li
                key={it.label}
                className="inline-flex items-center gap-2 rounded-pill bg-ember-soft px-2.5 py-1 text-[12px] text-ember-dark"
              >
                <span className="font-semibold">{counts[it.label]}×</span>
                <span>{it.label}</span>
                <span className="font-mono opacity-70">
                  {it.kcal * counts[it.label]} kcal
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lista de alimentos (agrupada por categoria) */}
      <div
        className="max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-line/60 bg-surface p-3"
        role="list"
        aria-label="Lista de alimentos"
      >
        {grouped.map(({ cat, items }) => (
          <section key={cat}>
            <h4 className="mb-1.5 text-[10px] uppercase tracking-wider text-ink-faint">
              {CATEGORY_LABEL[cat]}
            </h4>
            <ul className="space-y-1">
              {items.map((p) => {
                const n = counts[p.label] ?? 0;
                return (
                  <li
                    key={p.label}
                    className={cn(
                      "flex items-center gap-3 rounded-lg p-2 transition-colors",
                      n > 0 ? "bg-ember-soft/50" : "hover:bg-base/60",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">
                        {p.label}
                      </p>
                      <p className="text-[11px] text-ink-faint">
                        {p.unit} ·{" "}
                        <span className="font-mono text-ember-dark">
                          {p.kcal} kcal
                        </span>
                        {(p.protein != null ||
                          p.carbs != null ||
                          p.fat != null) && (
                          <>
                            {" · "}P {p.protein ?? 0}g · C {p.carbs ?? 0}g · G{" "}
                            {p.fat ?? 0}g
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => bump(p.label, -1)}
                        disabled={n === 0}
                        aria-label={`Remover uma porção de ${p.label}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft hover:border-ember/40 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base"
                      >
                        <Minus size={12} aria-hidden="true" />
                      </button>
                      <span className="w-6 text-center font-mono text-sm tabular-nums text-ink">
                        {n}
                      </span>
                      <button
                        type="button"
                        onClick={() => bump(p.label, 1)}
                        aria-label={`Adicionar uma porção de ${p.label}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft hover:border-ember/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base"
                      >
                        <Plus size={12} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {filtered.length === 0 && (
          <p className="p-6 text-center text-[12px] text-ink-soft">
            Nenhum alimento encontrado para essa combinação.
          </p>
        )}
      </div>

      {/* Total + aplicar */}
      <div className="flex items-center justify-between rounded-2xl bg-ember-soft p-3">
        <div className="flex items-center gap-2">
          <Calculator size={16} className="text-ember-dark" aria-hidden="true" />
          <div>
            <p className="font-mono text-base font-bold leading-none text-ember-dark">
              {totals.calories} kcal
            </p>
            <p className="mt-0.5 text-[11px] text-ember-dark/80">
              P {totals.protein}g · C {totals.carbs}g · G {totals.fat}g
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={apply}
          disabled={totalPortions === 0}
          size="sm"
          variant="primary"
        >
          Usar no formulário
        </Button>
      </div>
    </div>
  );
}