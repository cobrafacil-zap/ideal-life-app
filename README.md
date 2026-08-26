# Vitta — Fase 1

App de gestão da vida pessoal (Saúde Física, Alimentação e Ciclo Menstrual),
construído com **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
+ **Supabase**.

A aplicação é **fullstack server-first** (Server Components + Server Actions)
e já está pronta para **computador e mobile**, com layouts distintos para
cada formato a partir do mesmo código.

---

## ✨ O que já funciona

- **Autenticação real** (cadastro, login, recuperação de senha) via Supabase Auth,
  com mensagens de erro acessíveis e tela de confirmação após cadastro.
- **Sessão persistente** entre recarregamentos, fechamento do navegador e
  dispositivos, com cookies `httpOnly` renovados pelo middleware.
- **Row Level Security** — cada usuário só enxerga os próprios dados.
- **Layout responsivo**:
  - **Mobile**: container estreito, **BottomNav** fixa com `safe-area-inset`.
  - **Desktop (≥ md)**: **Sidebar** fixa à esquerda com descrições das seções,
    conteúdo em duas colunas (`lg`), `max-width` controlado, scrollbar
    discreta e tipografia maior.
- **Home ("Hoje")** com layout em 2 colunas no desktop:
  - Check-in de energia/humor/disposição com presets rápidos (3, 5, 7, 9).
  - Anéis concêntricos mostrando a média geral de bem-estar.
  - Cartão de água com 3 atalhos (200/300/500 ml), mensagens contextuais
    ("atingida" / "faltam X L") e indicador textual em litros.
  - **Progresso de hoje** (5 metas) com `%`, "dia completo" e atalhos.
  - Resumo do dia em tiles interativos (treino, alimentação, cardio,
    peso, ciclo, água).
- **Saúde Física**:
  - Perfil físico (altura + meta de peso) com cálculo automático de IMC,
    classificação e disclaimer.
  - **Gráfico de evolução de peso** (Recharts) com grid, tooltip estilizado
    e **comparação com a medição anterior** (seta, + ou −).
  - Cardio com **tipo**, **intensidade** (leve / moderada / intensa) e
    duração, com progresso semanal e celebração da meta.
- **Alimentação**:
  - Header destacado com kcal total, contagem de refeições e média.
  - Formulário com **macros opcionais** (proteína, carbs, gordura).
  - Lista de refeições com **remoção segura** (confirmação antes de excluir).
- **Ciclo Menstrual**:
  - Card destaque com dia do ciclo, **fase atual** (folicular / ovulação /
    lútea / menstruação) e **previsão** da próxima menstruação.
  - Registro de novo ciclo com seletor de intensidade.
  - Sintomas de hoje com dor 0–10 e notas livres.
- **Perfil**:
  - Edição de **nome** e metas (água, cardio, treinos, calorias) com
    **validação** (limites por meta).
  - Prévia dos próximos módulos ("Minha vida") e logout.

## 🧠 Internos & UX (o que entrou nesta revisão)

- **Design system**
  - `Button` com 5 variantes, 3 tamanhos, ícones leading/trailing, `fullWidth`,
    `aria-busy`, foco visível.
  - `TextField` com `error`, `hint`, `trailingAdornment`, `aria-invalid` e
    `aria-describedby`.
  - `Card` + `CardHeader` (título / descrição / ação).
  - `ProgressBar` com `role="progressbar"` e celebração de meta.
  - `ProgressRings` com `role="img"` e label acessível.
  - `SummaryTile` interativo (opcional `onClick`).
  - `EmptyState` padronizado.
  - `SectionHeader` para títulos de página.
  - `cn()` centraliza classes (preparado para `tailwind-merge`).
- **Acessibilidade**: foco visível, `aria-current="page"` na nav,
  `aria-pressed` nos chips toggle, `role="radiogroup"` nos seletores de
  tipo/intensidade/fluxo, labels associados a inputs via `useId`,
  `prefers-reduced-motion` honrado.
- **Internacionalização e datas** centralizadas em `lib/format.ts`
  (`pt-BR`).
- **Validação de payloads** nas Server Actions (peso, intensidade, tipos de
  refeição, limites de metas).
