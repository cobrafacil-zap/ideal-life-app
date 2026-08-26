/**
 * Helpers puros de volume/progressão. Sem I/O, sem Supabase.
 */

export type SetForVolume = {
  reps: number | null;
  load: number | null;
  load_unit: "kg" | "lb";
};

/** Volume = soma(reps × load). Séries sem reps ou load são ignoradas. */
export function setVolume(set: SetForVolume): number {
  if (set.reps == null || set.load == null) return 0;
  if (set.reps <= 0 || set.load <= 0) return 0;
  return Math.round(set.reps * set.load * 100) / 100;
}

export function totalVolume(sets: SetForVolume[]): number {
  return Math.round(sets.reduce((s, x) => s + setVolume(x), 0) * 100) / 100;
}

/** Normaliza carga em lb → kg (aproximado). */
export function toKg(set: SetForVolume): number | null {
  if (set.load == null) return null;
  if (set.load <= 0) return null;
  return set.load_unit === "lb" ? Math.round(set.load * 0.4536 * 100) / 100 : set.load;
}

/** Top set (maior carga) em kg. Retorna { load, reps, setIndex }. */
export function topSetKg(
  sets: SetForVolume[],
): { load: number; reps: number; setIndex: number } | null {
  let best: { load: number; reps: number; setIndex: number } | null = null;
  for (let i = 0; i < sets.length; i++) {
    const kg = toKg(sets[i]);
    if (kg == null) continue;
    if (!best || kg > best.load) {
      best = { load: kg, reps: sets[i].reps ?? 0, setIndex: i };
    }
  }
  return best;
}

/** Média de carga (kg) entre as séries com carga válida. */
export function avgLoadKg(sets: SetForVolume[]): number {
  const valid = sets.map(toKg).filter((x): x is number => x != null);
  if (valid.length === 0) return 0;
  return Math.round((valid.reduce((s, x) => s + x, 0) / valid.length) * 100) / 100;
}

/** Delta de volume vs. sessão anterior (%). Positivo = subiu. */
export function volumeDeltaPct(
  current: number,
  previous: number | null,
): number | null {
  if (previous == null || previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Formata kg pra leitura amigável. */
export function fmtKg(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value >= 1000) return `${Math.round(value).toLocaleString("pt-BR")} kg`;
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)} kg`;
}
