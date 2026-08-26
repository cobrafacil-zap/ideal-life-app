import Link from "next/link";
import { Heart } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Trend } from "@/components/Trend";
import { cn } from "@/lib/cn";

/**
 * Card de bem-estar — versão compacta. Apenas 1 indicador (a %), sem
 * redundância com o DaySummaryPanel.
 *
 * Mostra a média de hoje + delta vs último check-in (quando existe). Sem
 * check-in → CTA explícito. Sem ring aqui — o DaySummaryPanel já mostra
 * o ring geral.
 */

interface WellBeingCardProps {
  /** Média 0–10 do check-in de hoje, ou null se ainda não fez. */
  todayAvg: number | null;
  /** Média 0–10 do último check-in anterior (pode ser null). */
  lastAvg: number | null;
  /** Data do último check-in, usada pra rotular o delta. */
  lastCheckinDate: string | null;
}

export function WellBeingCard({
  todayAvg,
  lastAvg,
  lastCheckinDate,
}: WellBeingCardProps) {
  const todayPct = todayAvg != null ? Math.round(todayAvg * 10) : null;
  const lastPct = lastAvg != null ? Math.round(lastAvg * 10) : null;
  const deltaPp =
    todayAvg != null && lastAvg != null
      ? Math.round((todayAvg - lastAvg) * 10)
      : null;

  const compareLabel = (() => {
    if (!lastCheckinDate) return "sem check-in anterior";
    const d = new Date(lastCheckinDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return "hoje (manhã)";
    if (diffDays === 1) return "ontem";
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return lastCheckinDate;
  })();

  return (
    <Card>
      <CardHeader
        title="Bem-estar de hoje"
        description="Média de energia, humor e disposição."
      />

      {todayAvg == null ? (
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-ember-soft text-ember">
            <Heart size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink">
              Você ainda não fez o check-in de hoje.
            </p>
            <Link
              href="/saude"
              className={cn(
                "mt-1 inline-block text-[12px] font-medium text-ember underline-offset-4 hover:underline",
              )}
            >
              Fazer agora →
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="font-display text-4xl font-bold leading-none tabular-nums text-ink">
              {todayPct}%
            </p>
            <p className="mt-2 text-[12px] text-ink-soft">
              Energia · humor · disposição
            </p>
          </div>
          {deltaPp != null && lastPct != null ? (
            <Trend
              value={deltaPp}
              label={`vs. ${compareLabel} (${lastPct}%)`}
              mode="up-good"
              formatter={(n) =>
                `${n > 0 ? "+" : ""}${Math.round(n)} pp`
              }
              size="sm"
            />
          ) : (
            <span className="text-[11px] text-ink-faint">Primeiro check-in</span>
          )}
        </div>
      )}
    </Card>
  );
}
