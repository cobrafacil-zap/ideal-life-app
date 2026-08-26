"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/format";

const ALLOWED_FLOW = new Set(["leve", "moderado", "intenso"]);

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/**
 * Registra o início da menstruação.
 *
 * Fluxo novo:
 *  - `is_finished: false` → cria um ciclo em aberto (`end_date = null`).
 *    A usuária pode atualizar o fluxo diariamente via `logDailyFlow`.
 *  - `is_finished: true` → cria o ciclo já com `end_date = end_date`.
 *    Útil pra quem lembra só depois que já acabou.
 *
 * Detecção automática: se já existe um ciclo em aberto, NÃO cria outro —
 * só atualiza o `start_date` se a nova data for anterior (não é comum,
 * mas previne inconsistência).
 */
export async function startMenstruation(input: {
  start_date: string;
  flow_intensity: "leve" | "moderado" | "intenso";
  is_finished: boolean;
  end_date?: string | null;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  if (!isValidDate(input.start_date)) {
    throw new Error("Data de início inválida.");
  }
  if (!ALLOWED_FLOW.has(input.flow_intensity)) {
    throw new Error("Intensidade inválida.");
  }
  if (input.is_finished) {
    if (!input.end_date || !isValidDate(input.end_date)) {
      throw new Error("Data de término inválida.");
    }
    if (input.end_date < input.start_date) {
      throw new Error("A data de término não pode ser antes do início.");
    }
  }

  // Detecção: ciclo em aberto?
  const { data: openCycle } = await supabase
    .from("menstrual_cycles")
    .select("id, start_date")
    .eq("user_id", user.id)
    .is("end_date", null)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openCycle) {
    // Já existe um ciclo em aberto — não cria duplicado. Mantém o
    // start_date existente (a usuária pode atualizar o fluxo diário).
    return { existing: true, cycleId: openCycle.id as string };
  }

  const insert: Record<string, unknown> = {
    user_id: user.id,
    start_date: input.start_date,
    flow_intensity: input.flow_intensity,
    end_date: input.is_finished ? input.end_date : null,
  };

  const { error } = await supabase.from("menstrual_cycles").insert(insert);
  if (error) throw new Error(error.message);

  // Espelha o fluxo do dia inicial no daily_log do mesmo dia.
  await supabase.from("menstrual_daily_logs").upsert(
    {
      user_id: user.id,
      log_date: input.start_date,
      flow_intensity: input.flow_intensity,
    },
    { onConflict: "user_id,log_date" },
  );

  revalidatePath("/ciclo");
  revalidatePath("/hoje");

  return { existing: false };
}

/**
 * Atualiza o ciclo em aberto:
 *  - Marca `end_date` se a usuária decidir que já acabou;
 *  - Mantém `end_date = null` enquanto ela segue menstruando.
 *
 * Idempotente: rodar várias vezes com os mesmos dados não duplica nada.
 */
export async function endMenstruation(input: { end_date: string }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  if (!isValidDate(input.end_date)) {
    throw new Error("Data de término inválida.");
  }

  // Acha o ciclo em aberto mais recente.
  const { data: openCycle } = await supabase
    .from("menstrual_cycles")
    .select("id, start_date")
    .eq("user_id", user.id)
    .is("end_date", null)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!openCycle) {
    throw new Error("Nenhum ciclo em aberto para encerrar.");
  }
  if (input.end_date < openCycle.start_date) {
    throw new Error("A data de término não pode ser antes do início.");
  }

  const { error } = await supabase
    .from("menstrual_cycles")
    .update({ end_date: input.end_date })
    .eq("id", openCycle.id);
  if (error) throw new Error(error.message);

  revalidatePath("/ciclo");
  revalidatePath("/hoje");
}

/**
 * Registra (ou atualiza) o fluxo menstrual de um dia específico.
 *
 * Se a data passada ainda não tem log do ciclo, cria. Se já tem, sobrescreve
 * só o campo `flow_intensity`. Útil pra acompanhar a variação diária.
 */
export async function logDailyFlow(input: {
  date: string;
  flow_intensity: "leve" | "moderado" | "intenso";
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  if (!isValidDate(input.date)) {
    throw new Error("Data inválida.");
  }
  if (!ALLOWED_FLOW.has(input.flow_intensity)) {
    throw new Error("Intensidade inválida.");
  }

  const { error } = await supabase.from("menstrual_daily_logs").upsert(
    {
      user_id: user.id,
      log_date: input.date,
      flow_intensity: input.flow_intensity,
    },
    { onConflict: "user_id,log_date" },
  );
  if (error) throw new Error(error.message);

  revalidatePath("/ciclo");
}

/**
 * Registra/atualiza os sintomas do dia (incluindo dor).
 * Agora também aceita `flow_intensity` pra consolidar no mesmo upsert.
 */
export async function logDailySymptoms(input: {
  pain_level: number;
  symptoms: string[];
  flow_intensity?: "leve" | "moderado" | "intenso" | null;
  notes?: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const today = todayISO();

  const cleanSymptoms = (input.symptoms ?? [])
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);

  const flow =
    input.flow_intensity && ALLOWED_FLOW.has(input.flow_intensity)
      ? input.flow_intensity
      : undefined;

  const row: Record<string, unknown> = {
    user_id: user.id,
    log_date: today,
    pain_level: Math.max(0, Math.min(10, Number(input.pain_level) || 0)),
    symptoms: cleanSymptoms,
    notes: input.notes?.trim() || null,
  };
  if (flow !== undefined) row.flow_intensity = flow;

  const { error } = await supabase.from("menstrual_daily_logs").upsert(
    row,
    { onConflict: "user_id,log_date" },
  );
  if (error) throw new Error(error.message);

  revalidatePath("/ciclo");
}
