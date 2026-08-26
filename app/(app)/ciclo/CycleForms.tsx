"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import {
  startMenstruation,
  endMenstruation,
  logDailySymptoms,
  logDailyFlow,
} from "./actions";
import { cn } from "@/lib/cn";
import { todayBR } from "@/lib/datetime";

const flowOptions = [
  { value: "leve", label: "Leve" },
  { value: "moderado", label: "Moderado" },
  { value: "intenso", label: "Intenso" },
] as const;

type Flow = (typeof flowOptions)[number]["value"];

const symptomOptions = [
  "cólica",
  "dor de cabeça",
  "inchaço",
  "sensibilidade",
  "alterações de humor",
  "acne",
  "cansaço",
  "desejo por alimentos",
];

/* ────────────────────────────────────────────────────────────────────
   StartMenstruationDialog
   Botão principal + modal com fluxo em 3 passos:
   1. Quando começou?
   2. Já terminou? (Sim / Ainda estou menstruando)
   3. Intensidade do fluxo (sempre — primeiro dia)
   Se "Sim", pede também a data de término.
   ──────────────────────────────────────────────────────────────────── */

interface StartMenstruationDialogProps {
  /** Se já existe um ciclo em aberto, o botão muda de copy. */
  hasOpenCycle: boolean;
}

