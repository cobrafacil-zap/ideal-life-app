"use client";

import { useEffect, useRef, useState } from "react";
import { X, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ZoomableMedia } from "@/components/ui/ZoomableMedia";
import type { Exercise } from "@/types/database";
import { cn } from "@/lib/cn";

type ExerciseForDetail = Pick<
  Exercise,
  | "id"
  | "name"
  | "primary_muscle"
  | "secondary_muscles"
  | "equipment"
  | "image_url"
  | "animation_url"
  | "demonstration_url"
  | "demonstration_type"
  | "instructions"
  | "common_mistakes"
  | "user_id"
>;

type Props = {
  exercise: ExerciseForDetail;
  signedUrl: string | null;
  onClose: () => void;
  onAdd: (exercise: ExerciseForDetail) => void;
  isSelected: boolean;
};

/**
 * Modal de detalhes do exercício.
 * Mostra a demonstração visual em destaque (GIF/vídeo em loop),
 * informações do exercício e botão para adicionar ao treino.
 */
export function ExerciseDetailModal({
  exercise,
  signedUrl,
  onClose,
  onAdd,
  isSelected,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // Fechar com ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Tocar/pausar vídeo
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const hasDemonstration = exercise.demonstration_url != null;
  const isVideo = exercise.demonstration_type === "video";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-detail-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 backdrop-blur-sm animate-fade-in sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-t-card bg-base shadow-floating animate-fade-up sm:rounded-card max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line/60 px-4 py-3 sm:px-6">
          <h2
            id="exercise-detail-title"
            className="font-display text-lg font-bold text-ink line-clamp-1"
          >
            {exercise.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-base/60 hover:text-ink"
            aria-label="Fechar"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Demonstração visual */}
        <div className="px-4 pt-4 sm:px-6">
          {hasDemonstration ? (
            <div className="relative overflow-hidden rounded-2xl bg-ink">
              {isVideo ? (
                <>
                  <video
                    ref={videoRef}
                    src={exercise.demonstration_url!}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="aspect-video w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink/60 text-white backdrop-blur-sm hover:bg-ink/80"
                    aria-label={isPlaying ? "Pausar" : "Reproduzir"}
                  >
                    {isPlaying ? (
                      <Pause size={18} aria-hidden="true" />
                    ) : (
                      <Play size={18} aria-hidden="true" />
                    )}
                  </button>
                </>
              ) : (
                <img
                  src={exercise.demonstration_url!}
                  alt={`Demonstração de ${exercise.name}`}
                  className="aspect-video w-full object-cover"
                />
              )}
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-line/30">
              <div className="text-center">
                <ZoomableMedia
                  exercise={exercise}
                  signedUrl={signedUrl}
                  size="lg"
                />
                <p className="mt-2 text-[12px] text-ink-faint">
                  Demonstração em breve
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="space-y-4 px-4 py-4 sm:px-6">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-ember-soft px-3 py-1 text-[12px] font-medium text-ember-dark">
              {exercise.primary_muscle}
            </span>
            {exercise.equipment && (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-moss-soft px-3 py-1 text-[12px] font-medium text-moss-dark">
                {exercise.equipment}
              </span>
            )}
          </div>

          {/* Instruções */}
          {exercise.instructions && (
            <div>
              <h3 className="mb-1.5 text-[13px] font-semibold text-ink">
                Como executar
              </h3>
              <p className="text-[13px] leading-relaxed text-ink-soft">
                {exercise.instructions}
              </p>
            </div>
          )}

          {/* Erros comuns */}
          {exercise.common_mistakes && (
            <div>
              <h3 className="mb-1.5 text-[13px] font-semibold text-ink">
                Erros comuns
              </h3>
              <p className="text-[13px] leading-relaxed text-ink-soft">
                {exercise.common_mistakes}
              </p>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="border-t border-line/60 px-4 py-4 sm:px-6">
          <Button
            onClick={() => onAdd(exercise)}
            variant={isSelected ? "secondary" : "primary"}
            fullWidth
            leadingIcon={
              isSelected ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                <Plus size={16} aria-hidden="true" />
              )
            }
          >
            {isSelected ? "Adicionado" : "Adicionar ao treino"}
          </Button>
        </div>
      </div>
    </div>
  );
}
