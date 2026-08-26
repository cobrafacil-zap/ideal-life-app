/**
 * Cálculo do percentual de bem-estar a partir do check-in diário.
 *
 * Mantido em lib/ (não em components/) para poder ser importado de Server
 * Components sem cruzar a fronteira client/server.
 */

export interface CheckinLike {
  energy: number | null;
  mood: number | null;
  disposition: number | null;
}

/**
 * Devolve a média 0–10 (energia/humor/disposição) ou null se algum valor faltar.
 * Multiplica por 10 só para dar a escala "0–100pp" usada no Trend.
 */
export function wellBeingAverage(checkin: CheckinLike | null): number | null {
  if (!checkin) return null;
  const vals = [checkin.energy, checkin.mood, checkin.disposition];
  if (vals.some((v) => v == null)) return null;
  return ((vals[0]! + vals[1]! + vals[2]!) / 30) * 10;
}