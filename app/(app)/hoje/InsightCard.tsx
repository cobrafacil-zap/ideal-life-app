import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { Insight } from "@/lib/insights";

/**
 * "Insight do dia" — card discreto com interpretação dos dados.
 *
 * Quando `insight` é null (nenhuma regra casou), cai num fallback com a
 * frase motivacional estática do `phraseForDate`. Mantém o card sempre
 * presente para não quebrar a hierarquia visual da Home.
 */

interface InsightCardProps {
  insight: Insight | null;
  /** Frase estática de fallback quando não há insight dinâmico. */
  fallbackPhrase: string;
}

const TONE_BORDER: Record<NonNullable<Insight["tone"]>, string> = {
  good: "border-moss/30 bg-moss-soft/30",
  bad: "border-ember/30 bg-ember-soft/30",
  neutral: "border-line/60 bg-base/40",
  gold: "border-gold/30 bg-gold-soft/30",
};

const TONE_LABEL: Record<NonNullable<Insight["tone"]>, string> = {
  good: "Bom sinal",
  bad: "Atenção",
  neutral: "Insight",
  gold: "Quase lá",
};

export function InsightCard({ insight, fallbackPhrase }: InsightCardProps) {
  const tone = insight?.tone ?? "neutral";

  return (
    <Card
      variant="ghost"
      padded={false}
      className={cn(
        "border bg-base/40 px-5 py-4",
        TONE_BORDER[tone],
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
            tone === "good"
              ? "bg-moss-soft text-moss-dark"
              : tone === "bad"
                ? "bg-ember-soft text-ember-dark"
                : tone === "gold"
                  ? "bg-gold-soft text-gold-dark"
                  : "bg-base text-ink-soft",
          )}
        >
          <Sparkles size={15} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
            {insight ? TONE_LABEL[insight.tone] : "Insight"}
          </p>
          <p className="mt-0.5 font-display text-[15px] font-semibold leading-snug text-ink">
            {insight?.title ?? fallbackPhrase}
          </p>
          {insight?.body && (
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
              {insight.body}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