- **Performance**: `dynamic = "force-dynamic"` nas páginas autenticadas
  para dados em tempo real; `display: "swap"` nas fontes; `reactStrictMode`.
- **SEO**: `metadataBase`, `title` template, Open Graph, Twitter Cards,
  `robots`, `themeColor` por `prefers-color-scheme`, `viewportFit: "cover"`,
  `favicon.svg` automático (App Router).
- **Detalhes de página**:
  - Saudação adaptativa ("Bom dia / Boa tarde / Boa noite").
  - Subtítulo da Home com data por extenso.
  - `aria-busy` em botões em loading.
  - `safe-area-inset` em todo o app (top + bottom).

## 🛣️ Próximas etapas (já preparadas no schema)

- Montagem completa de **treinos** (criar/editar planos, registrar séries,
  progressão de carga e recordes).
- **Análise de foto de refeição** por IA (a tabela `meal_photos` e o bucket
  já existem).
- **Minha evolução**: gráficos de 7/30/90/180/365 dias.
- **Gamificação** (badges).
- **Consultas médicas** (tabela já no schema).
- Módulos futuros em "Minha Vida": Finanças, Relacionamento, Casa,
  Trabalho, Estudos, Espiritualidade, Metas. A arquitetura modular
  (uma pasta de rota + `actions.ts` por módulo, tabelas com `user_id` + RLS)
  já suporta adicionar sem refatorar.

## 🚀 Como rodar localmente

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Crie um projeto gratuito em [supabase.com](https://supabase.com).

3. No SQL Editor do seu projeto Supabase, rode o conteúdo de
   `supabase/schema.sql`. Isso cria todas as tabelas, as policies de RLS e
   os buckets de storage.

4. Copie `.env.example` para `.env.local` e preencha com a URL e a chave
   `anon` do seu projeto (em **Project Settings → API**):
   ```bash
   cp .env.example .env.local
   ```
   Opcional: defina `NEXT_PUBLIC_SITE_URL` para a URL pública usada em
   metadados Open Graph.

5. Rode o app:
   ```bash
   npm run dev
   ```

6. Acesse `http://localhost:3000`, crie sua conta e comece a usar.

> Por padrão o Supabase exige confirmação de e-mail no cadastro. Para
> testar mais rápido em desenvolvimento, você pode desativar isso
> temporariamente em **Authentication → Providers → Email → Confirm email**.

## 📁 Estrutura do projeto

```
app/
  (auth)/login, signup, forgot-password    → páginas públicas (split-screen no desktop)
  (app)/hoje, saude, alimentacao, ciclo, perfil → páginas autenticadas
                                              (sidebar no desktop, bottom nav no mobile)
  icon.svg                                 → favicon gerado pelo App Router
  globals.css                              → base, foco visível, scrollbar, container helpers
components/
  BottomNav.tsx                            → navegação inferior mobile
  Sidebar.tsx                              → navegação lateral desktop
  nav-config.ts                            → fonte única de itens de menu
  SectionHeader.tsx, EmptyState.tsx        → primitives compartilhados
  ui/                                      → design system (Button, Card, TextField,
                                              ProgressBar, ProgressRings)
  home/SummaryTile.tsx                     → tile do resumo do dia
lib/
  supabase/                                → clientes (browser, server, middleware)
  format.ts                                → datas, números, helpers em pt-BR
  cn.ts                                    → wrapper de clsx
supabase/schema.sql                        → schema completo do banco + RLS + storage
types/database.ts                          → tipos das tabelas usadas no app
```

## 🎨 Design

- Cores: fundo `#FAFAF8`, laranja **Ember** `#FF6A39` (energia),
  verde **Moss** `#2F6B4F` (saúde/progresso).
- Tipografia: **Sora** (títulos), **Inter** (texto), **IBM Plex Mono**
  (números — peso, kcal, kg).
- Elemento de assinatura: **anéis de progresso concêntricos**, usados no
  check-in do dia e reaproveitados como linguagem visual em outros
  indicadores.

## Próxima mensagem sugerida

Diga "continue com o módulo de treinos" (ou o módulo que preferir) para eu
seguir a implementação: criação de planos de treino, execução guiada com
registro de séries, progressão de carga e recordes — módulo por módulo,
sempre com tabela + RLS + telas conectadas de verdade ao banco, como
pedido.
