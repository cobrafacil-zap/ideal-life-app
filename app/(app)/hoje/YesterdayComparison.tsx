import { TrendingDown, TrendingUp, Minus, Flame, Droplets, Heart } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

/**
 * Comparativo "hoje vs ontem" — versão editorial.
 *
 * Em vez de 3 cards em grid (que era mais "tile de IA"), agora é um card
 * único com 3 seções separadas por divisor vertical. Lê como uma linha de
 * jornal: "Calorias | Água | Bem-estar" cada uma com seu delta.
 *
 * Sem input aqui — apenas visualização. Cada delta tem ícone
 * (cima/baixo/igual) + número + classe de cor (moss = melhorou,
 * ember = piorou, gold = neutro).
 */

interface YesterdayComparisonProps {
  caloriesToday: number;
  caloriesYesterday: number;
  waterTodayMl: number;
  waterYesterdayMl: number;
  wellBeingTodayPct: number | null;
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
    <Card>
      <CardHeader
        title="Hoje vs. ontem"
        description="Se você está melhor ou pior em cada pilar."
      />

      <div className="grid grid-cols-1 divide-y divide-line/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <CompareSection
          icon={Flame}
          label="Calorias"
          today={caloriesToday}
          yesterday={caloriesYesterday}
          formatValue={(n) => `${n.toLocaleString("pt-BR")} kcal`}
          mode="neutral"
        />
        <CompareSection
          icon={Droplets}
          label="Água"
          today={waterTodayMl}
          yesterday={waterYesterdayMl}
          formatValue={(n) => `${(n / 1000).toFixed(1).replace(".", ",")} L`}
          mode="up-good"
        />
        <CompareSection
          icon={Heart}
          label="Bem-estar"
          today={wellBeingTodayPct ?? 0}
          yesterday={wellBeingYesterdayPct ?? 0}
          formatValue={(n) => `${Math.round(n)}%`}
          mode="up-good"
          hideIfNoYesterday={wellBeingYesterdayPct == null}
        />
      </div>
    </Card>
  );
}

interface CompareSectionProps {
  icon: typeof Flame;
  label: string;
  today: number;
  yesterday: number;
  mode: "up-good" | "down-good" | "neutral";
  formatValue: (n: number) => string;
  hideIfNoYesterday?: boolean;
}

function CompareSection({
  icon: Icon,
  label,
  today,
  yesterday,
  mode,
  formatValue,
  hideIfNoYesterday,
}: CompareSectionProps) {
  const delta = today - yesterday;
  const isPositive = delta > 0;
  const isNegative = delta < 0;
  const isGood =
    mode === "neutral" ? null : mode === "up-good" ? isPositive : isNegative;

  if (hideIfNoYesterday && yesterday === 0) {
    return (
      <div className="py-4 sm:px-6 sm:py-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-ember-soft text-ember-dark">
            <Icon size={14} aria-hidden="true" />
          </span>
          <span className="text-[12px] font-medium text-ink-soft">{label}</span>
        </div>
        <p className="mt-2 text-[12px] text-ink-faint">
          Sem registro de ontem.
        </p>
      </div>
    );
  }

  const toneClass = (() => {
    if (!isPositive && !isNegative) return "bg-line/50 text-ink-soft";
    if (mode === "neutral") return isPositive ? "bg-ember-soft text-ember-dark" : "bg-moss-soft text-moss-dark";
    return isGood ? "bg-moss-soft text-moss-dark" : "bg-ember-soft text-ember-dark";
  })();

  const DeltaIcon = !isPositive && !isNegative ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="py-4 sm:px-6 sm:py-2">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-ember-soft text-ember-dark">
          <Icon size={14} aria-hidden="true" />
        </span>
        <span className="text-[12px] font-medium text-ink-soft">{label}</span>
      </div>

      <p className="mt-2 font-display text-xl font-semibold leading-tight text-ink tabular-nums">
        {formatValue(today)}
      </p>
      <p className="mt-0.5 text-[11px] text-ink-faint">
        ontem: {formatValue(yesterday)}
      </p>

      {yesterday > 0 || today > 0 ? (
        <span
          className={cn(
            "mt-2 inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[11px] font-semibold",
            toneClass,
          )}
        >
          <DeltaIcon size={11} aria-hidden="true" />
          {delta > 0 ? "+" : ""}
          {formatValue(Math.abs(delta))}
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
