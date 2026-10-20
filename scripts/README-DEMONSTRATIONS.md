# GIFs demonstrativos de exercício

Cada exercício do catálogo tem uma animação curta em loop (≤ 8 s, sem áudio)
mostrando o movimento. É o mesmo estilo visual das silhuetas já usadas no app
(stick figure, cabeça `#E76F51`, cor do traço por grupo muscular).

## Estrutura

| Caminho | O que é |
|---|---|
| `public/exercises-gifs/*.gif` | 216 GIFs (95 arquivos únicos de conteúdo) |
| `public/exercises-gifs/manifest.json` | Mapa exercício → GIF + motion + equipamento |
| `supabase/migrations/20261020_populate_demonstration_gifs.sql` | Popula `demonstration_url` de todos os exercícios |
| `lib/exercise-utils.ts` | `hasDemonstration()` / `getDemonstrationUrl()` |
| `components/ui/DemonstrationMedia.tsx` | Renderiza GIF/vídeo em loop, sem cortar o movimento |

## Como funciona

1. O GIF é gerado por código (`scripts/generate_exercise_demos.py`) — é
   determinístico, então dá para reproduzir a qualquer momento.
2. O GIF é servido como **asset estático** em `/exercises-gifs/<slug>.gif`
   (CDN do Vercel). Sem signed URL, sem chamada ao Storage por exercício.
3. O banco guarda apenas o path em `exercises.demonstration_url`
   (+ `demonstration_type = 'gif'`).
4. O front busca automaticamente: `ExercisePicker` (cards) e
   `ExerciseDetailModal` (página de detalhes) renderizam via
   `DemonstrationMedia`, com `object-contain` para não cortar o movimento.

## Classificação dos movimentos

Cada exercício é mapeado por **padrão de movimento** + **equipamento**:

- 26 motions: `squat`, `hinge`, `lunge`, `push`, `bench_press`, `pull`,
  `row`, `curl`, `extend`, `lateral_raise`, `overhead_press`, `abduct`,
  `hip_flex`, `bridge`, `calf_raise`, `plank`, `crunch`, `leg_raise`, `fly`,
  `shrug`, `dip`, `twist`, `cardio`, `stretch`, `kettlebell_swing`, `leg_press`,
  `row_machine`
- 6 equipamentos: `none`, `bar`, `dumbbell`, `cable`, `band`, `kettlebell`,
  `machine`

Exercícios com o mesmo triplet (motion, equipamento, grupo muscular) compartilham
o mesmo arquivo GIF — por isso 216 exercícios cabem em 95 arquivos.

## Pipelines

```bash
# 1. Extrai o catálogo (name, category, equipment) das migrations SQL
python3 scripts/export_exercise_catalog.py

# 2. Gera os GIFs + manifest.json
python3 scripts/generate_exercise_demos.py

# 3. Gera a migration que popula demonstration_url
python3 scripts/emit_demonstration_migration.py

# 4a. Aplica a migration via RPC execute_sql
python3 scripts/apply_demonstration_migration.py

# 4b. (alternativa) rodar o .sql no SQL Editor do Supabase
#     supabase/migrations/20261020_populate_demonstration_gifs.sql

# 4c. (alternativa) subir para o bucket privado e gravar no banco
python3 scripts/upload_exercise_demos.py   # requer SUPABASE_SERVICE_ROLE_KEY
```

## Requisitos

```bash
python3 -m pip install Pillow requests
```

`apply_demonstration_migration.py` usa apenas a **anon key** (a função
`execute_sql` roda no servidor). `upload_exercise_demos.py` exige a
**service role key** porque escreve no catálogo global (`user_id IS NULL`),
ignorado pela RLS.

## Especificações dos GIFs

- 360 × 360 px
- 6 s a 12 fps (72 frames) — abaixo do limite de 8 s
- Loop infinito, sem áudio, `disposal=2` (quadro limpo por frame)
- ~111 KB em média
