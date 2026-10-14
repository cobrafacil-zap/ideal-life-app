"use client";

type DemonstrationType = "gif" | "video" | "image";

type Props = {
  src: string;
  type: DemonstrationType;
  alt: string;
  className?: string;
};

/**
 * Componente que renderiza a demonstração visual de um exercício
 * (GIF, vídeo ou imagem estática) em loop, com acessibilidade e
 * responsividade.
 *
 * - GIFs: <img> com loading="lazy" e decoding="async"
 * - Vídeos: <video> com autoPlay, muted, loop, playsInline
 * - Imagens: <img> como fallback
 *
 * Retorna `null` quando `src` é vazio, permitindo renderização
 * condicional elegante no caller.
 *
 * As classes de design system (`bg-base`, `rounded-card`, `border-line`)
 * garantem consistência visual com o restante do app.
 */
export function DemonstrationMedia({ src, type, alt, className }: Props) {
  if (!src) return null;

  const wrapperClasses =
    "overflow-hidden rounded-card border border-line bg-base";

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
          className={`h-full w-full object-cover ${className ?? ""}`}
        />
      </div>
    );
  }

  if (type === "gif") {
    return (
      <div className={wrapperClasses}>
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          draggable={false}
          aria-label={alt}
          className={`h-full w-full object-cover ${className ?? ""}`}
        />
      </div>
    );
  }

  // Fallback: image
  return (
    <div className={wrapperClasses}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        aria-label={alt}
        className={`h-full w-full object-cover ${className ?? ""}`}
      />
    </div>
  );
}
