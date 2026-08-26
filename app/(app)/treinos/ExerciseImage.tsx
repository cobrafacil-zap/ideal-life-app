"use client";

import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Exercise } from "@/types/database";
import { PRIMARY_MUSCLE_BG } from "@/lib/workout";

type Props = {
  exercise: Pick<Exercise, "name" | "primary_muscle" | "image_url" | "user_id">;
  signedUrl: string | null;
  size?: "sm" | "md" | "lg";
};

/**
 * Renderiza a imagem do exercício ou um placeholder SVG por grupo muscular.
 * Zero imagens de internet — apenas cor + ícone.
 */
export function ExerciseImage({ exercise, signedUrl, size = "md" }: Props) {
  const [errored, setErrored] = useState(false);
  const showImage = signedUrl && !errored;

  const dims =
    size === "sm" ? "h-10 w-10 text-[14px]"
    : size === "lg" ? "h-20 w-20 text-[18px]"
    : "h-14 w-14 text-[16px]";

  const bg =
    PRIMARY_MUSCLE_BG[
      exercise.primary_muscle as keyof typeof PRIMARY_MUSCLE_BG
    ] ?? PRIMARY_MUSCLE_BG.outro;

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={signedUrl}
        alt={exercise.name}
        onError={() => setErrored(true)}
        className={cn("shrink-0 rounded-2xl object-cover", dims)}
      />
    );
  }

  const initials = exercise.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl text-white shadow-card",
        bg,
        dims,
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
