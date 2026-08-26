/**
 * Helpers de formatação e data usados em todo o app.
 * Centraliza decisões de locale (pt-BR) e evita drift entre páginas.
 */
import { nowInBR, todayBR } from "@/lib/datetime";

const LOCALE = "pt-BR";

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const shortDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
});

const numberFormatter = new Intl.NumberFormat(LOCALE);

export function formatLongDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return dateFormatter.format(d);
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return shortDateFormatter.format(d);
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return timeFormatter.format(d);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatLiters(ml: number): string {
  return (ml / 1000).toFixed(1).replace(".", ",") + "L";
}

/**
 * Início da semana (segunda) em ISO, usado para agregações semanais.
 * Ancorado no fuso de Brasília para que a "semana" bata com o dia local.
 */
export function startOfWeekISO(date: Date = nowInBR()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 = domingo
  d.setDate(d.getDate() - ((day + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function todayISO(): string {
  return todayBR();
}

/**
 * Formata horas decimais em pt-BR: "1h 30min", "45min", "2h".
 * Aceita `null` e retorna "—".
 */
export function formatHours(hours: number | null | undefined): string {
  if (hours == null || !Number.isFinite(hours) || hours <= 0) return "—";
  const totalMin = Math.round(hours * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
