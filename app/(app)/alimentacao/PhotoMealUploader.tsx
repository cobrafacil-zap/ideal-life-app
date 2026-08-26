"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Camera, Loader2, Sparkles } from "lucide-react";

const MEAL_TYPES = [
  { value: "cafe_da_manha", label: "Café da manhã" },
  { value: "almoco", label: "Almoço" },
  { value: "lanche", label: "Lanche" },
  { value: "jantar", label: "Jantar" },
  { value: "ceia", label: "Ceia" },
  { value: "outra", label: "Outra" },
] as const;

type Analysis = {
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  items: { name: string; quantity_g: number; calories: number }[];
};

export function PhotoMealUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mealType, setMealType] = useState<(typeof MEAL_TYPES)[number]["value"]>("almoco");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setAnalysis(null);
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) {
      setError("Use PNG, JPG ou WebP.");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setError("Arquivo maior que 8 MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      setError("Selecione uma foto primeiro.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("photo", file);
        fd.append("mealType", mealType);
        const res = await fetch("/api/meals/analyze-photo", {
          method: "POST",
          body: fd,
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error ?? "Falha ao analisar.");
        }
        setAnalysis(json.analysis);
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao enviar.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-soft">
            Foto do prato
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFileChange}
            className="block w-full text-[12px] text-ink-soft file:mr-3 file:rounded-xl file:border-0 file:bg-ember-soft file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-ember-dark hover:file:bg-ember-soft/80"
          />
          <p className="mt-1 text-[11px] text-ink-faint">
            A IA analisa a foto e estima calorias e macros. PNG/JPG/WebP até 8 MB.
          </p>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-soft">
            Tipo de refeição
          </span>
          <select
            value={mealType}
            onChange={(e) =>
              setMealType(e.target.value as (typeof MEAL_TYPES)[number]["value"])
            }
            className="block w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base"
          >
            {MEAL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Pré-visualização"
          className="h-40 w-full rounded-2xl object-cover ring-1 ring-line/60"
        />
      )}

      {error && (
        <p className="text-[12px] text-ember-dark" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        loading={isPending}
        disabled={!file}
        leadingIcon={
          isPending ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />
        }
      >
        Analisar foto com IA
      </Button>

      {analysis && (
        <div className="rounded-2xl bg-moss-soft/60 p-4 text-[13px] text-moss-dark">
          <p className="inline-flex items-center gap-1.5 font-semibold">
            <Sparkles size={14} aria-hidden="true" />
            Análise concluída — {analysis.total_calories} kcal
          </p>
          <ul className="mt-2 space-y-1">
            {analysis.items.map((it, i) => (
              <li key={i}>
                <span className="font-medium">{it.name}</span> — {it.quantity_g} g ·{" "}
                <span className="font-mono">{it.calories} kcal</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-moss-dark/80">
            A foto e a análise ficam salvas por 7 dias e depois são apagadas.
          </p>
        </div>
      )}
    </form>
  );
}
