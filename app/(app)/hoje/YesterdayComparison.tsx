import { TrendingDown, TrendingUp, Minus, Flame, Droplets, Heart } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { formatLiters } from "@/lib/format";

/**
 * Comparativo "HOJE × ÚLTIMO REGISTRO".
 *
 * Em vez de hardcodar ontem (que pode estar vazio), a página passa o
 * "último registro" real (data mais recente com dados em qualquer uma
 * das 3 tabelas). Para cada pilar, se a data de "last" é a mesma de hoje,
 * não há comparação; se não houver last, a seção mostra fallback.
 *
 * Render: 3 colunas com divisor vertical + linha interpretativa embaixo
 * de cada pilar (ex.: "Seu bem-estar está 13 pontos abaixo do último
 * registro.").
 */

interface YesterdayComparisonProps {
  /** Data do último registro considerado (string ISO YYYY-MM-DD). null = sem histórico. */
  lastRecordDate: string | null;
  caloriesToday: number;
  caloriesLast: number;
  waterTodayMl: number;
  waterLastMl: number;
  wellbeingTodayPct: number | null;
  wellbeingLastPct: number | null;
}

export function YesterdayComparison({
  lastRecordDate,
  caloriesToday,
  caloriesLast,
  waterTodayMl,
  waterLastMl,
  wellbeingTodayPct,
  wellbeingLastPct,
}: YesterdayComparisonProps) {
  // Se não há nenhum registro anterior com dados, esconde o card inteiro.
  const hasAnyLast =
    caloriesLast > 0 || waterLastMl > 0 || wellbeingLastPct != null;
  if (!lastRecordDate || !hasAnyLast) return null;

  // Texto curto pra rotular "último registro".
  const lastLabel = formatLastLabel(lastRecordDate);

  return (
    <Card>
      <CardHeader
        title="Hoje × último registro"
        description={`Comparado a ${lastLabel}.`}
      />

      <div className="grid grid-cols-1 divide-y divide-line/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <CompareSection
          icon={Flame}
          label="Calorias"
          today={caloriesToday}
          last={caloriesLast}
          formatValue={(n) => `${n.toLocaleString("pt-BR")} kcal`}
          mode="neutral"
        />
        <CompareSection
          icon={Droplets}
          label="Água"
          today={waterTodayMl}
          last={waterLastMl}
          formatValue={formatLiters}
          mode="up-good"
        />
        <CompareSection
          icon={Heart}
          label="Bem-estar"
          today={wellbeingTodayPct ?? 0}
          last={wellbeingLastPct ?? 0}
          formatValue={(n) => `${Math.round(n)}%`}
          mode="up-good"
          renderInterpretation={
            wellbeingTodayPct != null && wellbeingLastPct != null
              ? wellbeingTodayPct >= wellbeingLastPct
                ? `Seu bem-estar está ${Math.round(wellbeingTodayPct - wellbeingLastPct)} ponto(s) acima do último registro.`
                : `Seu bem-estar está ${Math.round(wellbeingLastPct - wellbeingTodayPct)} ponto(s) abaixo do último registro.`
              : undefined
          }
        />
      </div>
    </Card>
  );
}

function formatLastLabel(dateISO: string): string {
  const d = new Date(dateISO);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays <= 0) return "hoje";
  if (diffDays === 1) return "ontem";
  if (diffDays < 7) return `${diffDays} dias atrás`;
  return dateISO;
}

interface CompareSectionProps {
  icon: typeof Flame;
  label: string;
  today: number;
  last: number;
  mode: "up-good" | "down-good" | "neutral";
  formatValue: (n: number) => string;
  /** Texto interpretativo opcional embaixo do delta. */
  renderInterpretation?: string;
}

function CompareSection({
  icon: Icon,
  label,
  today,
  last,
  mode,
  formatValue,
  renderInterpretation,
}: CompareSectionProps) {
  const delta = today - last;
  const isPositive = delta > 0;
  const isNegative = delta < 0;
  const isGood =
    mode === "neutral" ? null : mode === "up-good" ? isPositive : isNegative;

  const toneClass = (() => {
    if (!isPositive && !isNegative) return "bg-line/50 text-ink-soft";
    if (mode === "neutral")
      return isPositive ? "bg-ember-soft text-ember-dark" : "bg-moss-soft text-moss-dark";
    return isGood ? "bg-moss-soft text-moss-dark" : "bg-ember-soft text-ember-dark";
  })();

  const DeltaIcon = !isPositive && !isNegative ? Minus : isPositive ? TrendingUp : TrendingDown;

  const interpretation = (() => {
    if (renderInterpretation) return renderInterpretation;
    if (mode === "neutral" && (isPositive || isNegative)) {
      return `${isPositive ? "Você comeu mais" : "Você comeu menos"} que no último registro.`;
    }
    if (isPositive && mode === "up-good") {
      return `Você ${label === "Água" ? "bebeu mais" : "está melhor"} que no último registro.`;
    }
    if (isNegative && mode === "up-good") {
      return `Você ${label === "Água" ? "bebeu menos" : "está pior"} que no último registro.`;
    }
    return null;
  })();

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
        último: {formatValue(last)}
      </p>

      <span
        className={cn(
          "mt-2 inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[11px] font-semibold",
          toneClass,
        )}
      >
        <DeltaIcon size={11} aria-hidden="true" />
        {delta > 0 ? "+" : ""}
        {formatValue(Math.abs(delta))}
      </span>

      {interpretation && (
        <p className="mt-2 text-[12px] leading-snug text-ink-soft">
          {interpretation}
        </p>
      )}
    </div>
  );
}
