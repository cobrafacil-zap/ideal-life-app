"use client";

type DemonstrationType = "gif" | "video" | "image";

type Props = {
  src: string;
  type: DemonstrationType;
  alt: string;
  /** Classes do wrapper (ex.: "h-20 w-20 shrink-0"). */
  className?: string;
  /** Classes do elemento de mídia. */
  mediaClassName?: string;
  /**
   * "contain" preserva o enquadramento inteiro do movimento (padrão).
   * "cover" preenche o container cortando as bordas — use só em thumbnails.
   */
  fit?: "contain" | "cover";
  /** Proporção fixa do container (ex.: "aspect-square"). */
  aspect?: string;
};

/**
 * Renderiza a demonstração visual de um exercício (GIF/vídeo/imagem) em loop.
 *
 * Requisitos atendidos:
 *  - loop automático (`loop` no vídeo; GIFs sempre repetem)
 *  - sem áudio (`muted` obrigatório — autoplay sem gesto seria bloqueado)
 *  - `playsInline` para não abrir o player nativo no iOS
 *  - enquadramento completo por padrão (`object-contain`): nada do
 *    movimento é cortado, em desktop ou mobile
 *
 * Retorna `null` quando `src` é vazio, permitindo renderização condicional
 * elegante no caller.
 */
export function DemonstrationMedia({
  src,
  type,
  alt,
  className,
  mediaClassName,
  fit = "contain",
  aspect,
}: Props) {
  if (!src) return null;

  const wrapperClasses = [
    "relative overflow-hidden rounded-card border border-line bg-base",
    aspect ?? "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const objectFit = fit === "cover" ? "object-cover" : "object-contain";
  const mediaClasses = [
    "h-full w-full",
    objectFit,
    mediaClassName ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  if (type === "video") {
    return (
      <div className={wrapperClasses}>
        <video
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          aria-label={alt}
          className={mediaClasses}
        />
      </div>
    );
  }

  // GIF e imagem usam <img>. GIFs animam em loop nativamente.
  return (
    <div className={wrapperClasses}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        aria-label={alt}
        className={mediaClasses}
      />
    </div>
  );
}
