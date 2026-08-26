"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_MEAL_TYPES = new Set([
  "cafe_da_manha",
  "almoco",
  "lanche",
  "jantar",
  "ceia",
  "outra",
]);

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

  const description = (input.description ?? "").trim();
  if (!ALLOWED_MEAL_TYPES.has(input.meal_type)) {
    throw new Error("Tipo de refeição inválido.");
  }
  if (!description) {
    throw new Error("Descreva o que você comeu.");
  }
  if (description.length > 500) {
    throw new Error("Descrição muito longa (máx. 500 caracteres).");
  }

  const { data: meal, error } = await supabase
    .from("meals")
    .insert({
      user_id: user.id,
      meal_type: input.meal_type,
      notes: description,
      total_calories: input.calories ?? null,
      total_protein_g: input.protein_g ?? null,
      total_carbs_g: input.carbs_g ?? null,
      total_fat_g: input.fat_g ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("meal_items").insert({
    meal_id: meal.id,
    user_id: user.id,
    food_name: description,
    calories: input.calories ?? null,
    protein_g: input.protein_g ?? null,
    carbs_g: input.carbs_g ?? null,
    fat_g: input.fat_g ?? null,
    source: "manual",
  });

  revalidatePath("/alimentacao");
  revalidatePath("/hoje");
}

/**
 * Atualiza uma refeição existente (tipo, notas, kcal, macros).
 * O usuário só pode editar suas próprias refeições (RLS garante).
 */
export async function updateMeal(mealId: string, input: {
  meal_type?: string;
  notes?: string;
  total_calories?: number | null;
  total_protein_g?: number | null;
  total_carbs_g?: number | null;
  total_fat_g?: number | null;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const update: Record<string, unknown> = {};
  if (input.meal_type !== undefined) {
    if (!ALLOWED_MEAL_TYPES.has(input.meal_type)) {
      throw new Error("Tipo de refeição inválido.");
    }
    update.meal_type = input.meal_type;
  }
  if (input.notes !== undefined) {
    const trimmed = input.notes.trim();
    if (trimmed.length > 500) {
      throw new Error("Descrição muito longa (máx. 500 caracteres).");
    }
    update.notes = trimmed;
  }
  update.total_calories = input.total_calories ?? null;
  update.total_protein_g = input.total_protein_g ?? null;
  update.total_carbs_g = input.total_carbs_g ?? null;
  update.total_fat_g = input.total_fat_g ?? null;

  const { error } = await supabase
    .from("meals")
    .update(update)
    .eq("id", mealId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/alimentacao");
  revalidatePath("/hoje");
}

export async function deleteMeal(mealId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase
    .from("meals")
    .delete()
    .eq("id", mealId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/alimentacao");
  revalidatePath("/hoje");
}
