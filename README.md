# Vitta — Fase 1

App de gestão da vida pessoal (Saúde Física, Alimentação e Ciclo Menstrual), construído
com Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase.

## O que já funciona nesta fase

- **Autenticação real** (cadastro, login, recuperação de senha) via Supabase Auth.
- **Sessão persistente** entre recarregamentos, fechamento do navegador e dispositivos
  (cookies httpOnly renovados pelo middleware).
- **Row Level Security**: cada usuário só enxerga seus próprios dados.
- **Home ("Hoje")**: check-in de energia/humor/disposição, contador de água com botões
  rápidos, resumo do dia (treino, alimentação, cardio, peso, ciclo), progresso diário.
- **Saúde Física**: perfil físico com cálculo de IMC, histórico e gráfico de peso, registro
  de cardio com meta semanal.
- **Alimentação**: registro rápido de refeições por tipo, total de calorias do dia,
  histórico do dia.
- **Ciclo Menstrual**: registro de novo ciclo, cálculo automático do dia do ciclo, previsão
  simples da próxima menstruação com base na média dos ciclos, registro diário de dor e
  sintomas.
- **Perfil**: edição de metas (água, cardio, treinos, calorias), logout.

Tudo isso já está ligado ao banco — nenhum dado é apenas mockado.

## O que ainda não foi construído (próximas etapas, arquitetura já preparada)

- Montagem completa de treinos (criar/editar planos, exercícios, séries, execução guiada,
  progressão de carga sugerida, recordes, variações de exercício).
- Análise de foto de refeição por IA (a tabela `meal_photos` e o bucket de storage já
  existem; falta a integração com um modelo de visão).
- Gráficos de "Minha evolução" com filtros de período (7/30/90/180/365 dias).
- Gamificação (badges).
- Consultas médicas (tabela `medical_appointments` já existe no schema).
- Módulos futuros: Finanças, Relacionamento, Casa, Trabalho, Estudos, Espiritualidade,
  Metas — a seção "Minha Vida" já está reservada no Perfil e a arquitetura modular
  (uma pasta de rota + actions.ts por módulo, tabelas com `user_id` + RLS) já suporta
  adicioná-los sem refatorar o restante do app.

## Como rodar localmente

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Crie um projeto gratuito em [supabase.com](https://supabase.com).

3. No SQL Editor do seu projeto Supabase, rode o conteúdo de `supabase/schema.sql`.
   Isso cria todas as tabelas, as policies de RLS e os buckets de storage.

4. Copie `.env.example` para `.env.local` e preencha com a URL e a chave `anon` do seu
   projeto (em **Project Settings → API**):
   ```bash
   cp .env.example .env.local
   ```

5. Rode o app:
   ```bash
   npm run dev
   ```

6. Acesse `http://localhost:3000`, crie sua conta e comece a usar.

> Por padrão o Supabase exige confirmação de e-mail no cadastro. Para testar mais rápido
> em desenvolvimento, você pode desativar isso temporariamente em
> **Authentication → Providers → Email → Confirm email**.

## Estrutura do projeto

```
app/
  (auth)/login, signup, forgot-password      → páginas públicas de autenticação
  (app)/hoje, saude, alimentacao, ciclo, perfil → páginas autenticadas (cada uma com
                                                    seu page.tsx, actions.ts e componentes)
components/ui/                                → design system (Card, Button, TextField,
                                                    ProgressBar, ProgressRings)
components/BottomNav.tsx                      → navegação inferior mobile
lib/supabase/                                 → clientes Supabase (browser, server, middleware)
supabase/schema.sql                           → schema completo do banco + RLS + storage
types/database.ts                             → tipos das tabelas usadas no app
```

## Design

- Cores: fundo `#FAFAF8`, laranja "Ember" `#FF6A39` (energia), verde "Moss" `#2F6B4F`
  (saúde/progresso).
- Tipografia: Sora (títulos), Inter (texto), IBM Plex Mono (números — peso, kcal, kg).
- Elemento de assinatura: anéis de progresso concêntricos, usados no check-in do dia e
  reaproveitados como linguagem visual em outros indicadores.

## Próxima mensagem sugerida

Diga "continue com o módulo de treinos" (ou o módulo que preferir) para eu seguir a
implementação: criação de planos de treino, execução guiada com registro de séries,
progressão de carga e recordes — módulo por módulo, sempre com tabela + RLS + telas
conectadas de verdade ao banco, como pedido.
