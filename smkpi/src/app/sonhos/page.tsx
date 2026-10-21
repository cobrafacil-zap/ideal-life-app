"use client";

import { useState } from "react";
import {
  CalendarClock,
  Image as ImageIcon,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
  Wallet,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { GoalFormModal } from "@/components/goals/GoalFormModal";
import { useStore } from "@/lib/data/store";
import { suggestGoalsFromDream } from "@/app/actions/ai";
import type { Dream } from "@/lib/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export default function SonhosPage() {
  const { state, addDream, updateDream, deleteDream, addGoal, updateSettings } = useStore();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Dream | null>(null);
  const [converting, setConverting] = useState<Dream | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [desiredDate, setDesiredDate] = useState("");

  const openForm = (dream?: Dream) => {
    if (dream) {
      setEditing(dream);
      setTitle(dream.title);
      setDescription(dream.description);
      setImageUrl(dream.imageUrl ?? "");
      setEstimatedValue(dream.estimatedValue?.toString() ?? "");
      setDesiredDate(dream.desiredDate ?? "");
    } else {
      setEditing(null);
      setTitle("");
      setDescription("");
      setImageUrl("");
      setEstimatedValue("");
      setDesiredDate("");
    }
    setFormOpen(true);
  };

  const submit = () => {
    if (!title.trim()) {
      toast("Dê um nome ao seu sonho.", "error");
      return;
    }
    const payload = {
      title,
      description,
      imageUrl: imageUrl.trim() || null,
      estimatedValue: estimatedValue ? Number(estimatedValue.replace(",", ".")) : null,
      desiredDate: desiredDate || null,
    };
    if (editing) {
      updateDream(editing.id, payload);
      toast("Sonho atualizado.");
    } else {
      addDream(payload);
      toast("Sonho registrado ✨");
    }
    setFormOpen(false);
  };

  const handleSuggest = async (dream: Dream) => {
    setAiLoading(true);
    setAiError("");
    const result = await suggestGoalsFromDream({
      title: dream.title,
      description: dream.description,
      estimatedValue: dream.estimatedValue,
    });
    setAiLoading(false);
    if (!result.available || !result.data?.goals?.length) {
      setAiError(result.message);
      return;
    }
    const [first] = result.data.goals;
    const created = addGoal({
      title: first.title,
      description: first.description,
      categoryId: state.categories[0]?.id ?? "",
      scope: "neutro",
      priority: "media",
      cadence: "sem-prazo",
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: dream.desiredDate,
      metricStart: 0,
      metricCurrent: 0,
      metricTarget: first.metricTarget,
      metricUnit: first.metricUnit ?? "",
      icon: "sparkles",
    });
    updateDream(dream.id, { status: "em_andamento", goalId: created.id });
    setConverting(null);
    toast("Sonho transformado em meta com IA! 🚀");
  };

  const convertToGoal = (dream: Dream) => {
    const created = addGoal({
      title: dream.title,
      description: dream.description,
      categoryId: state.categories[0]?.id ?? "",
      scope: "neutro",
      priority: "media",
      cadence: "sem-prazo",
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: dream.desiredDate,
      metricStart: 0,
      metricCurrent: 0,
      metricTarget: dream.estimatedValue ?? null,
      metricUnit: dream.estimatedValue ? "R$" : "",
      icon: "sparkles",
    });
    updateDream(dream.id, { status: "em_andamento", goalId: created.id });
    setConverting(null);
    toast("Sonho transformado em meta! 🚀");
  };

  return (
    <div className="space-y-5">
      <section className="surface-grid relative overflow-hidden rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-iris-soft px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-iris-dark">
              <Sparkles className="h-3.5 w-3.5" />
              Área dos sonhos
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Visionários sem prazo
            </h2>
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-ink-soft">
              Os objetivos maiores da sua vida — comprar uma casa, viajar o mundo, construir uma
              empresa. Registre aqui e transforme em meta quando quiser.
            </p>
          </div>
          <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={() => openForm()}>
            Novo sonho
          </Button>
        </div>
      </section>

      {state.dreams.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-5 w-5" />}
          title="Nenhum sonho registrado"
          description="Comece pelos objetivos maiores da sua vida — sem prazo, sem pressão."
          action={
            <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={() => openForm()}>
              Registrar sonho
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {state.dreams.map((dream) => (
            <Card key={dream.id} hover className="flex flex-col overflow-hidden p-0">
              <div
                className="relative h-36 w-full overflow-hidden"
                style={
                  dream.imageUrl
                    ? {
                        backgroundImage: `linear-gradient(180deg, transparent 40%, rgba(9,9,13,0.55)), url(${dream.imageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : {
                        background:
                          "linear-gradient(135deg, color-mix(in srgb, var(--iris) 22%, transparent), color-mix(in srgb, var(--jade) 18%, transparent))",
                      }
                }
              >
                {!dream.imageUrl ? (
                  <div className="grid h-full place-items-center">
                    <Sparkles className="h-8 w-8 text-white/70" />
                  </div>
                ) : null}
                <div className="absolute left-3 top-3 flex gap-1.5">
                  {dream.status === "em_andamento" ? (
                    <Badge tone="accent" className="bg-white/90">
                      Em andamento
                    </Badge>
                  ) : dream.status === "concluido" ? (
                    <Badge tone="success" className="bg-white/90">
                      Concluído
                    </Badge>
                  ) : null}
                </div>
                <div className="absolute bottom-3 right-3 flex gap-1">
                  <button
                    onClick={() => openForm(dream)}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
                    aria-label="Editar sonho"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      deleteDream(dream.id);
                      toast("Sonho removido.", "info");
                    }}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-black/40 text-white backdrop-blur transition-colors hover:bg-rose/70"
                    aria-label="Excluir sonho"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-[15px] font-semibold leading-snug text-ink">
                  {dream.title}
                </h3>
                {dream.description ? (
                  <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-ink-faint">
                    {dream.description}
                  </p>
                ) : null}

                <div className="mt-4 space-y-1.5 text-[12px]">
                  {dream.estimatedValue ? (
                    <p className="flex items-center gap-1.5 text-ink-soft">
                      <Wallet className="h-3.5 w-3.5 text-ink-faint" />
                      Valor estimado:{" "}
                      <strong className="font-semibold text-ink">
                        {formatCurrency(dream.estimatedValue, state.settings.currency)}
                      </strong>
                    </p>
                  ) : null}
                  {dream.desiredDate ? (
                    <p className="flex items-center gap-1.5 text-ink-soft">
                      <CalendarClock className="h-3.5 w-3.5 text-ink-faint" />
                      Prazo desejado:{" "}
                      <strong className="font-semibold text-ink">{formatDate(dream.desiredDate)}</strong>
                    </p>
                  ) : null}
                </div>

                <div className="mt-auto pt-4">
                  {dream.goalId ? (
                    <a
                      href={`/metas/${dream.goalId}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line px-3 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-iris hover:text-iris"
                    >
                      Ver meta vinculada →
                    </a>
                  ) : (
                    <Button
                      fullWidth
                      size="sm"
                      variant="secondary"
                      leadingIcon={<Wand2 className="h-3.5 w-3.5" />}
                      onClick={() => setConverting(dream)}
                    >
                      Transformar em meta
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de cadastro */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Editar sonho" : "Novo sonho"}
        description="Objetivos maiores da sua vida — podem não ter prazo."
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit}>{editing ? "Salvar" : "Registrar sonho"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Título do sonho" htmlFor="dream-title">
            <Input
              id="dream-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Comprar uma casa na praia"
            />
          </Field>
          <Field label="Descrição" optional htmlFor="dream-desc">
            <Textarea
              id="dream-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Como você imagina esse momento?"
            />
          </Field>
          <Field label="Link da imagem" optional hint="URL de uma foto">
            <div className="relative">
              <ImageIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <Input
                id="dream-img"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                className="pl-9"
              />
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Valor estimado" optional htmlFor="dream-value">
              <Input
                id="dream-value"
                inputMode="decimal"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field label="Prazo desejado" optional htmlFor="dream-date">
              <Input
                id="dream-date"
                type="date"
                value={desiredDate}
                onChange={(e) => setDesiredDate(e.target.value)}
              />
            </Field>
          </div>
        </div>
      </Modal>

      {/* Modal de conversão */}
      <Modal
        open={Boolean(converting)}
        onClose={() => setConverting(null)}
        title="Transformar sonho em meta"
        description={converting?.title}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConverting(null)}>
              Cancelar
            </Button>
            <Button onClick={() => converting && convertToGoal(converting)}>
              <Wand2 className="h-4 w-4" /> Criar meta
            </Button>
          </>
        }
      >
        {converting ? (
          <div className="space-y-4">
            <p className="rounded-xl bg-iris-soft px-4 py-3 text-[13px] leading-relaxed text-iris-dark">
              Vamos criar uma meta com os dados do sonho: título, descrição, valor estimado
              {converting.estimatedValue ? ` (${formatCurrency(converting.estimatedValue, state.settings.currency)})` : ""} e
              prazo desejado {converting.desiredDate ? formatDate(converting.desiredDate) : "sem prazo"}.
            </p>
            <Field label="Categoria da nova meta">
              <Select
                defaultValue={state.categories[0]?.id}
                onChange={() => undefined}
                disabled
              >
                {state.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <p className="text-[12px] text-ink-faint">
              Depois de criada, você poderá ajustar categoria, prioridade e etapas na página da meta.
            </p>
            <div className="rounded-xl border border-dashed border-line p-4">
              <p className="text-[13px] font-semibold text-ink">Ou deixe a IA decompor o sonho</p>
              <p className="mt-1 text-[12px] text-ink-faint">
                O Gemini transforma o sonho em uma meta mensurável com título e indicador.
              </p>
              <Button
                className="mt-3"
                size="sm"
                variant="secondary"
                loading={aiLoading}
                leadingIcon={<Sparkles className="h-3.5 w-3.5" />}
                onClick={() => converting && handleSuggest(converting)}
              >
                Sugerir meta com IA
              </Button>
              {aiError ? (
                <p className="mt-2 text-[12px] text-ink-faint">{aiError}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
