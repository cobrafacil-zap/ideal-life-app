"use client";

import { useMemo, useState } from "react";
import { Award, Lock, Sparkles, Trophy } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar, ProgressRing } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/lib/data/store";
import { evaluateAchievements } from "@/lib/achievements";
import { buildGoalViews } from "@/lib/selectors";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TIER_LABEL: Record<number, string> = {
  1: "Bronze",
  2: "Prata",
  3: "Ouro",
};

const TIER_CLASS: Record<number, string> = {
  1: "from-amber/25 to-transparent text-amber-dark",
  2: "from-ink/15 to-transparent text-ink-soft",
  3: "from-iris/25 to-transparent text-iris-dark",
};

export default function ConquistasPage() {
  const { state } = useStore();
  const [tab, setTab] = useState<"todas" | "conquistadas" | "pendentes">("todas");

  const views = useMemo(() => buildGoalViews(state), [state]);
  const progressByGoal = useMemo(() => {
    const map: Record<string, number> = {};
    views.forEach((v) => (map[v.goal.id] = v.breakdown.total));
    return map;
  }, [views]);

  const achievements = useMemo(
    () => evaluateAchievements(state, progressByGoal),
    [state, progressByGoal],
  );

  const unlocked = achievements.filter((a) => a.unlocked);
  const list =
    tab === "conquistadas"
      ? unlocked
      : tab === "pendentes"
        ? achievements.filter((a) => !a.unlocked)
        : achievements;

  const total = achievements.length;

  return (
    <div className="space-y-5">
      <section className="surface-grid relative overflow-hidden rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
        <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-amber-soft px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-dark">
              <Trophy className="h-3.5 w-3.5" />
              Conquistas
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {unlocked.length} de {total} medalhas desbloqueadas
            </h2>
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-ink-soft">
              Cada meta concluída, cada sequência de hábitos e cada sonho transformado abre uma
              nova conquista. Continue avançando!
            </p>
          </div>
          <div className="flex items-center gap-5 rounded-2xl border border-line bg-base/60 p-5">
            <ProgressRing
              value={(unlocked.length / Math.max(1, total)) * 100}
              size={112}
              stroke={11}
              color="var(--amber)"
            >
              <div className="text-center">
                <p className="font-display text-2xl font-bold tabular leading-none text-ink">
                  {Math.round((unlocked.length / Math.max(1, total)) * 100)}%
                </p>
              </div>
            </ProgressRing>
            <div className="space-y-2">
              <p className="text-[12px] text-ink-faint">Coleção</p>
              <div className="flex flex-wrap gap-1">
                {achievements.map((a) => (
                  <span
                    key={a.def.key}
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-lg text-[15px] transition-all",
                      a.unlocked
                        ? "bg-amber-soft shadow-sm"
                        : "bg-ink/5 opacity-30 grayscale",
                    )}
                    title={a.def.title}
                  >
                    {a.def.icon}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex gap-1 rounded-xl bg-ink/5 p-1">
        {(
          [
            { key: "todas", label: `Todas (${total})` },
            { key: "conquistadas", label: `Conquistadas (${unlocked.length})` },
            { key: "pendentes", label: `Pendentes (${total - unlocked.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-all",
              tab === t.key ? "bg-surface text-ink shadow-sm" : "text-ink-faint hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((a) => (
          <div
            key={a.def.key}
            className={cn(
              "relative overflow-hidden rounded-card border bg-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-raised",
              a.unlocked ? "border-amber/35" : "border-line",
            )}
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 -top-16 h-32 bg-gradient-to-b to-transparent",
                TIER_CLASS[a.def.tier],
              )}
            />
            <div className="relative flex items-start gap-3.5">
              <span
                className={cn(
                  "grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-[26px] transition-all",
                  a.unlocked
                    ? "bg-amber-soft shadow-sm"
                    : "bg-ink/5 grayscale opacity-40",
                )}
              >
                {a.unlocked ? a.def.icon : <Lock className="h-5 w-5 text-ink-faint" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-[14.5px] font-semibold leading-snug text-ink">
                    {a.def.title}
                  </h3>
                  <Badge tone={a.def.tier === 3 ? "accent" : a.def.tier === 2 ? "neutral" : "warning"}>
                    {TIER_LABEL[a.def.tier] ?? "Bronze"}
                  </Badge>
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-faint">
                  {a.def.description}
                </p>
                {a.unlocked ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-jade-dark">
                    <Sparkles className="h-3.5 w-3.5" />
                    Desbloqueada em {formatDate(a.unlockedAt)}
                  </p>
                ) : (
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-ink-faint">
                      <span>
                        {a.current} de {a.target}
                      </span>
                      <span className="tabular">{a.percent}%</span>
                    </div>
                    <ProgressBar value={a.percent} height="h-1.5" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Como desbloquear"
          description="As conquistas são automáticas — basta evoluir nas suas metas e hábitos"
          icon={<Award className="h-4 w-4" />}
        />
        <div className="grid gap-2.5 sm:grid-cols-2">
          {achievements.map((a) => (
            <div
              key={a.def.key}
              className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5"
            >
              <span className="text-[18px]">{a.def.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-ink">
                  {a.def.title}
                </span>
                <span className="block text-[11.5px] text-ink-faint">
                  {a.unlocked ? "✓ Conquistada" : `${a.current}/${a.target}`}
                </span>
              </span>
              {a.unlocked ? (
                <Badge tone="success">Feita</Badge>
              ) : (
                <Badge tone="neutral">Bloqueada</Badge>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
