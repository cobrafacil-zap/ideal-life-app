# SMKPI

Aplicativo de acompanhamento de **metas pessoais e profissionais** — o quanto
você já avançou, o que falta e o que precisa de atenção agora.

![SMKPI](https://img.shields.io/badge/Next.js-14-4F46E5) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38BDF8) ![Supabase](https://img.shields.io/badge/Supabase-2F6F4E)

---

## ✨ O que já funciona

| Área | Detalhes |
| --- | --- |
| **Dashboard** | Metas ativas, concluídas, atrasadas e próximas do prazo, progresso geral, resumo pessoal × profissional, gráfico de evolução (12 semanas) e prioridades da semana |
| **Metas** | CRUD completo, filtros (categoria, status, prioridade, período), busca, ordenação, Modos de acompanhamento (valor, etapas ou misto), metas anuais/mensais/semanais/sem prazo e vínculo entre metas |
| **Progresso** | Cálculo automático (aumentar/reduzir), histórico de atualizações com gráfico de linha, “falta X”, ritmo (adiantada / em dia / atrasada) e barra de prazo decorrido |
| **Etapas** | Checklist por meta; concluída uma etapa, o percentual da meta sobe |
| **Hábitos** | Calendário mensal de marcação, sequência (streak), adesão semanal e vínculo com metas |
| **Calendário** | Prazos, inícios, etapas concluídas, hábitos e conquistas em uma grade mensal + painel do dia |
| **Minha Evolução** | Resumo motivacional do ano, metas concluídas por mês, percentual por categoria, comparativo pessoal × profissional e timeline do que já foi conquistado |
| **Meu Ano** | Visão panorâmica do ano com progresso por âmbito e distribuição mensal |
| **Meus Sonhos** | Sonhos com foto, valor estimado e prazo desejado; transformação de sonho em meta |
| **Conquistas** | 12 medalhas automáticas (primeira meta, 7 dias de constância, primeira meta financeira, etc.) com progresso para desbloquear |
| **Notificações** | Lembretes no sino: meta parada há N dias, prazo próximo, quase concluída e atrasada |
| **Configurações** | Perfil, moeda, tema (claro/escuro/sistema), preferências de lembrete, CRUD de categorias, backup JSON (exportar/importar) e restauração dos dados de demonstração |

## 🚀 Começando

```bash
npm install
cp .env.example .env.local   # preencha as chaves do Supabase
npm run dev                   # http://localhost:3000
```

Ao abrir pela primeira vez, o app já vem **carregado com dados de demonstração**
(16 metas, 9 categorias, 6 hábitos, 5 sonhos e histórico de progresso) para você
ver como tudo funciona. Tudo funciona offline, em `localStorage`.

### Build

```bash
npm run build && npm start
```

## 🗄️ Supabase (opcional, habilita login + sync)

O app funciona **sem backend** no modo demonstração. Para sincronizar entre
dispositivos e ter login:

1. Aplique a migration `supabase/migrations/20261021_smkpi_goals_schema.sql`
   (SQL Editor do Supabase ou `supabase db push`).
2. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Em *Authentication → Providers*, ative **Google** (e/ou *Email*) para o
   botão “Entrar com Google”.
4. Em *Authentication → URL Configuration*, cadastre o redirect da aplicação.

A camada de persistência (`src/lib/data/`) isola o backend: `storage.ts` (local)
e `backend.ts` (Supabase). Trocar de um para o outro não toca no resto do app.

## 🤖 Google AI (Gemini) — opcional

Definindo `GOOGLE_API_KEY` (https://aistudio.google.com/apikey) o app passa a
oferecer sugestões inteligentes (sugerir etapas para uma meta, decompor um
sonho em metas, analisar a evolução da semana). Sem a chave, o app funciona
normalmente — a IA é apenas um extra.

## 🧱 Estrutura

```
src/
  app/                     # rotas (App Router)
    page.tsx               # dashboard
    metas/                 # lista + detalhe da meta
    habitos/               # hábitos + calendário
    calendario/            # agenda
    evolucao/              # minha evolução
    ano/                   # meu ano
    sonhos/                # meus sonhos
    conquistas/            # medalhas
    configuracoes/         # perfil, categorias, dados
  components/
    layout/                # sidebar, topbar, navegação mobile
    ui/                    # primitives (Button, Card, Progress, Modal…)
    charts/                # gráficos Recharts (tema claro/escuro)
    goals/                 # card, formulário, etapas, atualização
  lib/
    types.ts               # domínio
    progress.ts            # cálculo de progresso, prazos, ritmo
    selectors.ts           # métricas do dashboard, séries dos gráficos, lembretes
    achievements.ts        # catálogo de conquistas
    seed.ts                # dados de demonstração
    data/                  # store (React Context) + backends local/Supabase
```

## 🧭 Roadmap

- [ ] PWA (instalável, offline) e app mobile (React Native / Expo)
- [ ] Notificações push e e-mails de lembrete
- [ ] Relatórios PDF e compartilhamento social
- [ ] Integração com Google Calendar
- [ ] Assistente IA com Gemini em mais fluxos
