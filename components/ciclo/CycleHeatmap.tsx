import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/cn";
import { getPhase, PHASE_META, type CyclePhase } from "@/lib/cycle";
import { todayBR } from "@/lib/datetime";

export interface CycleHeatmapLog {
  log_date: string;
  pain_level: number | null;
  symptoms: string[] | null;
}

export interface CycleHeatmapProps {
  /** Logs de `menstrual_daily_logs` dos últimos 28 dias (mais antigos primeiro). */
  logs: CycleHeatmapLog[];
  /** Início do ciclo atual (ISO). Se null, mostra dias neutros sem cor de fase. */
  currentCycleStart: string | null;
  /** Comprimento médio do ciclo. */
  cycleLength: number;
}

const DAY_MS = 86_400_000;

/**
 * Grid horizontal 28 dias (4 linhas × 7 colunas). Cada célula:
 * - cor da fase (se houver ciclo) ou neutra (se não);
 * - opacidade proporcional à dor;
 * - tooltip com data, dor e sintomas;
 * - hoje destacado com anel.
 *
 * Server Component — puro render.
 */
export function CycleHeatmap({
  logs,
  currentCycleStart,
  cycleLength,
}: CycleHeatmapProps) {
  const today = todayBR();
  const todayDate = parseISO(today);

  // Mapa date → log para lookup O(1).
  const byDate = new Map<string, CycleHeatmapLog>();
  for (const l of logs ?? []) {
    if (l?.log_date) byDate.set(l.log_date, l);
  }

  const startMs = todayDate.getTime() - 27 * DAY_MS;
  const days: {
    iso: string;
    date: Date;
    log: CycleHeatmapLog | null;
    phase: CyclePhase | null;
    isToday: boolean;
    dayOfCycle: number | null;
  }[] = [];

  for (let i = 0; i < 28; i++) {
    const d = new Date(startMs + i * DAY_MS);
    const iso = format(d, "yyyy-MM-dd");
    const dayOfCycle =
      currentCycleStart && i >= 0
        ? Math.floor((d.getTime() - parseISO(currentCycleStart).getTime()) / DAY_MS) + 1
        : null;
    const phase =
      dayOfCycle != null && dayOfCycle >= 1
        ? getPhase(dayOfCycle, cycleLength)
        : null;

    days.push({
      iso,
      date: d,
      log: byDate.get(iso) ?? null,
      phase,
      isToday: iso === today,
      dayOfCycle,
    });
  }

  const totalWithLog = logs?.length ?? 0;

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2" role="list">
        {days.map((d) => {
          const pain = d.log?.pain_level ?? 0;
          const hasLog = !!d.log;
          const intensity = Math.max(0, Math.min(1, pain / 10));
          const phaseMeta = d.phase ? PHASE_META[d.phase] : null;
          const labelDate = format(d.date, "d MMM", { locale: ptBR });

          // Classes por fase: gradient se dor alta, soft se dor baixa.
          let bgClass = "bg-line/50";
          if (d.phase && hasLog) {
            if (pain >= 4) {
              // dor alta → tom completo
              if (d.phase === "menstrual") bgClass = "bg-ember";
              else if (d.phase === "folicular") bgClass = "bg-moss";
              else if (d.phase === "ovulacao") bgClass = "bg-rose";
              else if (d.phase === "lutea" || d.phase === "tpm") bgClass = "bg-lilac";
              else if (d.phase === "fertil") bgClass = "bg-gold";
            } else {
              bgClass = TONE_SOFT_BG[d.phase];
            }
          } else if (d.phase) {
            // Sem log → cor da fase bem suave
            bgClass = TONE_SOFT_BG[d.phase];
          } else {
            bgClass = "bg-line/40";
          }

          const opacity = hasLog && pain > 0 ? 0.45 + intensity * 0.55 : 0.45;
          const hasSymptoms = (d.log?.symptoms?.length ?? 0) > 0;

          return (
            <div
              key={d.iso}
              role="listitem"
              className={cn(
                "relative aspect-square rounded-lg transition-colors",
                bgClass,
                d.isToday && "ring-2 ring-ember ring-offset-2 ring-offset-surface",
              )}
              style={{ opacity: hasLog || d.phase ? opacity : 0.5 }}
              title={
                [
                  labelDate,
                  d.dayOfCycle ? `dia ${d.dayOfCycle}` : null,
                  phaseMeta?.label,
                  hasLog ? `dor ${pain}/10` : "sem registro",
                  hasSymptoms ? d.log?.symptoms?.join(", ") : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || labelDate
              }
              aria-label={`${labelDate}${phaseMeta ? `, ${phaseMeta.label}` : ""}${hasLog ? `, dor ${pain}/10` : ", sem registro"}`}
            >
              {hasSymptoms && (
                <span
                  aria-hidden="true"
                  className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-ink/40"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-ember" aria-hidden="true" />
          Menstrual
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-moss" aria-hidden="true" />
          Folicular
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-gold" aria-hidden="true" />
          Fértil
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-rose" aria-hidden="true" />
          Ovulação
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-lilac" aria-hidden="true" />
          Lútea / TPM
        </span>
        <span className="ml-auto text-[11px] text-ink-faint">
          {totalWithLog} registro(s) · intensidade × dor
        </span>
      </div>
    </div>
  );
}

const TONE_SOFT_BG: Record<CyclePhase, string> = {
  menstrual: "bg-ember-soft",
  folicular: "bg-moss-soft",
  fertil: "bg-gold-soft",
  ovulacao: "bg-rose-soft",
  lutea: "bg-lilac-soft",
  tpm: "bg-lilac-soft",
};