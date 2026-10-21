"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Camada de IA (Google Gemini).
 *
 * É opcional: sem `GOOGLE_API_KEY` as funções retornam `available: false` e a
 * interface simplesmente esconde/Desabilita os botões de IA. Nenhuma chamada é
 * feita no cliente — a chave nunca é exposta ao browser.
 */

const MODEL = "gemini-1.5-flash";

export interface AiResult<T> {
  available: boolean;
  data: T | null;
  message: string;
}

function client(): GoogleGenerativeAI | null {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) return null;
  try {
    return new GoogleGenerativeAI(key);
  } catch {
    return null;
  }
}

async function ask<T>(prompt: string, fallback: T): Promise<AiResult<T>> {
  const gen = client();
  if (!gen) {
    return {
      available: false,
      data: null,
      message:
        "IA indisponível: defina GOOGLE_API_KEY no ambiente para habilitar as sugestões.",
    };
  }
  try {
    const model = gen.getGenerativeModel({
      model: MODEL,
      generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const json = extractJson<T>(text);
    if (!json) {
      return { available: true, data: fallback, message: "Resposta não interpretável." };
    }
    return { available: true, data: json, message: "ok" };
  } catch (error) {
    console.error("[smkpi] IA indisponível:", error);
    return {
      available: false,
      data: null,
      message: "Não consegui falar com o Gemini agora. Tente novamente em instantes.",
    };
  }
}

function extractJson<T>(text: string): T | null {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

/** Sugere etapas (subtasks) para uma meta. */
export async function suggestSteps(input: {
  title: string;
  description?: string;
  category?: string;
  dueDate?: string | null;
}): Promise<AiResult<{ steps: string[] }>> {
  const prompt = `Você é um strategist de metas. Responda APENAS com JSON no formato {"steps": ["..."]}.
Gere de 4 a 7 etapas objetivas, acionáveis e em ordem cronológica para a meta abaixo.

Meta: ${input.title}
Categoria: ${input.category ?? "geral"}
Descrição: ${input.description ?? "-"}
Prazo: ${input.dueDate ?? "sem prazo"}`;
  return ask<{ steps: string[] }>(prompt, { steps: [] });
}

/** Transforma um sonho em sugestões de metas acionáveis. */
export async function suggestGoalsFromDream(input: {
  title: string;
  description?: string;
  estimatedValue?: number | null;
}): Promise<AiResult<{ goals: Array<{ title: string; description: string; metricTarget: number | null; metricUnit: string }> }>> {
  const prompt = `Você é um coach de objetivos. Responda APENAS com JSON no formato {"goals": [{"title":"","description":"","metricTarget":0,"metricUnit":""}]}.
Transforme o sonho abaixo em 3 metas acionáveis e mensuráveis. metricTarget deve ser um número ou null quando não houver métrica clara (metricUnit vazio quando null).

Sonho: ${input.title}
Descrição: ${input.description ?? "-"}
Valor estimado: ${input.estimatedValue ?? "não informado"}`;
  return ask(prompt, { goals: [] });
}

/** Analisa o desempenho da semana e devolve um insight curto. */
export async function analyzeProgress(input: {
  overall: number;
  ativas: number;
  concluidas: number;
  atrasadas: number;
  proximas: number;
  goals: Array<{ title: string; progress: number; deadline: string; priority: string }>;
}): Promise<AiResult<{ headline: string; bullets: string[]; focus: string }>> {
  const prompt = `Você é um coach de produtividade que analiza metas. Responda APENAS com JSON no formato {"headline":"","bullets":["..."],"focus":""}.
Seja específico, curto e motivador (pt-BR). Máximo de 4 bullets.

Progresso geral: ${Math.round(input.overall)}%
Metas ativas: ${input.ativas} · concluídas: ${input.concluidas} · atrasadas: ${input.atrasadas} · próximas do prazo: ${input.proximas}

Metas:
${input.goals
  .map((g) => `- ${g.title}: ${Math.round(g.progress)}% · prazo ${g.deadline} · prioridade ${g.priority}`)
  .join("\n")}`;
  return ask(prompt, { headline: "", bullets: [], focus: "" });
}
