"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, List, Plus, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Segmented } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { GoalCard } from "@/components/goals/GoalCard";
import { GoalFormModal } from "@/components/goals/GoalFormModal";
import { ProgressUpdateModal } from "@/components/goals/ProgressUpdateModal";
import { useStore } from "@/lib/data/store";
import { buildGoalViews, type GoalView } from "@/lib/selectors";
import { CADENCE_LABEL, PRIORITY_LABEL } from "@/lib/constants";
import type { GoalCadence, GoalPriority, GoalStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type SortKey = "prazo" | "progresso" | "prioridade" | "criacao";
type StatusFilter = "todas" | GoalStatus;

export default function MetasPage() {
  const { state } = useStore();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("todas");
  const [status, setStatus] = useState<StatusFilter>("todas");
  const [priority, setPriority] = useState<GoalPriority | "todas">("todas");
  const [cadence, setCadence] = useState<GoalCadence | "todas">("todas");
  const [sort, setSort] = useState<SortKey>("prazo");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [formOpen, setFormOpen] = useState(false);
  const [progressTarget, setProgressTarget] = useState<GoalView | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // "?status=ativa" (links do dashboard) pré-filtram a lista
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("status");
    if (param === "ativa" || param === "concluida" || param === "pausada") {
      setStatus(param);
    }
  }, []);

  const views = useMemo(() => buildGoalViews(state), [state]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = views.filter((v) => {
      if (category !== "todas" && v.goal.categoryId !== category) return false;
      if (status !== "todas" && v.goal.status !== status) return false;
      if (priority !== "todas" && v.goal.priority !== priority) return false;
      if (cadence !== "todas" && v.goal.cadence !== cadence) return false;
      if (
        term &&
        !v.goal.title.toLowerCase().includes(term) &&
        !v.goal.description.toLowerCase().includes(term) &&
        !(v.category?.name ?? "").toLowerCase().includes(term)
      )
        return false;
      return true;
    });

    const priorityRank: Record<GoalPriority, number> = { urgente: 0, alta: 1, media: 2, baixa: 3 };
    const statusRank: Record<GoalStatus, number> = { ativa: 0, pausada: 1, concluida: 2 };
    list = [...list].sort((a, b) => {
      if (a.goal.status !== b.goal.status) {
        return statusRank[a.goal.status] - statusRank[b.goal.status];
      }
      if (sort === "prazo") {
        const ad = a.deadline.daysLeft ?? 99999;
        const bd = b.deadline.daysLeft ?? 99999;
        return ad - bd;
      }
      if (sort === "progresso") return b.breakdown.total - a.breakdown.total;
      if (sort === "prioridade")
        return priorityRank[a.goal.priority] - priorityRank[b.goal.priority];
      return b.goal.createdAt.localeCompare(a.goal.createdAt);
    });
    return list;
  }, [views, search, category, status, priority, cadence, sort]);

  const activeFilters =
    (category !== "todas" ? 1 : 0) +
    (status !== "todas" ? 1 : 0) +
    (priority !== "todas" ? 1 : 0) +
    (cadence !== "todas" ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* barra de filtros */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, descrição ou categoria…"
              className="pl-9"
            />
          </div>

          <Button
            variant={activeFilters ? "secondary" : "outline"}
            leadingIcon={<SlidersHorizontal className="h-4 w-4" />}
            onClick={() => setFiltersOpen((v) => !v)}
          >
            Filtros{activeFilters ? ` (${activeFilters})` : ""}
          </Button>

          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-11 rounded-xl border border-line bg-surface px-3 text-[13px] font-medium text-ink focus:border-iris focus:outline-none"
              aria-label="Ordenar"
            >
              <option value="prazo">Ordenar: prazo</option>
              <option value="progresso">Ordenar: progresso</option>
              <option value="prioridade">Ordenar: prioridade</option>
              <option value="criacao">Ordenar: criação</option>
            </select>
            <Segmented
              value={layout}
              onChange={setLayout}
              options={[
                { value: "grid", label: "", icon: <LayoutGrid className="h-4 w-4" /> },
                { value: "list", label: "", icon: <List className="h-4 w-4" /> },
              ]}
            />
          </div>

          <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
            Nova meta
          </Button>
        </div>

        {filtersOpen ? (
          <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="mb-1.5 text-[13px] font-semibold text-ink-soft">Categoria</p>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-[13px] text-ink focus:border-iris focus:outline-none"
              >
                <option value="todas">Todas</option>
                {state.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-1.5 text-[13px] font-semibold text-ink-soft">Status</p>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-[13px] text-ink focus:border-iris focus:outline-none"
              >
                <option value="todas">Todos</option>
                <option value="ativa">Ativas</option>
                <option value="concluida">Concluídas</option>
                <option value="pausada">Pausadas</option>
              </select>
            </div>
            <div>
              <p className="mb-1.5 text-[13px] font-semibold text-ink-soft">Prioridade</p>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as GoalPriority | "todas")}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-[13px] text-ink focus:border-iris focus:outline-none"
              >
                <option value="todas">Todas</option>
                {(Object.keys(PRIORITY_LABEL) as GoalPriority[]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-1.5 text-[13px] font-semibold text-ink-soft">Período</p>
              <select
                value={cadence}
                onChange={(e) => setCadence(e.target.value as GoalCadence | "todas")}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-[13px] text-ink focus:border-iris focus:outline-none"
              >
                <option value="todas">Todos</option>
                {(Object.keys(CADENCE_LABEL) as GoalCadence[]).map((c) => (
                  <option key={c} value={c}>
                    {CADENCE_LABEL[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[13px] text-ink-faint">
          {filtered.length} {filtered.length === 1 ? "meta" : "metas"}
          {activeFilters ? " com filtros" : ""}
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-5 w-5" />}
          title="Nenhuma meta encontrada"
          description="Ajuste os filtros ou cadastre uma nova meta para começar a acompanhar."
          action={
            <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
              Nova meta
            </Button>
          }
        />
      ) : (
        <div
          className={cn(
            layout === "grid"
              ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
              : "grid gap-3 xl:grid-cols-2",
          )}
        >
          {filtered.map((v) => (
            <GoalCard
              key={v.goal.id}
              view={v}
              compact={layout === "list"}
              onOpenProgress={setProgressTarget}
            />
          ))}
        </div>
      )}

      <GoalFormModal open={formOpen} onClose={() => setFormOpen(false)} />
      <ProgressUpdateModal
        view={progressTarget}
        open={Boolean(progressTarget)}
        onClose={() => setProgressTarget(null)}
      />
    </div>
  );
}
