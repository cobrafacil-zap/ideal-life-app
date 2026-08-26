import { cn } from "@/lib/cn";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

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
  className?: string;
}

/**
 * Pill de variação reutilizável. Mostra ícone (cima/baixo/igual) + delta + rótulo,
 * colorido segundo `mode` (moss = bom, ember = ruim, line = neutro).
 */
export function Trend({
  value,
  label,
  mode = "down-good",
  formatter,
  size = "md",
  className,
}: TrendProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isGood = mode === "down-good" ? isNegative : isPositive;

  const formatNum =
    formatter ??
    ((n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)} kg`);

  const toneClass = (() => {
    if (!isPositive && !isNegative) return "bg-line/50 text-ink-soft";
    return isGood ? "bg-moss-soft text-moss-dark" : "bg-ember-soft text-ember-dark";
  })();

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
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