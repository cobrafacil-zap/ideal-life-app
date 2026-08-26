"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayBR } from "@/lib/datetime";

export async function saveCheckin(input: {
  energy: number;
  mood: number;
  disposition: number;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const today = todayBR();

  const { error } = await supabase.from("daily_checkins").upsert(
    {
      user_id: user.id,
      checkin_date: today,
      energy: input.energy,
      mood: input.mood,
      disposition: input.disposition,
    },
    { onConflict: "user_id,checkin_date" }
  );

  if (error) throw new Error(error.message);

  revalidatePath("/hoje");
}

export async function addWater(amountMl: number) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const today = todayBR();

  const { error } = await supabase.from("water_logs").insert({
    user_id: user.id,
    amount_ml: amountMl,
    log_date: today,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/hoje");
}
