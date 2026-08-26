import { cn } from "@/lib/cn";
import { TrendingDown, TrendingUp, Minus, type LucideIcon } from "lucide-react";

export type TrendTone =
  | "good" // moss = bom (default se mode bater)
  | "bad" // ember = ruim
  | "neutral" // line = neutro (delta zero / sem juízo)
  | "gold" // gold-soft / gold-dark — destaque neutro positivo
  | "rose" // rose-soft / rose-dark — destaque negativo/delicado
  | "lilac"; // lilac-soft / lilac-dark — destaque alternativo

export interface TrendProps {
  /** Delta numérico. Ex.: -0.4 (perda = bom em modo "down-good"). */
  value: number;
  /** Rótulo descritivo (ex.: "vs. último check-in"). */
  label: string;
  /** "down-good" = perder/subtrair é positivo (default). "up-good" = crescer é positivo. */
  mode?: "down-good" | "up-good";
  /** Formato do número. Default: `${n>0?'+':''}${n.toFixed(1)} kg`. */
  formatter?: (n: number) => string;
  size?: "sm" | "md";
  /** Cor fixa do pill (sobrescreve o cálculo baseado em mode).
   *  Útil quando o juízo de "bom/ruim" já vem de fora ou é neutro. */
  tone?: TrendTone;
  /** Ícone customizado (default: TrendingUp/Down/Minus conforme sinal). */
  icon?: LucideIcon;
  className?: string;
}

/**
 * Pill de variação reutilizável. Mostra ícone (cima/baixo/igual) + delta + rótulo,
 * colorido segundo `mode` (moss = bom, ember = ruim, line = neutro) ou
 * `tone` (quando passado, tem precedência).
 */
export function Trend({
  value,
  label,
  mode = "down-good",
  formatter,
  size = "md",
  tone,
  icon,
  className,
}: TrendProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isGood = mode === "down-good" ? isNegative : isPositive;

  const formatNum =
    formatter ??
    ((n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)} kg`);

  const resolvedTone: TrendTone = (() => {
    if (tone) return tone;
    if (!isPositive && !isNegative) return "neutral";
    return isGood ? "good" : "bad";
  })();

  const toneClass = (() => {
    switch (resolvedTone) {
      case "good":
        return "bg-moss-soft text-moss-dark";
      case "bad":
        return "bg-ember-soft text-ember-dark";
      case "neutral":
        return "bg-line/50 text-ink-soft";
      case "gold":
        return "bg-gold-soft text-gold-dark";
      case "rose":
        return "bg-rose-soft text-rose-dark";
      case "lilac":
        return "bg-lilac-soft text-lilac-dark";
    }
  })();

  const Icon = icon ?? (isPositive ? TrendingUp : isNegative ? TrendingDown : Minus);
  const iconSize = size === "sm" ? 12 : 14;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill font-semibold",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-[12px]",
        toneClass,
        className,
      )}
    >
      <Icon size={iconSize} aria-hidden="true" />
      <span>{formatNum(value)}</span>
      <span className="font-normal opacity-80">{label}</span>
    </span>
  );
}
