import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import { Heart } from "lucide-react";
import { WellBeingRing } from "@/components/home/WellBeingRing";
import { Trend } from "@/components/Trend";
import { Card, CardHeader } from "@/components/ui/Card";
import { nowInBR } from "@/lib/datetime";
import { cn } from "@/lib/cn";

/**
 * Card de bem-estar — usa o `WellBeingRing` (que estava órfão) como
 * protagonista. Mostra a média de hoje + delta vs último check-in anterior.
 *
 * Se o usuário ainda não fez check-in hoje, oferece um CTA em vez de mostrar
 * ring vazio.
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

  const daysSinceLast = lastCheckinDate
    ? differenceInCalendarDays(nowInBR(), new Date(lastCheckinDate))
    : null;

  const compareLabel =
    daysSinceLast == null
      ? "sem check-in anterior"
      : daysSinceLast === 0
        ? "hoje"
        : daysSinceLast === 1
          ? "ontem"
          : `${daysSinceLast} dias atrás`;

  return (
    <Card>
      <CardHeader
        title="Como você está hoje?"
        description="Energia, humor e disposição em um único número."
      />

      <div className="flex items-center gap-5">
        <div className="shrink-0">
          <WellBeingRing
            value={todayAvg ?? 0}
            size={120}
            label="bem-estar hoje"
          />
        </div>

        <div className="min-w-0 flex-1">
          {todayAvg == null ? (
            <>
              <p className="text-[13px] leading-relaxed text-ink-soft">
                Você ainda não fez o check-in de hoje.
              </p>
              <Link
                href="/saude"
                className={cn(
                  "mt-3 inline-flex items-center gap-2 rounded-pill px-4 py-2",
                  "bg-ember text-white text-[13px] font-semibold",
                  "hover:bg-ember-dark transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base",
                )}
              >
                Fazer check-in
                <span aria-hidden="true">→</span>
              </Link>
            </>
          ) : (
            <>
              <p className="font-display text-2xl font-semibold leading-tight text-ink">
                {todayPct}%
                <span className="ml-2 text-[13px] font-normal text-ink-soft">
                  bem-estar hoje
                </span>
              </p>
              {deltaPp != null && lastPct != null ? (
                <div className="mt-2">
                  <Trend
                    value={deltaPp}
                    label={`vs. ${compareLabel} (${lastPct}%)`}
                    mode="up-good"
                    formatter={(n) =>
                      `${n > 0 ? "+" : ""}${Math.round(n)} pp`
                    }
                    size="sm"
                  />
                </div>
              ) : (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-ink-faint">
                  <Heart size={12} className="text-ember" aria-hidden="true" />
                  Primeiro check-in — referência para os próximos.
                </p>
              )}
              <Link
                href="/saude"
                className="mt-4 inline-block text-[12px] font-medium text-ink-soft underline-offset-4 hover:text-ember hover:underline"
              >
                Ver detalhes em /saude →
              </Link>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
