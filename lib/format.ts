/**
 * Helpers de formatação e data usados em todo o app.
 * Centraliza decisões de locale (pt-BR) e evita drift entre páginas.
 */

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
 * Mantido aqui para evitar duplicação entre páginas.
 */
export function startOfWeekISO(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 = domingo
  d.setDate(d.getDate() - ((day + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
