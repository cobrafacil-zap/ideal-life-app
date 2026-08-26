"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/format";

const ALLOWED_FLOW = new Set(["leve", "moderado", "intenso"]);

export async function startNewCycle(input: {
  start_date: string;
  flow_intensity: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.start_date)) {
    throw new Error("Data inválida.");
  }
  if (!ALLOWED_FLOW.has(input.flow_intensity)) {
    throw new Error("Intensidade inválida.");
  }

  const { error } = await supabase.from("menstrual_cycles").insert({
    user_id: user.id,
    start_date: input.start_date,
    flow_intensity: input.flow_intensity,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/ciclo");
  revalidatePath("/hoje");
}

export async function logDailySymptoms(input: {
  pain_level: number;
  symptoms: string[];
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

  const { error } = await supabase.from("menstrual_daily_logs").upsert(
    {
      user_id: user.id,
      log_date: today,
      pain_level: Math.max(0, Math.min(10, Number(input.pain_level) || 0)),
      symptoms: cleanSymptoms,
      notes: input.notes?.trim() || null,
    },
    { onConflict: "user_id,log_date" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/ciclo");
}
