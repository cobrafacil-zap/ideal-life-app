"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { suggestSteps } from "@/app/actions/ai";
import { Button } from "@/components/ui/Button";
import { Field, Input, Label, Segmented, Select, Textarea } from "@/components/ui/Field";
import { Icon, ICON_NAMES } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/data/store";
import {
  CADENCE_LABEL,
  CATEGORY_PALETTE,
  PRIORITY_LABEL,
  SCOPE_LABEL,
  UNIT_OPTIONS,
} from "@/lib/constants";
import type { Goal, GoalCadence, GoalPriority, GoalScope } from "@/lib/types";
import { toISODate } from "@/lib/utils";

type TrackMode = "valor" | "etapas" | "misto";

interface Props {
  open: boolean;
  onClose: () => void;
  goal?: Goal | null;
  defaultCategoryId?: string;
}

function parseNumber(value: string): number | null {
  if (!value.trim()) return null;
  const normalized = value
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function GoalFormModal({ open, onClose, goal, defaultCategoryId }: Props) {
  const { state, addGoal, updateGoal, addStep, addCategory } = useStore();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [scope, setScope] = useState<GoalScope>("neutro");
  const [priority, setPriority] = useState<GoalPriority>("media");
  const [cadence, setCadence] = useState<GoalCadence>("sem-prazo");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [parentGoalId, setParentGoalId] = useState("");
  const [mode, setMode] = useState<TrackMode>("valor");
  const [metricStart, setMetricStart] = useState("");
  const [metricCurrent, setMetricCurrent] = useState("");
  const [metricTarget, setMetricTarget] = useState("");
  const [metricUnit, setMetricUnit] = useState("R$");
  const [direction, setDirection] = useState<"increase" | "decrease">("increase");
  const [icon, setIcon] = useState("target");
  const [notes, setNotes] = useState("");
  const [stepsText, setStepsText] = useState("");
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [newCategory, setNewCategory] = useState<string | null>(null);

  const isEdit = Boolean(goal);

  useEffect(() => {
    if (!open) return;
    setError("");
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description);
      setCategoryId(goal.categoryId);
      setScope(goal.scope);
      setPriority(goal.priority);
      setCadence(goal.cadence);
      setStartDate(goal.startDate ?? "");
      setDueDate(goal.dueDate ?? "");
      setParentGoalId(goal.parentGoalId ?? "");
      const hasMetric = goal.metricTarget !== null;
      const stepCount = state.steps.filter((s) => s.goalId === goal.id).length;
      setMode(hasMetric && stepCount > 0 ? "misto" : hasMetric ? "valor" : "etapas");
      setMetricStart(goal.metricStart !== null ? String(goal.metricStart) : "");
      setMetricCurrent(goal.metricCurrent !== null ? String(goal.metricCurrent) : "");
      setMetricTarget(goal.metricTarget !== null ? String(goal.metricTarget) : "");
      setMetricUnit(goal.metricUnit || "R$");
      setDirection(goal.metricDirection);
      setIcon(goal.icon || "target");
      setNotes(goal.notes);
      setStepsText("");
      setNewCategory(null);
    } else {
      const cat = defaultCategoryId ?? state.categories[0]?.id ?? "";
      setTitle("");
      setDescription("");
      setCategoryId(cat);
      setScope(state.categories.find((c) => c.id === cat)?.scope ?? "neutro");
      setPriority("media");
      setCadence("sem-prazo");
      setStartDate(toISODate());
      setDueDate("");
      setParentGoalId("");
      setMode("valor");
      setMetricStart("");
      setMetricCurrent("");
      setMetricTarget("");
      setMetricUnit("R$");
      setDirection("increase");
      setIcon("target");
      setNotes("");
      setStepsText("");
      setNewCategory(null);
    }
  }, [open, goal, state.categories, state.steps, defaultCategoryId]);

  const category = state.categories.find((c) => c.id === categoryId);
  const parentCandidates = useMemo(
    () => state.goals.filter((g) => g.id !== goal?.id && g.status === "ativa"),
    [state.goals, goal?.id],
  );

  const submit = () => {
    if (!title.trim()) {
      setError("Dê um nome para a meta.");
      return;
    }
    if (!categoryId) {
      setError("Escolha uma categoria.");
      return;
    }

    const start = parseNumber(metricStart);
    const current = parseNumber(metricCurrent);
    const target = parseNumber(metricTarget);
    const useMetric = mode !== "etapas";

    const payload = {
      title,
      description,
      categoryId,
      scope,
      priority,
      cadence,
      startDate: startDate || null,
      dueDate: dueDate || null,
      parentGoalId: parentGoalId || null,
      metricStart: useMetric ? start : null,
      metricCurrent: useMetric ? current : null,
      metricTarget: useMetric ? target : null,
      metricUnit: useMetric ? metricUnit : "",
      metricDirection: direction,
      icon,
      notes,
    };

    if (isEdit && goal) {
      updateGoal(goal.id, payload);
      toast("Meta atualizada.");
    } else {
      const created = addGoal(payload);
      const lines = stepsText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      lines.forEach((line) => addStep(created.id, line));
      toast("Meta criada com sucesso!");
    }
    onClose();
  };

  const handleSuggestSteps = async () => {
    setAiLoading(true);
    setAiMessage("");
    const result = await suggestSteps({
      title,
      description,
      category: category?.name,
      dueDate,
    });
    setAiLoading(false);
    if (!result.available || !result.data?.steps?.length) {
      setAiMessage(result.message);
      return;
    }
    setStepsText(result.data.steps.join("\n"));
    setMode((m) => (m === "valor" ? "misto" : m));
    setAiMessage("Etapas sugeridas pela IA — revise e ajuste como quiser.");
  };

  const handleCategoryChange = (id: string) => {
    setCategoryId(id);
    const cat = state.categories.find((c) => c.id === id);
    if (cat) setScope(cat.scope);
  };

  const createCategoryInline = () => {
    const name = newCategory?.trim();
    if (!name) return;
    const created = addCategory({
      name,
      color: CATEGORY_PALETTE[state.categories.length % CATEGORY_PALETTE.length].color,
      icon: "target",
      scope: "neutro",
      isCustom: true,
    });
    setCategoryId(created.id);
    setNewCategory(null);
    toast("Categoria criada.");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? "Editar meta" : "Nova meta"}
      description={
        isEdit
          ? "Atualize os dados e o progresso da sua meta."
          : "Cadastre um objetivo: o app calcula o progresso e acompanha os prazos."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit}>{isEdit ? "Salvar alterações" : "Criar meta"}</Button>
        </>
      }
    >
      <div className="space-y-5">
        {error ? (
          <p className="rounded-xl border border-rose/30 bg-rose-soft px-3.5 py-2.5 text-[13px] font-medium text-rose-dark">
            {error}
          </p>
        ) : null}

        <Field label="Nome da meta" htmlFor="goal-title">
          <Input
            id="goal-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Faturar R$ 100.000"
          />
        </Field>

        <Field label="Descrição" optional htmlFor="goal-desc">
          <Textarea
            id="goal-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contexto, estratégia e o que significa conquerir essa meta."
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Categoria" htmlFor="goal-category">
            <div className="flex gap-2">
              <Select
                id="goal-category"
                value={categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                {state.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <button
                type="button"
                onClick={() => setNewCategory(newCategory === "" ? " " : "")}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line text-ink-faint transition-colors hover:border-iris hover:text-iris"
                title="Criar categoria"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {newCategory !== null ? (
              <div className="mt-2 flex gap-2 animate-fade-in">
                <Input
                  autoFocus
                  value={newCategory.trim()}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createCategoryInline();
                  }}
                  placeholder="Nome da nova categoria"
                />
                <Button size="sm" variant="secondary" onClick={createCategoryInline}>
                  Criar
                </Button>
              </div>
            ) : null}
          </Field>

          <Field label="Âmbito" hint="Aparece nos resumos pessoal / profissional">
            <Segmented
              value={scope}
              onChange={setScope}
              className="w-full"
              options={(["pessoal", "profissional", "neutro"] as GoalScope[]).map((s) => ({
                value: s,
                label: SCOPE_LABEL[s],
              }))}
            />
          </Field>
        </div>

        <Field label="Acompanhamento" hint="Como o progresso é medido">
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "valor", label: "Valor / quantidade" },
              { value: "etapas", label: "Etapas" },
              { value: "misto", label: "Misto" },
            ]}
          />
        </Field>

        {mode !== "etapas" ? (
          <div className="grid gap-4 rounded-xl border border-line bg-ink/[0.02] p-4 sm:grid-cols-3">
            <Field label="Valor inicial" htmlFor="m-start">
              <Input
                id="m-start"
                inputMode="decimal"
                value={metricStart}
                onChange={(e) => setMetricStart(e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field label="Valor atual" htmlFor="m-current">
              <Input
                id="m-current"
                inputMode="decimal"
                value={metricCurrent}
                onChange={(e) => setMetricCurrent(e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field label="Valor desejado" htmlFor="m-target">
              <Input
                id="m-target"
                inputMode="decimal"
                value={metricTarget}
                onChange={(e) => setMetricTarget(e.target.value)}
                placeholder="0"
              />
            </Field>
            <div className="sm:col-span-3 grid gap-4 sm:grid-cols-3">
              <Field label="Unidade de medida">
                <Select value={metricUnit} onChange={(e) => setMetricUnit(e.target.value)}>
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Direção do progresso">
                <Segmented
                  value={direction}
                  onChange={setDirection}
                  options={[
                    { value: "increase", label: "Aumentar" },
                    { value: "decrease", label: "Reduzir" },
                  ]}
                />
              </Field>
              <Field label="Direção" optional>
                <p className="text-[12px] leading-relaxed text-ink-faint">
                  {direction === "increase"
                    ? "O progresso cresce quando o valor atual sobe."
                    : "O progresso cresce quando o valor atual desce (ex.: peso)."}
                </p>
              </Field>
            </div>
          </div>
        ) : null}

        {mode !== "valor" ? (
          <Field
            label="Etapas"
            optional
            hint={isEdit ? "Adicione novas etapas (uma por linha)" : "Uma por linha"}
            htmlFor="goal-steps"
          >
            <Textarea
              id="goal-steps"
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              placeholder={"Criar ideia\nDefinir produto\nCriar página de vendas"}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                loading={aiLoading}
                leadingIcon={<Sparkles className="h-3.5 w-3.5" />}
                onClick={handleSuggestSteps}
              >
                Sugerir etapas com IA
              </Button>
              {aiMessage ? (
                <span className="text-[12px] text-ink-faint">{aiMessage}</span>
              ) : null}
            </div>
          </Field>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Data de início" htmlFor="goal-start">
            <Input
              id="goal-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Field>
          <Field label="Prazo final" optional htmlFor="goal-due">
            <Input
              id="goal-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Prioridade">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as GoalPriority)}>
              {(Object.keys(PRIORITY_LABEL) as GoalPriority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Período">
            <Select value={cadence} onChange={(e) => setCadence(e.target.value as GoalCadence)}>
              {(Object.keys(CADENCE_LABEL) as GoalCadence[]).map((c) => (
                <option key={c} value={c}>
                  {CADENCE_LABEL[c]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Meta principal" optional hint="vincula esta meta a uma maior">
            <Select value={parentGoalId} onChange={(e) => setParentGoalId(e.target.value)}>
              <option value="">Sem vínculo</option>
              {parentCandidates.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Ícone">
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-line bg-ink/[0.02] p-2.5">
            {ICON_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setIcon(name)}
                className={`grid h-9 w-9 place-items-center rounded-lg transition-all ${
                  icon === name
                    ? "bg-iris text-white shadow-card"
                    : "text-ink-faint hover:bg-ink/5 hover:text-ink"
                }`}
                aria-label={name}
              >
                <Icon name={name} className="h-[17px] w-[17px]" />
              </button>
            ))}
          </div>
        </Field>

        <Field label="Observações" optional htmlFor="goal-notes">
          <Textarea
            id="goal-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Estratégia, riscos, referências."
          />
        </Field>
      </div>
    </Modal>
  );
}
