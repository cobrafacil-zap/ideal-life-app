/**
 * Helpers de data/hora sempre ancorados no fuso de Brasília (America/Sao_Paulo).
 *
 * Por que existe: o app é usado por pessoas no Brasil, e o servidor pode estar
 * em UTC. Sem esses helpers, `new Date()` retorna o instante UTC e `toISOString().slice(0,10)`
 * pode "virar o dia" perto da meia-noite no horário local do usuário.
 *
 * Toda leitura de "agora" / "hoje" no app deve passar por aqui.
 */

// Fuso oficial do Brasil (cobre BR-SP, BR-RJ, BR-MG e a maior parte do país).
// Usar IANA em vez de "-03:00" fixo garante que horário de verão (quando voltar)
// seja respeitado automaticamente.
export const TIMEZONE = "America/Sao_Paulo";

/**
 * Retorna a data/hora atual *como ela é observada em Brasília*.
 * Internamente continua sendo um Date em UTC, mas as partes (dia, mês, hora...)
 * batem com o relógio de SP.
 */
export function nowInBR(): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => Number(parts.find(p => p.type === type)?.value);
  const hour = get("hour") === 24 ? 0 : get("hour");

  // Construímos um Date cujo getHours()/getDate() etc. refletem o horário de Brasília.
  // Isso permite reusar APIs nativas (date-fns differenceInCalendarDays, etc.) sem
  // precisar converter fuso a cada chamada.
  return new Date(
    get("year"),
    get("month") - 1,
    get("day"),
    hour,
    get("minute"),
    get("second"),
  );
}

/**
 * Data de hoje no fuso de Brasília, em formato ISO `YYYY-MM-DD`.
 * Equivalente a `nowInBR().toISOString().slice(0,10)` mas com dia local correto.
 */
export function todayBR(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find(p => p.type === "year")?.value;
  const m = parts.find(p => p.type === "month")?.value;
  const d = parts.find(p => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

/**
 * Hora atual em Brasília no formato `HH:mm`.
 * Útil para mostrar "agora são 14:32" em dashboards/cards.
 */
export function nowTimeBR(): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

/**
 * Data + hora atual em Brasília no formato `YYYY-MM-DD HH:mm:ss`.
 * Bom para logs e timestamps exibidos ao usuário.
 */
export function nowDateTimeBR(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}
