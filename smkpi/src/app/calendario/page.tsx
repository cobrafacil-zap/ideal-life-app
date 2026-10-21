"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Flag,
  Repeat2,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/lib/data/store";
import { cn, formatDate, formatMetric, toISODate } from "@/lib/utils";

const WEEKDAYS = ["SE", "TE", "QU", "QI", "SX", "SA", "DO"];

interface EventItem {
  id: string;
  type: "prazo" | "inicio" | "etapa" | "habito" | "conquista";
  title: string;
  goalId?: string;
  color: string;
  meta?: string;
}

export default function CalendarioPage() {
  const { state } = useStore();
  const today = new Date();
  const todayIso = toISODate(today);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selected, setSelected] = useState<string>(todayIso);

  const events = useMemo<EventItem[]>(() => {
    const list: EventItem[] = [];
    state.goals.forEach((g) => {
      const color = state.categories.find((c) => c.id === g.categoryId)?.color ?? "#4F46E5";
      if (g.dueDate) {
        list.push({
          id: `due_${g.id}`,
          type: "prazo",
          title: `Prazo: ${g.title}`,
          goalId: g.id,
          color,
          meta: formatDate(g.dueDate),
        });
      }
      if (g.startDate) {
        list.push({
          id: `start_${g.id}`,
          type: "inicio",
          title: `Início: ${g.title}`,
          goalId: g.id,
          color,
          meta: formatDate(g.startDate),
        });
      }
    });
    state.steps
      .filter((s) => s.done && s.doneAt)
      .forEach((s) => {
        const g = state.goals.find((x) => x.id === s.goalId);
        const color = state.categories.find((c) => c.id === g?.categoryId)?.color ?? "#4F46E5";
        list.push({
          id: `step_${s.id}`,
          type: "etapa",
          title: s.title,
          goalId: s.goalId,
          color,
          meta: g?.title,
        });
      });
    state.habitLogs.forEach((l) => {
      const h = state.habits.find((x) => x.id === l.habitId);
      if (!h) return;
      list.push({
        id: `habit_${l.id}`,
        type: "habito",
        title: h.title,
        color: h.color,
      });
    });
    state.achievements.forEach((a) => {
      list.push({
        id: `ach_${a.id}`,
        type: "conquista",
        title: `Conquista desbloqueada`,
        color: "#D97706",
      });
    });
    return list;
  }, [state]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    events.forEach((e) => {
      const date =
        e.type === "prazo"
          ? state.goals.find((g) => g.id === e.goalId)?.dueDate
          : e.type === "inicio"
            ? state.goals.find((g) => g.id === e.goalId)?.startDate
            : e.type === "etapa"
              ? state.steps.find((s) => `step_${s.id}` === e.id)?.doneAt
              : e.type === "habito"
                ? state.habitLogs.find((l) => `habit_${l.id}` === e.id)?.logDate
                : state.achievements.find((a) => `ach_${a.id}` === e.id)?.unlockedAt.slice(0, 10);
      if (!date) return;
      const key = date.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), e]);
    });
    return map;
  }, [events, state]);

  const cells = useMemo(() => {
    const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const year = base.getFullYear();
    const month = base.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: (Date | null)[] = [];
    for (let i = 0; i < offset; i++) out.push(null);
    for (let i = 1; i <= daysInMonth; i++) out.push(new Date(year, month, i));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [today, monthOffset]);

  const selectedEvents = eventsByDate.get(selected) ?? [];

  const typeMeta: Record<EventItem["type"], { label: string; icon: React.ReactNode }> = {
    prazo: { label: "Prazo", icon: <Flag className="h-3 w-3" /> },
    inicio: { label: "Início", icon: <Sparkles className="h-3 w-3" /> },
    etapa: { label: "Etapa", icon: <CheckCircle2 className="h-3 w-3" /> },
    habito: { label: "Hábito", icon: <Repeat2 className="h-3 w-3" /> },
    conquista: { label: "Conquista", icon: <Trophy className="h-3 w-3" /> },
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Calendário"
          description="Prazos, etapas concluídas, hábitos e conquistas em um só lugar"
          icon={<CalendarDays className="h-4 w-4" />}
          action={
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMonthOffset((v) => v - 1)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-line text-[15px] font-semibold text-ink-faint hover:text-ink"
                aria-label="Mês anterior"
              >
                ‹
              </button>
              <span className="w-36 text-center text-[13px] font-semibold text-ink">
                {(() => {
                  const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
                  const month = d.toLocaleDateString("pt-BR", { month: "long" });
                  return `${month.charAt(0).toUpperCase()}${month.slice(1)} de ${d.getFullYear()}`;
                })()}
              </span>
              <button
                onClick={() => setMonthOffset((v) => Math.min(0, v + 1))}
                className="grid h-9 w-9 place-items-center rounded-lg border border-line text-[15px] font-semibold text-ink-faint hover:text-ink"
                aria-label="Próximo mês"
              >
                ›
              </button>
            </div>
          }
        />

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-faint"
            >
              {d[0]}
            </div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const iso = toISODate(day);
            const dayEvents = eventsByDate.get(iso) ?? [];
            const isToday = iso === todayIso;
            const isSelected = iso === selected;
            return (
              <button
                key={iso}
                onClick={() => setSelected(iso)}
                className={cn(
                  "relative flex min-h-[64px] flex-col items-start gap-1 rounded-xl border p-1.5 text-left transition-all sm:min-h-[82px] sm:p-2",
                  isSelected
                    ? "border-iris bg-iris-soft/50 shadow-card"
                    : "border-line hover:border-line-strong hover:bg-ink/[0.02]",
                )}
              >
                <span
                  className={cn(
                    "grid h-6 w-6 place-items-center rounded-lg text-[11.5px] font-bold tabular",
                    isToday ? "bg-iris text-white" : "text-ink-soft",
                  )}
                >
                  {day.getDate()}
                </span>
                <div className="flex flex-wrap gap-1">
                  {dayEvents.slice(0, 4).map((e) => (
                    <span
                      key={e.id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: e.color }}
                      title={e.title}
                    />
                  ))}
                  {dayEvents.length > 4 ? (
                    <span className="text-[9px] font-bold text-ink-faint">
                      +{dayEvents.length - 4}
                    </span>
                  ) : null}
                </div>
                <span className="hidden text-[10px] font-medium leading-tight text-ink-faint sm:block">
                  {dayEvents[0]?.title}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 border-t border-line pt-4 text-[11.5px] text-ink-faint">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-iris" /> Prazo
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-jade" /> Etapa
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose" /> Hábito
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber" /> Conquista
          </span>
        </div>
      </Card>

      {/* Detalhes do dia */}
      <Card>
        <CardHeader
          title={new Date(`${selected}T12:00:00`).toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })}
          description={`${selectedEvents.length} ${selectedEvents.length === 1 ? "item" : "itens"} neste dia`}
        />
        {selectedEvents.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-5 w-5" />}
            title="Nada marcado para este dia"
            description="Selecione outro dia ou registre uma atualização nas suas metas."
            className="border-0 py-6"
          />
        ) : (
          <ul className="space-y-2">
            {selectedEvents.map((e) => (
              <li key={e.id}>
                {e.goalId ? (
                  <Link
                    href={`/metas/${e.goalId}`}
                    className="flex items-center gap-3 rounded-xl border border-line p-3 transition-colors hover:bg-ink/[0.03]"
                  >
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white"
                      style={{ background: e.color }}
                    >
                      <Icon name="target" className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-ink">
                        {e.title}
                      </span>
                      {e.meta ? (
                        <span className="block truncate text-[12px] text-ink-faint">{e.meta}</span>
                      ) : null}
                    </span>
                    <Badge tone="neutral">{typeMeta[e.type].label}</Badge>
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-line p-3">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white"
                      style={{ background: e.color }}
                    >
                      {typeMeta[e.type].icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-ink">
                        {e.title}
                      </span>
                      {e.meta ? (
                        <span className="block truncate text-[12px] text-ink-faint">{e.meta}</span>
                      ) : null}
                    </span>
                    <Badge tone="neutral">{typeMeta[e.type].label}</Badge>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Próximos prazos */}
      <Card>
        <CardHeader title="Próximos prazos" description="O que vence nos próximos 60 dias" />
        {(() => {
          const upcoming = state.goals
            .filter((g) => g.dueDate && g.status === "ativa")
            .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
            .slice(0, 6);
          if (!upcoming.length) {
            return <p className="text-[13px] text-ink-faint">Nenhum prazo ativo.</p>;
          }
          return (
            <ul className="space-y-2">
              {upcoming.map((g) => {
                const color =
                  state.categories.find((c) => c.id === g.categoryId)?.color ?? "#4F46E5";
                return (
                  <li key={g.id}>
                    <Link
                      href={`/metas/${g.id}`}
                      className="flex items-center gap-3 rounded-xl border border-line p-3 transition-colors hover:bg-ink/[0.03]"
                    >
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                        style={{ background: `${color}1a`, color }}
                      >
                        <Icon name={g.icon} className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-semibold text-ink">
                          {g.title}
                        </span>
                        <span className="block text-[12px] text-ink-faint">
                          Prazo {formatDate(g.dueDate)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          );
        })()}
      </Card>
    </div>
  );
}
