"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function startNewCycle(input: { start_date: string; flow_intensity: string }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

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

  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("menstrual_daily_logs").upsert(
    {
      user_id: user.id,
      log_date: today,
      pain_level: input.pain_level,
      symptoms: input.symptoms,
      notes: input.notes ?? null,
    },
    { onConflict: "user_id,log_date" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/ciclo");
}
