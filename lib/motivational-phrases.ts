/**
 * Frases motivacionais curtas em pt-BR para o header da Home.
 *
 * Determinísticas por dia do ano: a mesma data sempre retorna a mesma frase,
 * sem chamadas de IA e sem flicker entre SSR e client.
 */

export const MOTIVATIONAL_PHRASES: readonly string[] = [
  "Hidratação é autocuidado em forma de hábito.",
  "Pequenos passos diários viram grandes resultados.",
  "Seu corpo registra cada escolha — escolha com cuidado.",
  "Movimento é remédio. Dose: o que você consegue hoje.",
  "Respirar fundo também conta no treino.",
  "Cada refeição é informação para o seu corpo.",
  "Hoje é uma boa oportunidade para ser gentil com você.",
  "Consistência vence intensidade, sempre.",
  "Um passo de cada vez. Sem pressa, sem pausa.",
  "Seu bem-estar não é-meta — é construção diária.",
  "Você não precisa ser perfeito, só presente.",
  "A melhor rotina é aquela que você consegue manter.",
  "Descanse quando precisar. Continue quando puder.",
  "Seu corpo merece atenção hoje, não só amanhã.",
  "Força não é o que você faz uma vez — é o que você repete.",
  "A água muda tudo: humor, fome, foco.",
  "Comer com atenção é comer melhor.",
  "Você já fez a parte mais difícil: começou.",
  "O progresso está no detalhe que ninguém vê.",
  "Se o corpo fala, ouve. Se a mente cansa, abranda.",
  "Não compare seu dia 1 com o dia 100 de ninguém.",
  "Saúde é a soma de milhares de escolhas silenciosas.",
  "Sono, comida, movimento, presença — quatro pilares simples.",
  "Você é mais forte do que estava pensando há 5 minutos.",
  "Cuide de quem te carrega todos os dias.",
  "A melhor versão de você é a versão descansada.",
  "Recomeçar também é avançar.",
  "Anotar é transformar em dado. Dado vira direção.",
  "Hoje valeu. Você apareceu, e isso importa.",
  "Um plano simples, executado, vale mais que um plano perfeito.",
  "Respire. Hidrate. Caminhe. Repita.",
  "Você não precisa de mais um motivo para cuidar de si.",
  "Compaixão por si mesmo não é fraqueza, é estratégia.",
  "Cada marca no gráfico é uma vitória pequena e real.",
  "O melhor treino é o que você termina. A melhor dieta é a que sustenta.",
];

/**
 * Devolve a frase do dia para uma data YYYY-MM-DD.
 * Mesma data → mesma frase; roda entre anos é estável.
 */
export function phraseForDate(dateISO: string): string {
  const n = Number(dateISO.replaceAll("-", "")); // "2026-08-26" → 20260826
  const len = MOTIVATIONAL_PHRASES.length;
  // Hash simples (determinístico, barato). Use % len para mapear no array.
  const idx = ((n * 2654435761) >>> 0) % len;
  return MOTIVATIONAL_PHRASES[idx];
}