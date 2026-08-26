import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Wrapper do Gemini 2.5 Flash para análise de imagem de prato.
 *
 * Espera JSON estrito no schema:
 * {
 *   total_calories, total_protein_g, total_carbs_g, total_fat_g,
 *   items: [{ name, quantity_g, calories, protein_g, carbs_g, fat_g }]
 * }
 */

let cachedClient: GoogleGenerativeAI | null = null;

/**
 * Indica se a chave do Gemini está configurada no ambiente.
 * A UI / API usam isso para esconder o card de "Foto por IA" antes
 * do usuário tentar usar — sem precisar instanciar o cliente.
 */
export function isGeminiConfigured(): boolean {
  return !!process.env.GOOGLE_API_KEY;
}

export function getGeminiClient(): GoogleGenerativeAI {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) {
    throw new Error(
      "GOOGLE_API_KEY não configurada. Defina a variável de ambiente.",
    );
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenerativeAI(key);
  }
  return cachedClient;
}

export const MEAL_ANALYSIS_PROMPT = `Você é um nutricionista brasileiro analisando uma foto de prato.
Responda APENAS com JSON válido (sem markdown, sem explicações), exatamente neste schema:

{
  "total_calories": number,
  "total_protein_g": number,
  "total_carbs_g": number,
  "total_fat_g": number,
  "items": [
    {
      "name": string,
      "quantity_g": number,
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number
    }
  ]
}

Regras:
- Estime porções em gramas e calcule totais (kcal = P×4 + C×4 + G×9).
- Se não conseguir identificar um item, faça a melhor estimativa e indique confiança baixa com nome genérico.
- Use nomes em português do Brasil.`;

export type MealAnalysisItem = {
  name: string;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type MealAnalysis = {
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  items: MealAnalysisItem[];
};

function extractFirstJson(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  // encontrar o último } balanceado
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function coerceNumber(x: unknown, fallback = 0): number {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string") {
    const n = Number(x.replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

/**
 * Envia a imagem para o Gemini 2.5 Flash e devolve a análise nutricional.
 * `mimeType` deve ser um dos: image/png, image/jpeg, image/webp.
 */
export async function analyzeMealImage(
  base64: string,
  mimeType: "image/png" | "image/jpeg" | "image/webp",
): Promise<MealAnalysis> {
  const gen = getGeminiClient();
  const model = gen.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent([
    { inlineData: { mimeType, data: base64 } },
    { text: MEAL_ANALYSIS_PROMPT },
  ]);

  const text = result.response.text();
  const json = extractFirstJson(text);
  if (!json) {
    throw new Error("IA não retornou JSON válido.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    throw new Error(`JSON inválido da IA: ${(err as Error).message}`);
  }

  const obj = parsed as Partial<MealAnalysis> & {
    items?: Partial<MealAnalysisItem>[];
  };

  const items: MealAnalysisItem[] = (obj.items ?? []).map((it) => ({
    name: String(it.name ?? "Item sem nome"),
    quantity_g: coerceNumber(it.quantity_g),
    calories: coerceNumber(it.calories),
    protein_g: coerceNumber(it.protein_g),
    carbs_g: coerceNumber(it.carbs_g),
    fat_g: coerceNumber(it.fat_g),
  }));

  return {
    total_calories: coerceNumber(obj.total_calories),
    total_protein_g: coerceNumber(obj.total_protein_g),
    total_carbs_g: coerceNumber(obj.total_carbs_g),
    total_fat_g: coerceNumber(obj.total_fat_g),
    items,
  };
}
