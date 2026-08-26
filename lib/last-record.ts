import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Helper para "último dia com dados" por coluna.
 *
 * Usado na Home para o comparativo "Hoje × último registro" — em vez de
 * hardcodar ontem (que pode estar vazio), busca a data mais recente que
 * tem registros, e.g. `meal_date` em `meals`.
 *
 * Implementação direta via Supabase (sem RPC) — o cliente ordena desc e
 * toma o primeiro registro. Mais barato que `max()` e respeita RLS.
 */

export async function findLastRecordDate(
  supabase: SupabaseClient,
  table: "meals" | "water_logs" | "daily_checkins",
  column: "meal_date" | "log_date" | "checkin_date",
  userId: string,
  beforeDate?: string,
): Promise<string | null> {
  let q = supabase
    .from(table)
    .select(column)
    .eq("user_id", userId)
    .order(column, { ascending: false })
    .limit(1)
    .maybeSingle();
  if (beforeDate) {
    q = supabase
      .from(table)
      .select(column)
      .eq("user_id", userId)
      .lt(column, beforeDate)
      .order(column, { ascending: false })
      .limit(1)
      .maybeSingle();
  }
  const { data, error } = await q;
  if (error || !data) return null;
  // data é { [column]: string } — extraímos a chave dinamicamente.
  return (data as Record<string, string | null>)[column] ?? null;
}

export async function findLastRecordRow<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  supabase: SupabaseClient,
  args: {
    table: "meals" | "water_logs" | "daily_checkins";
    select: string;
    column: "meal_date" | "log_date" | "checkin_date";
    userId: string;
    beforeDate?: string;
  },
): Promise<{ date: string; row: T } | null> {
  let q = supabase
    .from(args.table)
    .select(args.select)
    .eq("user_id", args.userId)
    .order(args.column, { ascending: false })
    .limit(1)
    .maybeSingle<T>();
  if (args.beforeDate) {
    q = supabase
      .from(args.table)
      .select(args.select)
      .eq("user_id", args.userId)
      .lt(args.column, args.beforeDate)
      .order(args.column, { ascending: false })
      .limit(1)
      .maybeSingle<T>();
  }
  const { data, error } = await q;
  if (error || !data) return null;
  const date = (data as Record<string, string | null>)[args.column] ?? null;
  if (!date) return null;
  return { date, row: data };
}
