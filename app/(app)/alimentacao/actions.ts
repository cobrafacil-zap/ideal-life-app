"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function logMeal(input: {
  meal_type: string;
  description: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: meal, error } = await supabase
    .from("meals")
    .insert({
      user_id: user.id,
      meal_type: input.meal_type,
      notes: input.description,
      total_calories: input.calories ?? null,
      total_protein_g: input.protein_g ?? null,
      total_carbs_g: input.carbs_g ?? null,
      total_fat_g: input.fat_g ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (input.description) {
    await supabase.from("meal_items").insert({
      meal_id: meal.id,
      user_id: user.id,
      food_name: input.description,
      calories: input.calories ?? null,
      protein_g: input.protein_g ?? null,
      carbs_g: input.carbs_g ?? null,
      fat_g: input.fat_g ?? null,
      source: "manual",
    });
  }

  revalidatePath("/alimentacao");
  revalidatePath("/hoje");
}
