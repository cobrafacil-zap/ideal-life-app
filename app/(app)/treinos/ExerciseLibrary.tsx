"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Search,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  ImagePlus,
  Loader2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { EmptyState } from "@/components/EmptyState";
import {
  PRIMARY_MUSCLE_ORDER as MUSCLE_ORDER,
  PRIMARY_MUSCLE_LABEL,
  EQUIPMENT_ORDER,
  EQUIPMENT_LABEL,
  EXERCISE_CATEGORY_LABEL,
} from "@/lib/workout";
import { matchesAny, normalizeSearch } from "@/lib/text-search";
import type {
  EquipmentKind,
  PrimaryMuscleGroup,
} from "@/types/database";
import { ExerciseImage } from "./ExerciseImage";
import {
  createExercise,
  deleteExercise,
  removeExerciseImageAction,
  updateExercise,
  uploadExerciseImageAction,
  type ExerciseListItem,
} from "./actions";
import { cn } from "@/lib/cn";

type SignedMap = Record<string, string | null>;

type Filter = "all" | "mine";

export function ExerciseLibrary({
  initialExercises,
  signedUrls,
}: {
  initialExercises: ExerciseListItem[];
  signedUrls: SignedMap;
}) {
  const [items, setItems] = useState<ExerciseListItem[]>(initialExercises);
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState<PrimaryMuscleGroup | "all">("all");
  const [equipment, setEquipment] = useState<EquipmentKind | "all">("all");
  const [scope, setScope] = useState<Filter>("all");
  const [editing, setEditing] = useState<ExerciseListItem | "new" | null>(null);

  const visible = useMemo(() => {
    const term = normalizeSearch(search);
    return items.filter((it) => {
      if (scope === "mine" && it.user_id == null) return false;
      if (muscle !== "all" && it.primary_muscle !== muscle) return false;
      if (equipment !== "all" && it.equipment !== equipment) return false;
      if (term) {
        // Busca por nome principal + aliases + equipamento + grupo
        // muscular (legado) + categoria fina (v2). Tudo case/acento
        // insensitive via matchesAny.
        const aliases = it.aliases ?? [];
        const categoryLabel = it.category
          ? EXERCISE_CATEGORY_LABEL[it.category as keyof typeof EXERCISE_CATEGORY_LABEL] ?? ""
          : "";
        const muscleLabel = PRIMARY_MUSCLE_LABEL[
          it.primary_muscle as PrimaryMuscleGroup
        ] ?? it.primary_muscle ?? "";
        const hay = [it.name, it.equipment ?? "", muscleLabel, categoryLabel, ...aliases];
        if (!hay.some((h) => matchesAny(term, [h]))) return false;
      }
      return true;
    });
  }, [items, search, muscle, equipment, scope]);

  return (
    <div className="space-y-5">
      <Filters
        search={search}
        setSearch={setSearch}
        muscle={muscle}
        setMuscle={setMuscle}
        equipment={equipment}
        setEquipment={setEquipment}
        scope={scope}
        setScope={setScope}
        onNew={() => setEditing("new")}
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={Plus}
          title={
            items.length === 0
              ? "Sua biblioteca está vazia"
              : "Nenhum exercício com esses filtros"
          }
          description={
            items.length === 0
              ? "Crie seu primeiro exercício para começar a montar planos."
              : "Ajuste busca, filtros ou escopo."
          }
          action={
            items.length === 0 ? (
              <Button onClick={() => setEditing("new")} variant="secondary">
                Criar exercício
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((ex) => (
            <li key={ex.id}>
              <ExerciseRow
                exercise={ex}
                signedUrl={signedUrls[ex.id] ?? null}
                onEdit={() => setEditing(ex)}
                onDelete={async () => {
                  if (ex.user_id == null) return;
                  if (!confirm(`Excluir "${ex.name}"?`)) return;
                  await deleteExercise(ex.id);
                  setItems((prev) => prev.filter((p) => p.id !== ex.id));
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <ExerciseEditorDialog
          target={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setItems((prev) => {
              if (editing === "new") return [saved, ...prev];
              return prev.map((p) => (p.id === saved.id ? saved : p));
            });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function Filters({
  search,
  setSearch,
  muscle,
  setMuscle,
  equipment,
  setEquipment,
  scope,
  setScope,
  onNew,
}: {
  search: string;
  setSearch: (v: string) => void;
  muscle: PrimaryMuscleGroup | "all";
  setMuscle: (v: PrimaryMuscleGroup | "all") => void;
  equipment: EquipmentKind | "all";
  setEquipment: (v: EquipmentKind | "all") => void;
  scope: Filter;
  setScope: (v: Filter) => void;
  onNew: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Pesquisar exercício…"
            aria-label="Pesquisar exercício"
            className={cn(
              "w-full rounded-pill border border-line bg-surface py-2.5 pl-9 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-base",
              search ? "pr-9" : "pr-3",
            )}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Limpar pesquisa"
              className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-soft hover:bg-base/60 hover:text-ink"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <Button
          onClick={onNew}
          variant="secondary"
          leadingIcon={<Plus size={14} />}
        >
          Novo
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(["all", "mine"] as Filter[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={cn(
              "rounded-pill border px-3 py-1.5 text-[12px] font-medium",
              scope === s
                ? "border-ember/40 bg-ember-soft text-ember-dark"
                : "border-line bg-surface text-ink-soft hover:text-ink",
            )}
          >
            {s === "all" ? "Todos" : "Meus"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <ChipRow label="Grupo muscular">
          <Chip active={muscle === "all"} onClick={() => setMuscle("all")}>
            Todos
          </Chip>
          {MUSCLE_ORDER.map((m) => (
            <Chip
              key={m}
              active={muscle === m}
              onClick={() => setMuscle(m)}
            >
              {PRIMARY_MUSCLE_LABEL[m]}
            </Chip>
          ))}
        </ChipRow>
        <ChipRow label="Equipamento">
          <Chip active={equipment === "all"} onClick={() => setEquipment("all")}>
            Todos
          </Chip>
          {EQUIPMENT_ORDER.map((e) => (
            <Chip
              key={e}
              active={equipment === e}
              onClick={() => setEquipment(e)}
            >
              {EQUIPMENT_LABEL[e]}
            </Chip>
          ))}
        </ChipRow>
      </div>
    </div>
  );
}

function ChipRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1.5 w-[110px] shrink-0 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-pill border px-2.5 py-1 text-[12px]",
        active
          ? "border-ember/40 bg-ember-soft text-ember-dark"
          : "border-line/70 bg-surface text-ink-soft hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function ExerciseRow({
  exercise,
  signedUrl,
  onEdit,
  onDelete,
}: {
  exercise: ExerciseListItem;
  signedUrl: string | null;
  onEdit: () => void;
  onDelete: () => void | Promise<void>;
}) {
  const isMine = exercise.user_id != null;
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line/60 bg-surface p-3">
      <ExerciseImage exercise={exercise} signedUrl={signedUrl} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate font-display text-sm font-semibold text-ink">
            {exercise.name}
          </p>
          {!isMine && (
            <span className="rounded-pill bg-line/60 px-1.5 py-0.5 text-[10px] font-medium text-ink-soft">
              catálogo
            </span>
          )}
        </div>
        <p className="mt-0.5 flex flex-wrap gap-1 text-[11px] text-ink-soft">
          <span>{PRIMARY_MUSCLE_LABEL[exercise.primary_muscle as PrimaryMuscleGroup]}</span>
          {exercise.equipment && (
            <>
              <span className="text-ink-faint">·</span>
              <span>{EQUIPMENT_LABEL[exercise.equipment as EquipmentKind]}</span>
            </>
          )}
        </p>
        {exercise.secondary_muscles.length > 0 && (
          <p className="mt-1 line-clamp-1 text-[11px] text-ink-faint">
            Secundários: {exercise.secondary_muscles.join(", ")}
          </p>
        )}
      </div>
      {isMine && (
        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-base/60 hover:text-ink"
            aria-label={`Editar ${exercise.name}`}
          >
            <Pencil size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-ember-soft hover:text-ember-dark"
            aria-label={`Excluir ${exercise.name}`}
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

function ExerciseEditorDialog({
  target,
  onClose,
  onSaved,
}: {
  target: ExerciseListItem | "new";
  onClose: () => void;
  onSaved: (saved: ExerciseListItem) => void;
}) {
  const isNew = target === "new";
  const initial = isNew
    ? {
        name: "",
        primary_muscle: "peito" as PrimaryMuscleGroup,
        equipment: null as EquipmentKind | null,
        secondaryCsv: "",
      }
    : {
        name: target.name,
        primary_muscle: target.primary_muscle as PrimaryMuscleGroup,
        equipment: (target.equipment as EquipmentKind | null) ?? null,
        secondaryCsv: target.secondary_muscles.join(", "),
      };

  const [name, setName] = useState(initial.name);
  const [primaryMuscle, setPrimaryMuscle] = useState<PrimaryMuscleGroup>(
    initial.primary_muscle,
  );
  const [equipment, setEquipment] = useState<EquipmentKind | "">(
    initial.equipment ?? "",
  );
  const [secondaryCsv, setSecondaryCsv] = useState(initial.secondaryCsv);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  function close() {
    onClose();
  }

  function handleSave() {
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Informe o nome do exercício.");
      return;
    }

    const secondary = secondaryCsv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    startTransition(async () => {
      try {
        const payload = {
          name: trimmed,
          primary_muscle: primaryMuscle,
          equipment: equipment === "" ? null : (equipment as EquipmentKind),
          secondary_muscles: secondary,
        };
        const savedExercise = isNew
          ? await createExercise(payload)
          : await updateExercise(target.id, payload);
        setSaved(true);
        onSaved(savedExercise);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  function handlePickImage(file: File) {
    if (isNew) {
      // Criação: imagem só após salvar (precisa do id).
      setError("Salve o exercício antes de enviar uma imagem.");
      return;
    }
    setUploadingImage(true);
    const fd = new FormData();
    fd.append("exercise_id", target.id);
    fd.append("image", file);
    uploadExerciseImageAction(fd)
      .then(() => {
        setUploadingImage(false);
        // Atualiza a pré-visualização localmente.
        const url = URL.createObjectURL(file);
        setSignedUrl(url);
      })
      .catch((err) => {
        setUploadingImage(false);
        setError(err instanceof Error ? err.message : "Erro no upload.");
      });
  }

  function handleRemoveImage() {
    if (isNew) return;
    removeExerciseImageAction(target.id)
      .then(() => {
        setSignedUrl(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erro ao remover.");
      });
  }

  const exerciseForImage = isNew
    ? {
        id: "preview",
        name: name || "Exercício",
        primary_muscle: primaryMuscle,
        secondary_muscles: [],
        equipment: null,
        image_url: null,
        animation_url: null,
        user_id: "preview",
      }
    : {
        id: target.id,
        name: target.name,
        primary_muscle: target.primary_muscle as PrimaryMuscleGroup,
        secondary_muscles: target.secondary_muscles ?? [],
        equipment: target.equipment,
        image_url: target.image_url,
        animation_url: target.animation_url ?? null,
        user_id: target.user_id,
      };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-editor-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 backdrop-blur-sm animate-fade-in sm:items-center"
      onClick={close}
    >
      <div
        className="w-full max-w-md rounded-t-card bg-base shadow-floating border border-line/60 animate-fade-up sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line/60 px-4 py-3 sm:px-6">
          <h2
            id="exercise-editor-title"
            className="font-display text-lg font-bold text-ink"
          >
            {isNew ? "Novo exercício" : "Editar exercício"}
          </h2>
          <button
            type="button"
            onClick={close}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-base/60 hover:text-ink"
            aria-label="Fechar"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <ExerciseImage
              exercise={exerciseForImage}
              signedUrl={signedUrl}
              size="lg"
            />
            {!isNew && (
              <div className="flex flex-col gap-1.5">
                <label className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-pill border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-ink-soft hover:text-ink",
                  uploadingImage && "pointer-events-none opacity-60",
                )}>
                  {uploadingImage ? (
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <ImagePlus size={14} aria-hidden="true" />
                  )}
                  {signedUrl ? "Trocar imagem" : "Enviar imagem"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePickImage(f);
                    }}
                  />
                </label>
                {signedUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-ink-soft hover:text-ember-dark"
                  >
                    <Trash2 size={12} aria-hidden="true" />
                    Remover imagem
                  </button>
                )}
              </div>
            )}
          </div>

          <TextField
            label="Nome"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            placeholder="Ex.: Supino reto"
            autoFocus
          />

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-soft">
              Grupo muscular
            </span>
            <select
              value={primaryMuscle}
              onChange={(e) => {
                setPrimaryMuscle(e.target.value as PrimaryMuscleGroup);
                setSaved(false);
              }}
              className="block w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-base"
            >
              {MUSCLE_ORDER.map((m) => (
                <option key={m} value={m}>
                  {PRIMARY_MUSCLE_LABEL[m]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-soft">
              Equipamento
            </span>
            <select
              value={equipment}
              onChange={(e) => {
                setEquipment(e.target.value as EquipmentKind | "");
                setSaved(false);
              }}
              className="block w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-base"
            >
              <option value="">Sem equipamento</option>
              {EQUIPMENT_ORDER.map((e) => (
                <option key={e} value={e}>
                  {EQUIPMENT_LABEL[e]}
                </option>
              ))}
            </select>
          </label>

          <TextField
            label="Músculos secundários (separados por vírgula)"
            value={secondaryCsv}
            onChange={(e) => {
              setSecondaryCsv(e.target.value);
              setSaved(false);
            }}
            placeholder="tríceps, deltoide anterior"
            hint="Opcional — ajuda a lembrar quais áreas o exercício ativa."
          />

          {!isNew && (
            <p className="flex items-start gap-1.5 rounded-2xl bg-base/40 p-3 text-[11px] text-ink-soft">
              <Info size={12} aria-hidden="true" className="mt-0.5 shrink-0" />
              Imagens ficam armazenadas em bucket privado — só você vê.
            </p>
          )}

          {error && (
            <p className="text-[12px] text-ember-dark" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line/60 px-4 py-3 sm:px-6">
          <Button variant="ghost" onClick={close}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            loading={isPending}
            variant={saved ? "outline" : "primary"}
            leadingIcon={saved ? <Check size={14} /> : undefined}
          >
            {saved ? "Salvo" : isNew ? "Criar exercício" : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
