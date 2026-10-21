"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  Flame,
  Link2,
  Plus,
  Repeat2,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Icon, ICON_NAMES } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/data/store";
import { currentStreak } from "@/lib/achievements";
import { currentWeekRange, isoWeekKey } from "@/lib/progress";
import { CATEGORY_PALETTE } from "@/lib/constants";
import { cn, toISODate } from "@/lib/utils";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const WEEKDAYS_SHORT = ["SE", "TE", "QU", "QI", "SX", "SA", "DO"];

export default function HabitosPage() {
  const { state, addHabit, deleteHabit, toggleHabitDay } = useStore();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);

  const today = new Date();
  const todayIso = toISODate(today);
  const { start: weekStart } = currentWeekRange(today);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("check");
  const [color, setColor] = useState(CATEGORY_PALETTE[0].color);
  const [goalId, setGoalId] = useState("");
  const [targetPerWeek, setTargetPerWeek] = useState(5);

  const streak = useMemo(() => currentStreak(state), [state]);

  const habitStats = (habitId: string) => {
    const logs = state.habitLogs.filter((l) => l.habitId === habitId);
    const weekCount = logs.filter((l) =>
      weekDates.some((d) => l.logDate === toISODate(d)),
    ).length;
    const last30 = logs.filter((l) => {
      const d = new Date(l.logDate);
      const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
      return diff >= 0 && diff < 30;
    }).length;
    return { total: logs.length, weekCount, last30 };
  };

  const activeHabit = state.habits.find((h) => h.id === selectedHabit) ?? state.habits[0];

  const calendarDays = useMemo(() => {
    const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const year = base.getFullYear();
    const month = base.getMonth();
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(year, month, i));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [today, monthOffset]);

  const submit = () => {
    if (!title.trim()) {
      toast("Dê um nome ao hábito.", "error");
      return;
    }
    addHabit({
      title,
      icon,
      color,
      goalId: goalId || null,
      targetPerWeek,
    });
    setTitle("");
    setGoalId("");
    setFormOpen(false);
    toast("Hábito criado!");
  };

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            Hábitos ativos
          </p>
          <p className="mt-1 font-display text-2xl font-bold tabular text-ink">
            {state.habits.length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            Sequência atual
          </p>
          <p className="mt-1 font-display text-2xl font-bold tabular text-amber-dark">
            {streak} {streak === 1 ? "dia" : "dias"}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            Marcações totais
          </p>
          <p className="mt-1 font-display text-2xl font-bold tabular text-ink">
            {state.habitLogs.length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            Semana atual
          </p>
          <p className="mt-1 font-display text-2xl font-bold tabular text-iris">
            {isoWeekKey() ? state.habitLogs.filter((l) => weekDates.some((d) => l.logDate === toISODate(d))).length : 0}
          </p>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Meus hábitos</h2>
          <p className="text-[13px] text-ink-faint">
            Rotinas que sustentam o avanço das suas metas.
          </p>
        </div>
        <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
          Novo hábito
        </Button>
      </div>

      {state.habits.length === 0 ? (
        <EmptyState
          icon={<Repeat2 className="h-5 w-5" />}
          title="Nenhum hábito ainda"
          description="Crie hábitos como “Beber 2L de água” ou “Treinar” e marque os dias no calendário."
          action={
            <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
              Criar hábito
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {state.habits.map((habit) => {
            const stats = habitStats(habit.id);
            const goal = state.goals.find((g) => g.id === habit.goalId);
            const markedToday = state.habitLogs.some(
              (l) => l.habitId === habit.id && l.logDate === todayIso,
            );
            const percent = Math.min(100, (stats.weekCount / Math.max(1, habit.targetPerWeek)) * 100);

            return (
              <Card key={habit.id} hover className="flex flex-col">
                <div className="flex items-start gap-3">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-sm"
                    style={{ background: habit.color }}
                  >
                    <Icon name={habit.icon} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-[15px] font-semibold text-ink">
                      {habit.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-pill bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-ink-faint">
                        Meta: {habit.targetPerWeek}x/semana
                      </span>
                      {goal ? (
                        <Link
                          href={`/metas/${goal.id}`}
                          className="inline-flex items-center gap-1 rounded-pill bg-iris-soft px-2 py-0.5 text-[11px] font-semibold text-iris-dark hover:underline"
                        >
                          <Link2 className="h-3 w-3" />
                          {goal.title}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      deleteHabit(habit.id);
                      toast("Hábito removido.", "info");
                    }}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-rose-soft hover:text-rose"
                    aria-label="Excluir hábito"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="font-medium text-ink-faint">Esta semana</span>
                    <span className="font-bold tabular text-ink-soft">
                      {stats.weekCount}/{habit.targetPerWeek}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {weekDates.map((d) => {
                      const iso = toISODate(d);
                      const done = state.habitLogs.some(
                        (l) => l.habitId === habit.id && l.logDate === iso,
                      );
                      const future = d.getTime() > today.getTime();
                      return (
                        <button
                          key={iso}
                          disabled={future}
                          onClick={() => toggleHabitDay(habit.id, iso)}
                          className={cn(
                            "flex-1 rounded-lg border py-1.5 text-[10px] font-semibold transition-all",
                            done
                              ? "border-transparent text-white"
                              : future
                                ? "border-line bg-ink/[0.02] text-ink-faint/50"
                                : "border-line text-ink-faint hover:border-iris/40 hover:text-iris",
                          )}
                          style={done ? { background: habit.color } : undefined}
                          title={iso}
                        >
                          {WEEKDAYS_SHORT[(d.getDay() + 6) % 7]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-faint">
                    <Flame className="h-3.5 w-3.5 text-amber" />
                    {stats.last30} marcas em 30 dias
                  </span>
                  <Button
                    size="sm"
                    variant={markedToday ? "secondary" : "primary"}
                    leadingIcon={<Check className="h-3.5 w-3.5" />}
                    onClick={() => toggleHabitDay(habit.id, todayIso)}
                  >
                    {markedToday ? "Feito hoje" : "Marcar hoje"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Calendário de hábitos */}
      {activeHabit ? (
        <Card>
          <CardHeader
            title="Calendário de hábitos"
            description="Marque os dias em que você cumpriu cada hábito"
            icon={<CalendarDays className="h-4 w-4" />}
            action={
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMonthOffset((v) => v - 1)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line text-[13px] font-semibold text-ink-faint hover:text-ink"
                  aria-label="Mês anterior"
                >
                  ‹
                </button>
                <span className="w-32 text-center text-[12px] font-semibold text-ink">
                  {(() => {
                    const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
                    const month = d.toLocaleDateString("pt-BR", { month: "long" });
                    return `${month.charAt(0).toUpperCase()}${month.slice(1)} de ${d.getFullYear()}`;
                  })()}
                </span>
                <button
                  onClick={() => setMonthOffset((v) => Math.min(0, v + 1))}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line text-[13px] font-semibold text-ink-faint hover:text-ink"
                  aria-label="Próximo mês"
                >
                  ›
                </button>
              </div>
            }
          />

          <div className="mb-4 flex flex-wrap gap-1.5">
            {state.habits.map((h) => (
              <button
                key={h.id}
                onClick={() => setSelectedHabit(h.id)}
                className={cn(
                  "rounded-pill px-3 py-1.5 text-[12px] font-semibold transition-all",
                  activeHabit.id === h.id
                    ? "bg-iris text-white shadow-card"
                    : "bg-ink/5 text-ink-faint hover:text-ink",
                )}
              >
                {h.title}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-faint"
              >
                {d[0]}
              </div>
            ))}
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const iso = toISODate(day);
              const done = state.habitLogs.some(
                (l) => l.habitId === activeHabit.id && l.logDate === iso,
              );
              const future = day.getTime() > today.getTime();
              const isToday = iso === todayIso;
              return (
                <button
                  key={iso}
                  disabled={future}
                  onClick={() => toggleHabitDay(activeHabit.id, iso)}
                  className={cn(
                    "relative grid aspect-square place-items-center rounded-xl border text-[12px] font-semibold transition-all",
                    done
                      ? "border-transparent text-white"
                      : future
                        ? "border-line/60 bg-ink/[0.02] text-ink-faint/40"
                        : "border-line text-ink-soft hover:border-iris/50 hover:bg-iris-soft/40",
                    isToday && !done && "ring-2 ring-iris/40",
                  )}
                  style={done ? { background: activeHabit.color } : undefined}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-4 text-[12px] text-ink-faint">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-md"
                style={{ background: activeHabit.color }}
              />
              Cumprido
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md border border-line" />
              Não cumprido
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md ring-2 ring-iris/40" />
              Hoje
            </span>
          </div>
        </Card>
      ) : null}

      {/* Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Novo hábito"
        description="Rotinas que você repete para sustentar suas metas."
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit}>Criar hábito</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nome do hábito" htmlFor="habit-title">
            <Input
              id="habit-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Beber 2L de água"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Meta semanal" htmlFor="habit-target">
              <Input
                id="habit-target"
                type="number"
                min={1}
                max={7}
                value={targetPerWeek}
                onChange={(e) => setTargetPerWeek(Number(e.target.value))}
              />
            </Field>
            <Field label="Meta relacionada" optional>
              <Select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
                <option value="">Nenhuma</option>
                {state.goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Cor">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_PALETTE.map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setColor(c.color)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all",
                    color === c.color
                      ? "border-ink scale-110"
                      : "border-transparent hover:scale-110",
                  )}
                  style={{ background: c.color }}
                  aria-label={c.name}
                />
              ))}
            </div>
          </Field>

          <Field label="Ícone">
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-line bg-ink/[0.02] p-2.5">
              {ICON_NAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setIcon(name)}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-lg transition-all",
                    icon === name
                      ? "bg-iris text-white"
                      : "text-ink-faint hover:bg-ink/5 hover:text-ink",
                  )}
                >
                  <Icon name={name} className="h-[17px] w-[17px]" />
                </button>
              ))}
            </div>
          </Field>

          <div className="flex items-center gap-2 rounded-xl bg-ink/[0.03] px-3.5 py-3 text-[12px] text-ink-faint">
            <Target className="h-4 w-4 shrink-0" />
            Hábitos ligados a uma meta acompanham o progresso dela.
          </div>
        </div>
      </Modal>
    </div>
  );
}
