import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { todayBR } from "@/lib/datetime";
import { analyzeMealImage, isGeminiConfigured } from "@/lib/gemini";
import { uploadMealPhoto } from "@/lib/storage";
import { getSignedFileUrl } from "@/lib/storage";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const MEAL_TYPES = new Set([
  "cafe_da_manha",
  "almoco",
  "lanche",
  "jantar",
  "ceia",
  "outra",
]);

/**
 * Resposta amigável única para erros genéricos — nunca vaza detalhes
 * internos (mensagens de lib, stack, etc.) pro cliente.
 */
const FRIENDLY_ERROR = "Não foi possível analisar a foto agora. Tente novamente em alguns instantes.";

export async function POST(request: NextRequest) {
  // Se a chave nem existe, retornamos 503 imediato sem tocar no Gemini.
  if (!isGeminiConfigured()) {
    return NextResponse.json(
      { error: "Análise por IA indisponível no momento." },
      { status: 503 },
    );
  }

  try {
    return await handle(request);
  } catch (err) {
    console.error("analyze-photo route:", err);
    return NextResponse.json({ error: FRIENDLY_ERROR }, { status: 500 });
  }
}

async function handle(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Body inválido — esperado multipart/form-data." },
      { status: 400 },
    );
  }

  const file = formData.get("photo");
  const mealType = String(formData.get("mealType") ?? "");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Arquivo de foto ausente." },
      { status: 400 },
    );
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Use PNG, JPG ou WebP." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Arquivo maior que 8 MB." },
      { status: 400 },
    );
  }
  if (!MEAL_TYPES.has(mealType)) {
    return NextResponse.json(
      { error: "mealType inválido." },
      { status: 400 },
    );
  }

  // Converte para base64 para a IA.
  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");

  let analysis;
  try {
    analysis = await analyzeMealImage(
      base64,
      file.type as "image/png" | "image/jpeg" | "image/webp",
    );
  } catch (err) {
    console.error("analyzeMealImage:", err);
    return NextResponse.json({ error: FRIENDLY_ERROR }, { status: 502 });
  }

  // Upload para o Storage (depois da IA, para não salvar foto se a IA falhar).
  const storagePath = await uploadMealPhoto(supabase, user.id, file, file.type);

  // Insere a refeição.
  const today = todayBR();
  const { data: mealRow, error: mealErr } = await supabase
    .from("meals")
    .insert({
      user_id: user.id,
      meal_type: mealType as
        | "cafe_da_manha"
        | "almoco"
        | "lanche"
        | "jantar"
        | "ceia"
        | "outra",
      meal_date: today,
      total_calories: analysis.total_calories,
      total_protein_g: analysis.total_protein_g,
      total_carbs_g: analysis.total_carbs_g,
      total_fat_g: analysis.total_fat_g,
    })
    .select("id")
    .single();

  if (mealErr || !mealRow) {
    console.error("meals insert:", mealErr);
    return NextResponse.json({ error: FRIENDLY_ERROR }, { status: 500 });
  }

  // Itens detectados pela IA.
  if (analysis.items.length > 0) {
    const items = analysis.items.map((it) => ({
      meal_id: mealRow.id,
      user_id: user.id,
      food_name: it.name,
      quantity_g: it.quantity_g,
      calories: it.calories,
      protein_g: it.protein_g,
      carbs_g: it.carbs_g,
      fat_g: it.fat_g,
      source: "foto_ia" as const,
    }));
    const { error: itemsErr } = await supabase.from("meal_items").insert(items);
    if (itemsErr) {
      console.error("meal_items insert:", itemsErr);
      // Não falha a operação — apenas loga.
    }
  }

  // Linha da foto + resposta crua da IA.
  const { error: photoErr } = await supabase.from("meal_photos").insert({
    meal_id: mealRow.id,
    user_id: user.id,
    storage_path: storagePath,
    ai_raw_response: analysis as unknown,
  });

  if (photoErr) {
    console.error("meal_photos insert:", photoErr);
  }

  const signedUrl = await getSignedFileUrl(supabase, "meal-photos", storagePath);

  return NextResponse.json({
    ok: true,
    mealId: mealRow.id,
    signedUrl,
    analysis,
  });
}