"use client";

import { useCallback, useEffect } from "react";
import { X } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  caption?: string | null;
  open: boolean;
  onClose: () => void;
};

/**
 * Lightbox acessível para ampliar a imagem de um exercício.
 *
 * - `role="dialog"` + `aria-modal` + `aria-label`.
 * - Fecha com clique no overlay, tecla Esc, ou botão X.
 * - Lock de scroll do body enquanto aberto (com fallback para iOS).
 * - Usa `<img>` direto (não `next/image`) para aceitar URLs externas
 *   sem precisar mexer em `next.config.js`.
 * - Animação fade-in (overlay) + fade-up (imagem) reutilizando os
 *   tokens do design system.
 */
export function ImageLightbox({ src, alt, caption, open, onClose }: Props) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, handleKey]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm animate-fade-in"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-base/90 text-ink shadow-floating hover:bg-base"
      >
        <X size={18} aria-hidden="true" />
      </button>

      <figure
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] max-w-[92vw] flex-col items-center gap-3 animate-fade-up"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-floating"
        />
        {(caption ?? alt) && (
          <figcaption className="rounded-pill bg-base/90 px-3 py-1.5 text-[12px] font-medium text-ink shadow-card">
            {caption ?? alt}
          </figcaption>
        )}
      </figure>
    </div>
  );
}
