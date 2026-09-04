"use client";

import { useCallback, useState } from "react";
import { ExerciseMedia } from "@/app/(app)/treinos/ExerciseMedia";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import type { Exercise } from "@/types/database";

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
  signedUrl: string | null;
  full?: boolean;
  size?: "sm" | "md" | "lg";
  prefer?: "image" | "animation";
  /** Quando true, abrir a imagem amplia via lightbox. Default true. */
  zoomable?: boolean;
};

/**
 * Wrapper cliente que combina `ExerciseMedia` com `ImageLightbox`.
 *
 * Por padrão a imagem é clicável e abre em tela cheia (UX pedida para
 * identificar aparelho/execução). Se o exercício não tem imagem
 * (signedUrl nulo), o wrapper vira pass-through e delega ao
 * `ExerciseMedia`, que cai no placeholder SVG.
 *
 * Use `zoomable={false}` em locais onde a imagem é puramente decorativa.
 */
export function ZoomableMedia({
  exercise,
  signedUrl,
  full,
  size,
  prefer,
  zoomable = true,
}: Props) {
  const [open, setOpen] = useState(false);

  const handleActivate = useCallback(() => {
    if (signedUrl) setOpen(true);
  }, [signedUrl]);

  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <ExerciseMedia
        exercise={exercise}
        signedUrl={signedUrl}
        full={full}
        size={size}
        prefer={prefer}
        zoomable={zoomable}
        onActivate={zoomable ? handleActivate : undefined}
      />
      <ImageLightbox
        src={signedUrl ?? ""}
        alt={exercise.name}
        caption={exercise.name}
        open={open}
        onClose={handleClose}
      />
    </>
  );
}