export function StartMenstruationDialog({
  hasOpenCycle,
}: StartMenstruationDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [startDate, setStartDate] = useState(todayBR());
  const [endDate, setEndDate] = useState(todayBR());
  const [flow, setFlow] = useState<Flow>("moderado");
  const [isFinished, setIsFinished] = useState<boolean | null>(null);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setStep(1);
    setStartDate(todayBR());
    setEndDate(todayBR());
    setFlow("moderado");
    setIsFinished(null);
    setError(null);
  }

  function close() {
    if (isPending) return;
    setOpen(false);
    // Pequeno delay pra não piscar o modal fechando antes do fade-out.
    setTimeout(reset, 200);
  }

  function handleSubmit() {
    setError(null);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      setError("Data de início inválida.");
      return;
    }
    if (startDate > todayBR()) {
      setError("A data de início não pode estar no futuro.");
      return;
    }
    if (isFinished && endDate < startDate) {
      setError("A data de término não pode ser antes do início.");
      return;
    }

    startTransition(async () => {
      try {
        await startMenstruation({
          start_date: startDate,
          flow_intensity: flow,
          is_finished: !!isFinished,
          end_date: isFinished ? endDate : null,
        });
        close();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao registrar.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full rounded-2xl bg-gradient-to-r from-ember to-ember-tint px-6 py-4",
          "text-white font-display text-base font-semibold shadow-floating",
          "hover:from-ember-dark hover:to-ember active:scale-[0.99] transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ember-dark",
          "inline-flex items-center justify-center gap-2",
        )}
      >
        + Registrar menstruação
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={close}
        >
          <div
            className={cn(
              "relative w-full max-w-md rounded-card bg-base shadow-floating border border-line/60",
              "animate-fade-up",
            )}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-mens-title"
          >
            <div className="p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ember-soft text-ember">
                  <span className="text-lg" aria-hidden="true">🌸</span>
                </span>
                <h2
                  id="start-mens-title"
                  className="font-display text-xl font-bold leading-tight text-ink"
                >
                  {hasOpenCycle ? "Ciclo em aberto" : "Registrar menstruação"}
                </h2>
              </div>

              {hasOpenCycle && (
                <p className="mt-4 rounded-xl bg-moss-soft/60 p-3 text-[13px] leading-relaxed text-ink-soft">
                  Você já tem um ciclo em aberto. A data de início fica como
                  está — você pode atualizar o fluxo diário no card de sintomas.
                </p>
              )}

              {/* ── Step 1: data de início ── */}
              {step === 1 && (
                <div className="mt-5 space-y-4">
                  <p className="text-[14px] leading-relaxed text-ink-soft">
                    Quando sua menstruação começou?
                  </p>
                  <TextField
                    label="Primeiro dia"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={todayBR()}
                    disabled={hasOpenCycle}
                  />
                  <DialogActions
                    onCancel={close}
                    onPrimary={() => setStep(2)}
                    primaryLabel="Continuar"
                  />
                </div>
              )}

              {/* ── Step 2: já terminou? ── */}
              {step === 2 && (
                <div className="mt-5 space-y-4">
                  <p className="text-[14px] leading-relaxed text-ink-soft">
                    Ela já terminou?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <ChoiceCard
                      active={isFinished === true}
                      onClick={() => setIsFinished(true)}
                      label="Sim"
                      sub="Já acabou"
                    />
                    <ChoiceCard
                      active={isFinished === false}
                      onClick={() => setIsFinished(false)}
                      label="Ainda estou menstruando"
                      sub="Vou atualizar por dia"
                    />
                  </div>
                  <DialogActions
                    onCancel={() => setStep(1)}
                    onPrimary={() => {
                      if (isFinished === null) {
                        setError("Escolha uma opção pra continuar.");
                        return;
                      }
                      setError(null);
                      setStep(3);
                    }}
                    primaryLabel="Continuar"
                  />
                </div>
              )}

              {/* ── Step 3: intensidade + (se terminou) data fim ── */}
              {step === 3 && (
                <div className="mt-5 space-y-4">
                  <p className="text-[14px] leading-relaxed text-ink-soft">
                    Qual a intensidade do fluxo?
                  </p>
                  <FlowPicker value={flow} onChange={setFlow} />

                  {isFinished && (
                    <TextField
                      label="Data em que terminou"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      max={todayBR()}
                      min={startDate}
                    />
                  )}

                  <DialogActions
                    onCancel={() => setStep(2)}
                    onPrimary={handleSubmit}
                    primaryLabel={
                      isPending
                        ? "Salvando..."
                        : hasOpenCycle
                          ? "OK"
                          : "Registrar"
                    }
                    loading={isPending}
                  />
                </div>
              )}

              {error && (
                <p
                  className="mt-3 rounded-xl bg-ember-soft px-3 py-2 text-[12px] text-ember-dark"
                  role="alert"
                >
                  {error}
                </p>
              )}

              {/* Stepper dots */}
              <div className="mt-5 flex justify-center gap-1.5">
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    aria-hidden="true"
                    className={cn(
                      "h-1.5 w-6 rounded-full transition-colors",
                      step >= n ? "bg-ember" : "bg-line",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DialogActions({
  onCancel,
  onPrimary,
  primaryLabel,
  loading,
}: {
  onCancel: () => void;
  onPrimary: () => void;
  primaryLabel: string;
  loading?: boolean;
}) {
  return (
    <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className={cn(
          "rounded-pill px-4 py-2 text-[13px] font-semibold text-ink-soft",
          "hover:bg-base/80 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base",
        )}
      >
        Voltar
      </button>
      <button
        type="button"
        onClick={onPrimary}
        disabled={loading}
        className={cn(
          "rounded-pill bg-ember px-5 py-2 text-[13px] font-semibold text-white",
          "hover:bg-ember-dark active:scale-[0.97] disabled:opacity-60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base",
          "transition-all",
        )}
      >
        {primaryLabel}
      </button>
    </div>
  );
}

function ChoiceCard({
  active,
  onClick,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-4 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base",
        active
          ? "border-ember bg-ember-soft/40 shadow-card"
          : "border-line bg-surface hover:border-ember/40",
      )}
    >
      <p className="font-display text-base font-semibold text-ink">{label}</p>
      <p className="mt-0.5 text-[12px] text-ink-soft">{sub}</p>
    </button>
  );
}

function FlowPicker({
  value,
  onChange,
}: {
  value: Flow;
  onChange: (v: Flow) => void;
}) {
  return (
    <div
      className="grid grid-cols-3 gap-2"
      role="radiogroup"
      aria-label="Intensidade do fluxo"
    >
      {flowOptions.map((f) => {
        const active = value === f.value;
        return (
          <button
            key={f.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(f.value)}
            className={cn(
              "rounded-xl py-2.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base",
              active
                ? "bg-ember-gradient text-white shadow-card"
                : "bg-line/50 text-ink-soft hover:bg-line",
            )}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Encerrar ciclo em aberto
   Botão discreto pra quem quer dizer "já acabou" dias depois.
   ──────────────────────────────────────────────────────────────────── */

export function EndOpenCycleButton({
  startDate,
}: {
  startDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [endDate, setEndDate] = useState(todayBR());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (isPending) return;
    setOpen(false);
    setError(null);
    setEndDate(todayBR());
  }

  function handleSubmit() {
    setError(null);
    if (endDate < startDate) {
      setError("A data não pode ser antes do início.");
      return;
    }
    startTransition(async () => {
      try {
        await endMenstruation({ end_date: endDate });
        close();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao encerrar.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-pill bg-line/60 px-3 py-1.5 text-[12px] font-semibold text-ink-soft",
          "hover:bg-line transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base",
        )}
      >
        Encerrar ciclo
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={close}
        >
          <div
            className={cn(
              "relative w-full max-w-sm rounded-card bg-base shadow-floating border border-line/60",
              "animate-fade-up p-6",
            )}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="font-display text-lg font-bold text-ink">
              Encerrar ciclo atual
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
              Quando sua menstruação terminou?
            </p>
            <div className="mt-4">
              <TextField
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                max={todayBR()}
                min={startDate}
                label="Último dia de fluxo"
              />
            </div>
            {error && (
              <p className="mt-3 text-[12px] text-ember-dark" role="alert">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                disabled={isPending}
                className="rounded-pill px-4 py-2 text-[13px] font-semibold text-ink-soft hover:bg-base/80 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className={cn(
                  "rounded-pill bg-ember px-5 py-2 text-[13px] font-semibold text-white",
                  "hover:bg-ember-dark active:scale-[0.97] disabled:opacity-60",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base",
                  "transition-all",
                )}
              >
                {isPending ? "Salvando..." : "Encerrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────
   DailySymptomsForm
   Agora também inclui o fluxo do dia (se há ciclo em aberto).
   ──────────────────────────────────────────────────────────────────── */

interface DailySymptomsFormProps {
  initialPain?: number;
  initialSymptoms?: string[];
  initialFlow?: Flow | null;
  /** Se há ciclo em aberto, mostra o bloco "Fluxo de hoje" + botão "Encerrar ciclo". */
  hasOpenCycle?: boolean;
  openCycleStart?: string | null;
}

export function DailySymptomsForm({
  initialPain,
  initialSymptoms,
  initialFlow,
  hasOpenCycle = false,
  openCycleStart = null,
}: DailySymptomsFormProps) {
  const [pain, setPain] = useState(initialPain ?? 0);
  const [symptoms, setSymptoms] = useState<string[]>(initialSymptoms ?? []);
  const [flow, setFlow] = useState<Flow | null>(initialFlow ?? null);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(
    !!initialPain ||
      !!(initialSymptoms && initialSymptoms.length) ||
      !!initialFlow,
  );
  const [error, setError] = useState<string | null>(null);

  function toggleSymptom(s: string) {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
    setSaved(false);
  }

  function setFlowAndMark(v: Flow) {
    setFlow(v);
    setSaved(false);
    // Persistência imediata só do fluxo (UX rápida: ela não precisa
    // apertar "Salvar sintomas" só pra trocar a intensidade).
    startTransition(async () => {
      try {
        await logDailyFlow({ date: todayBR(), flow_intensity: v });
      } catch {
        // erro silencioso aqui — o save completo abaixo cobre.
      }
    });
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await logDailySymptoms({
          pain_level: pain,
          symptoms,
          flow_intensity: flow,
          notes,
        });
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  return (
    <div className="space-y-5">
      {hasOpenCycle && (
        <div className="rounded-2xl bg-ember-soft/30 p-4 ring-1 ring-ember/20">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Fluxo de hoje</p>
            {openCycleStart && (
              <EndOpenCycleButton startDate={openCycleStart} />
            )}
          </div>
          <FlowPicker value={flow ?? "moderado"} onChange={setFlowAndMark} />
          <p className="mt-2 text-[11px] text-ink-faint">
            Toque pra atualizar a intensidade. Salvamos junto com os sintomas.
          </p>
        </div>
      )}

      <div>
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <label htmlFor="pain-range" className="font-medium text-ink-soft">
            Dor hoje
          </label>
          <span className="font-mono text-ink tabular-nums">{pain}/10</span>
        </div>
        <input
          id="pain-range"
          type="range"
          min={0}
          max={10}
          step={1}
          value={pain}
          onChange={(e) => {
            setPain(Number(e.target.value));
            setSaved(false);
          }}
          className="w-full accent-ember"
          aria-valuemin={0}
          aria-valuemax={10}
          aria-valuenow={pain}
        />
        <div className="mt-1 flex justify-between text-[10px] text-ink-faint">
          <span>Sem dor</span>
          <span>Intensa</span>
        </div>
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-ink-soft">
          Sintomas
        </span>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Sintomas do dia"
        >
          {symptomOptions.map((s) => {
            const active = symptoms.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => toggleSymptom(s)}
                className={cn(
                  "rounded-pill px-3 py-1.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-base",
                  active
                    ? "bg-moss-gradient text-white shadow-card"
                    : "bg-line/50 text-ink-soft hover:bg-line",
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <TextField
        label="Notas (opcional)"
        placeholder="Algo importante que você queira lembrar hoje."
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setSaved(false);
        }}
        maxLength={300}
      />

      {error && (
        <p className="text-[12px] text-ember-dark" role="alert">
          {error}
        </p>
      )}

      <Button
        onClick={handleSave}
        loading={isPending}
        disabled={saved}
        variant={saved ? "outline" : "primary"}
        fullWidth
      >
        {saved ? "Registrado" : "Salvar sintomas de hoje"}
      </Button>
    </div>
  );
}
