import { TrendingDown, TrendingUp, Minus, Flame, Droplets, Heart } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Comparativo "hoje vs ontem" — mostra se a pessoa está melhor ou pior
 * em 3 indicadores diários: calorias, água e bem-estar geral.
 *
 * Sem input aqui — apenas visualização. Cada delta tem ícone
 * (cima/baixo/igual) + número + classe de cor (moss = melhorou,
 * ember = piorou, line = igual).
 */

interface YesterdayComparisonProps {
  caloriesToday: number;
  caloriesYesterday: number;
  waterTodayMl: number;
  waterYesterdayMl: number;
  wellBeingTodayPct: number | null; // 0–100
  wellBeingYesterdayPct: number | null;
}

export function YesterdayComparison({
  caloriesToday,
  caloriesYesterday,
  waterTodayMl,
  waterYesterdayMl,
  wellBeingTodayPct,
  wellBeingYesterdayPct,
}: YesterdayComparisonProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <CompareRow
        icon={Flame}
        label="Calorias"
        today={caloriesToday}
        yesterday={caloriesYesterday}
        unit="kcal"
        mode="neutral"
      />
      <CompareRow
        icon={Droplets}
        label="Água"
        today={waterTodayMl}
        yesterday={waterYesterdayMl}
        unit="ml"
        mode="up-good"
        formatValue={(n) => `${(n / 1000).toFixed(1).replace(".", ",")}L`}
      />
      <CompareRow
        icon={Heart}
        label="Bem-estar"
        today={wellBeingTodayPct ?? 0}
        yesterday={wellBeingYesterdayPct ?? 0}
        unit="%"
        mode="up-good"
        formatValue={(n) => `${Math.round(n)}%`}
        hideIfNoYesterday={wellBeingYesterdayPct == null}
      />
    </div>
  );
}

interface CompareRowProps {
  icon: typeof Flame;
  label: string;
  today: number;
  yesterday: number;
  unit: string;
  /** "up-good" = subir é bom (água, bem-estar). "down-good" = descer é bom (peso).
   *  "neutral" = sem juízo (calorias brutas). */
  mode: "up-good" | "down-good" | "neutral";
  formatValue?: (n: number) => string;
  hideIfNoYesterday?: boolean;
}

function CompareRow({
  icon: Icon,
  label,
  today,
  yesterday,
  unit,
  mode,
  formatValue,
  hideIfNoYesterday,
}: CompareRowProps) {
  const fmt = formatValue ?? ((n: number) => `${n.toLocaleString("pt-BR")} ${unit}`);
  const delta = today - yesterday;

  if (hideIfNoYesterday && yesterday === 0) {
    return (
      <div className="rounded-2xl border border-line/60 bg-surface p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-ember-soft text-ember-dark">
            <Icon size={14} aria-hidden="true" />
          </span>
          <span className="text-[12px] font-medium text-ink-soft">{label}</span>
        </div>
        <p className="text-[13px] text-ink-faint">Sem check-in de ontem.</p>
      </div>
    );
  }

  const isPositive = delta > 0;
  const isNegative = delta < 0;
  const isGood =
    mode === "neutral"
      ? null
      : mode === "up-good"
        ? isPositive
        : isNegative;

  const toneClass = (() => {
    if (!isPositive && !isNegative) return "bg-line/50 text-ink-soft";
    if (mode === "neutral") return isPositive ? "bg-ember-soft text-ember-dark" : "bg-moss-soft text-moss-dark";
    return isGood ? "bg-moss-soft text-moss-dark" : "bg-ember-soft text-ember-dark";
  })();

  const DeltaIcon = !isPositive && !isNegative ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="rounded-2xl border border-line/60 bg-surface p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-ember-soft text-ember-dark">
          <Icon size={14} aria-hidden="true" />
        </span>
        <span className="text-[12px] font-medium text-ink-soft">{label}</span>
      </div>

      <p className="font-mono text-base font-bold leading-tight text-ink">
        {fmt(today)}
      </p>
      <p className="mt-0.5 text-[11px] text-ink-faint">ontem: {fmt(yesterday)}</p>

      {yesterday > 0 || today > 0 ? (
        <span
          className={cn(
            "mt-2 inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[11px] font-semibold",
            toneClass,
          )}
        >
          <DeltaIcon size={11} aria-hidden="true" />
          {delta > 0 ? "+" : ""}
          {formatValue ? formatValue(Math.abs(delta)).replace(/^[+-]?/, "") : `${Math.abs(delta).toLocaleString("pt-BR")} ${unit}`}
          {isPositive
            ? mode === "down-good"
              ? " pior"
              : " melhor"
            : isNegative
              ? mode === "up-good"
                ? " pior"
                : " melhor"
              : ""}
        </span>
      ) : null}
    </div>
  );
}