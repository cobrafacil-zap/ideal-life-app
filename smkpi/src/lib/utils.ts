import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Id curto e estável (sem dependência de crypto em SSR). */
export function uid(prefix = "id"): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  return `${prefix}_${rnd}`;
}

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ── Datas ─────────────────────────────────────────────── */

export const MS_DAY = 86_400_000;

/** ISO local (yyyy-MM-dd) — evita o bug de fuso do toISOString. */
export function toISODate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISODate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_DAY);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

export function monthLabel(key: string, short = true): string {
  const [y, m] = key.split("-").map(Number);
  const names = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  const label = names[(m - 1) % 12];
  return short ? label : `${label[0].toUpperCase()}${label.slice(1)}`;
}

/* ── Formatação ────────────────────────────────────────── */

export function formatCurrency(
  value: number | null | undefined,
  currency = "BRL",
  compact = false,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
    minimumFractionDigits: compact ? 0 : 0,
  }).format(value);
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | null | undefined, withYear = true): string {
  const date = parseISODate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  }).format(date);
}

export function formatDateLong(value: string | null | undefined): string {
  const date = parseISODate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatPercent(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(decimals)}%`;
}

/** Formata a unidade da meta: R$ 35.000, 70 kg, 12 un. */
export function formatMetric(
  value: number | null | undefined,
  unit: string,
  currency: string,
): string {
  if (value === null || value === undefined) return "—";
  if (unit === "R$" || unit.toUpperCase() === "BRL") {
    return formatCurrency(value, currency);
  }
  const suffix = unit ? ` ${unit}` : "";
  return `${formatNumber(value, Number.isInteger(value) ? 0 : 1)}${suffix}`;
}

/** Título curto da unidade para chips e tabelas. */
export function unitLabel(unit: string, currency: string): string {
  if (!unit) return "";
  if (unit === "R$" || unit.toUpperCase() === "BRL") return currency;
  return unit;
}
