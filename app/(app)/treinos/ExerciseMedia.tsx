"use client";

import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Exercise } from "@/types/database";
import { PRIMARY_MUSCLE_BG } from "@/lib/workout";

type Props = {
  exercise: Pick<
    Exercise,
    | "id"
    | "name"
    | "primary_muscle"
    | "secondary_muscles"
    | "equipment"
    | "image_url"
    | "animation_url"
    | "user_id"
  >;
  /** Signed URL já resolvida (prioriza animation_url se houver). */
  signedUrl: string | null;
  /** Quando true, renderiza como mídia grande com aspect ratio 4:3. */
  full?: boolean;
  /** Variação de tamanho (apenas quando full=false). */
  size?: "sm" | "md" | "lg";
  /** Tipo de mídia preferido quando ambas existirem. */
  prefer?: "image" | "animation";
};

/**
 * Renderiza a mídia demonstrativa do exercício ou um placeholder SVG por
 * grupo muscular. Aceita `image_url` (estático) e `animation_url` (gif/vídeo).
 * Por padrão prioriza animation_url quando presente.
 *
 * Zero imagens de internet — apenas cor + iniciais ou mídia do bucket privado.
 */
export function ExerciseMedia({
  exercise,
  signedUrl,
  full = false,
  size = "md",
  prefer = "animation",
}: Props) {
  const [errored, setErrored] = useState(false);
  const showMedia = signedUrl && !errored;

  // Decide se é animação pela extensão do storage path (heurística).
  const isAnimation =
    prefer === "animation" &&
    exercise.animation_url != null &&
    /\.(gif|mp4|webm)$/i.test(exercise.animation_url);

  const bg =
    PRIMARY_MUSCLE_BG[
      exercise.primary_muscle as keyof typeof PRIMARY_MUSCLE_BG
    ] ?? PRIMARY_MUSCLE_BG.outro;

  if (showMedia && isAnimation) {
    // GIF — usa <img> para preservar loop/animação.
    return full ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={signedUrl}
        alt={exercise.name}
        onError={() => setErrored(true)}
        className="h-full w-full rounded-2xl object-cover"
      />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={signedUrl}
        alt={exercise.name}
        onError={() => setErrored(true)}
        className={cn(
          "shrink-0 rounded-2xl object-cover",
          sizeDims(size),
        )}
      />
    );
  }

  if (showMedia) {
    return full ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={signedUrl}
        alt={exercise.name}
        onError={() => setErrored(true)}
        className="h-full w-full rounded-2xl object-cover"
      />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={signedUrl}
        alt={exercise.name}
        onError={() => setErrored(true)}
        className={cn("shrink-0 rounded-2xl object-cover", sizeDims(size))}
      />
    );
  }

  const initials = exercise.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

  if (full) {
    return (
      <div
        className={cn(
          "flex aspect-[4/3] w-full items-center justify-center rounded-2xl text-white shadow-card",
          bg,
        )}
        aria-label={`${exercise.name} (sem mídia)`}
      >
        {initials ? (
          <span className="font-display text-4xl font-bold tracking-tight">
            {initials}
          </span>
        ) : (
          <Dumbbell size={48} aria-hidden="true" />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl text-white shadow-card",
        bg,
        sizeDims(size),
      )}
      aria-label={`${exercise.name} (sem foto)`}
    >
      {initials ? (
        <span className="font-display font-bold tracking-tight">{initials}</span>
      ) : (
        <Dumbbell size={size === "lg" ? 28 : 20} aria-hidden="true" />
      )}
    </div>
  );
}

function sizeDims(size: "sm" | "md" | "lg"): string {
  if (size === "sm") return "h-10 w-10 text-[14px]";
  if (size === "lg") return "h-20 w-20 text-[18px]";
  return "h-14 w-14 text-[16px]";
}

/** Wrapper legado que delega para ExerciseMedia. Mantido para compat. */
export function ExerciseImage(
  props: Omit<Props, "full" | "prefer"> & { size?: "sm" | "md" | "lg" },
) {
  return <ExerciseMedia {...props} prefer="image" />;
}
