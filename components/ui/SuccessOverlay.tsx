"use client";

import { useEffect } from "react";
import { cn } from "@/lib/cn";

/**
 * Overlay de sucesso animado — usado ao salvar/excluir algo no app.
 *
 * Renderiza um card centralizado com check SVG (path animado via
 * stroke-dasharray + animate-check-stroke do tailwind.config.ts).
 *
 * Props:
 * - open: se true, mostra o overlay e dispara o auto-fechamento.
 * - onDone: chamada após o timer interno completar (auto-fecha).
 * - title: texto principal ("Salvo com sucesso", "Treino finalizado").
 * - description: opcional, linha secundária abaixo do título.
 *
 * Acessibilidade:
 * - role="status" + aria-live="polite" → leitor de tela anuncia o título.
 * - Fechável com Esc.
 */
export function SuccessOverlay({
  open,
  onDone,
  title,
  description,
}: {
  open: boolean;
  onDone: () => void;
  title: string;
  description?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
  }, [open, onDone]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDone();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDone]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "flex max-w-xs flex-col items-center gap-2 rounded-3xl bg-surface px-8 py-7 shadow-floating animate-fade-up",
        )}
      >
        <svg
          viewBox="0 0 24 24"
          width="48"
          height="48"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-moss animate-check-stroke"
          strokeDasharray="26"
          aria-hidden="true"
        >
          <path d="M5 12l4 4 10-10" />
        </svg>
        <p className="font-display text-base font-bold text-ink">{title}</p>
        {description && (
          <p className="text-center text-[12px] text-ink-soft">{description}</p>
        )}
      </div>
    </div>
  );
}
