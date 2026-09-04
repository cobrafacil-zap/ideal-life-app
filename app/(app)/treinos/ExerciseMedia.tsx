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
  /** Quando true, a imagem vira um botão que chama `onActivate` ao clicar. */
  zoomable?: boolean;
  /** Recebido apenas quando `zoomable=true` e o usuário clica na imagem. */
  onActivate?: () => void;
};

/**
 * Renderiza a mídia demonstrativa do exercício ou um placeholder SVG por
 * grupo muscular. Aceita `image_url` (estático) e `animation_url` (gif/vídeo).
 * Por padrão prioriza animation_url quando presente.
 *
 * Quando `zoomable` é true e o exercício tem imagem, o conteúdo vira um
 * `<button>` que dispara `onActivate` — o caller (geralmente `ZoomableMedia`)
 * cuida do lightbox. Placeholder SVG não é clicável.
 */
export function ExerciseMedia({
  exercise,
  signedUrl,
  full = false,
  size = "md",
  prefer = "animation",
  zoomable = false,
  onActivate,
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

  const activate = zoomable && showMedia ? onActivate : undefined;

  const commonImgProps = {
    src: signedUrl ?? undefined,
    alt: exercise.name,
    onError: () => setErrored(true),
  };

  if (showMedia && isAnimation) {
    return full ? (
      <MediaWrap onClick={activate} ariaLabel={`Ampliar imagem de ${exercise.name}`} full>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img {...commonImgProps} className="h-full w-full rounded-2xl object-cover" />
      </MediaWrap>
    ) : (
      <MediaWrap onClick={activate} ariaLabel={`Ampliar imagem de ${exercise.name}`} size={size}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img {...commonImgProps} className={cn("shrink-0 rounded-2xl object-cover", sizeDims(size))} />
      </MediaWrap>
    );
  }

  if (showMedia) {
    return full ? (
      <MediaWrap onClick={activate} ariaLabel={`Ampliar imagem de ${exercise.name}`} full>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img {...commonImgProps} className="h-full w-full rounded-2xl object-cover" />
      </MediaWrap>
    ) : (
      <MediaWrap onClick={activate} ariaLabel={`Ampliar imagem de ${exercise.name}`} size={size}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img {...commonImgProps} className={cn("shrink-0 rounded-2xl object-cover", sizeDims(size))} />
      </MediaWrap>
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

/**
 * Wrap que vira `<button>` quando recebe onClick (modo zoomable) ou
 * `<div>` pass-through caso contrário. Mantém as dimensões/espaçamento
 * idênticos para os dois casos.
 */
function MediaWrap({
  children,
  onClick,
  ariaLabel,
  full,
  size,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  full?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  if (onClick) {
    const className = full
      ? "block w-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-base"
      : cn(
          "block shrink-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-base",
          size ? sizeDims(size) : "",
        );
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={className}
      >
        {children}
      </button>
    );
  }
  if (full) return <div className="w-full">{children}</div>;
  return <div className={cn("shrink-0", size ? sizeDims(size) : "")}>{children}</div>;
}

/** Wrapper legado que delega para ExerciseMedia. Mantido para compat. */
export function ExerciseImage(
  props: Omit<Props, "full" | "prefer" | "zoomable" | "onActivate"> & {
    size?: "sm" | "md" | "lg";
    zoomable?: boolean;
    onActivate?: () => void;
  },
) {
  return (
    <ExerciseMedia
      {...props}
      prefer="image"
      zoomable={props.zoomable ?? false}
      onActivate={props.onActivate}
    />
  );
}
