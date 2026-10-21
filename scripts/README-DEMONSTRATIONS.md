# GIFs demonstrativos de exercício

Cada exercício do catálogo tem uma animação curta em loop (≤ 8 s, sem áudio)
mostrando o movimento correto. A arte principal vem do **Wikimedia Commons**:
as ilustrações da série *"Weight training diagrams"*, que usam personagem
anatômico e mostram **o equipamento/máquina do exercício sempre visível**
(o puxador alto, o leg press, a cadeira extensora, a máquina adutora…).

## Estrutura

| Caminho | O que é |
|---|---|
| `public/exercises-gifs/*.gif` | 106 GIFs (um por exercício), 360 × 360 |
| `public/exercises-gifs/manifest.json` | Mapa exercício → GIF + motion + equipamento + `source` |
| `scripts/wikimedia-media.json` | Inventário das ilustrações do Commons (base → frames) |
| `supabase/migrations/20261020_populate_demonstration_gifs.sql` | Popula `demonstration_url` de todos os exercícios |
| `lib/exercise-utils.ts` | `hasDemonstration()` / `getDemonstrationUrl()` |
| `components/ui/DemonstrationMedia.tsx` | Renderiza GIF/vídeo em loop, sem cortar o movimento |

## Fontes da arte

| Fonte | Exercícios | Observação |
|---|---|---|
| `wiki` | 96 | Ilustração anatômica do Commons, com a máquina visível |
| `local` | 10 | Vetor gerado por código (cardio genérico, prancha, kettlebell…) |

Os 10 exercícios sem equivalente no Commons (`Caminhada`, `Caminhada com
elástico`, `Corrida`, `Elíptico`, `Esteira`, `Glúteo na máquina`, `Prancha`,
`Pular corda`, `Russian twist`, `Swing de kettlebell`) usam o vetor local —
cada um com **movimento e equipamento próprios** (`SPECIAL_MOTIONS`), nunca
uma animação genérica.

## Como o GIF é montado

1. **Download** — `scripts/exercise_media.py` busca os dois frames da
   ilustração (pose inicial e pose final) no Commons
   (`Special:FilePath/<arquivo>?width=720`) e guarda em `.cache/wikimedia/`.
2. **Morph** — as duas poses são combinadas com *posterização do canal alfa*:
   o alfa interpolado é cortado num limiar, então o traço fica nítido e as
   duas poses não se duplicam no meio do movimento (sem “fantasma”). O
   crossfade é concentrado em ~1/3 da transição, para o trilho da máquina
   não ficar duplicado durante o movimento inteiro.
3. **Encode** — 6 s a 12 fps, loop infinito, sem áudio, fundo opaco
   (`#F7F5F0`), paleta compartilhada de 64 cores (o arquivo fica ~40% menor
   sem perda visível).

## Como é servido

1. O GIF é **asset estático** em `/exercises-gifs/<slug>.gif` (CDN do Vercel).
   Sem signed URL, sem chamada ao Storage por exercício.
2. O banco guarda apenas o path em `exercises.demonstration_url`
   (+ `demonstration_type = 'gif'`).
3. O front busca automaticamente: `ExercisePicker` (cards),
   `ExerciseDetailModal` (detalhe) e `ExerciseLibrary` renderizam via
   `DemonstrationMedia`, com `object-contain` para não cortar o movimento.
   A imagem estática continua só como thumbnail.

## Pipelines

```bash
# 1. (opcional) Inventário das ilustrações do Commons → wikimedia-media.json
python3 scripts/wikimedia_catalog.py

# 2. Exporta o catálogo real do banco (name, category, equipment)
python3 scripts/export_exercise_catalog.py --from-db

# 3. Gera os GIFs + manifest.json
python3 scripts/generate_exercise_demos.py

# 3b. Variantes do gerador
python3 scripts/generate_exercise_demos.py --source local   # só o vetor local
python3 scripts/generate_exercise_demos.py --only "remada"   # filtra por nome
python3 scripts/generate_exercise_demos.py --dry-run         # só o mapeamento

# 4. Gera a migration que popula demonstration_url
python3 scripts/emit_demonstration_migration.py

# 5a. Aplica a migration via RPC execute_sql
python3 scripts/apply_demonstration_migration.py

# 5b. (alternativa) rodar o .sql no SQL Editor do Supabase
#     supabase/migrations/20261020_populate_demonstration_gifs.sql

# 5c. (alternativa) subir para o bucket privado e gravar no banco
python3 scripts/upload_exercise_demos.py   # requer SUPABASE_SERVICE_ROLE_KEY
```

### Instruções de execução

O detalhe do exercício mostra o bloco **"Como executar"** depois das
séries/reps. O texto de cada movimento fica em
`scripts/exercise_instructions.py` e é gravado no catálogo pela migration
`20261021_populate_exercise_instructions.sql`.

```bash
python3 scripts/populate_instructions.py           # só gera a migration
python3 scripts/populate_instructions.py --apply   # gera e aplica
python3 scripts/populate_instructions.py --verify  # confere o estado
```

### Administração do banco

`scripts/supabase_admin.py` cria (sob demanda) um RPC auxiliar que devolve
linhas em JSON — o `execute_sql` do projeto engole erros e sempre responde
`"OK"`, o que impede confirmar o resultado de um `DELETE`.

```bash
python3 scripts/supabase_admin.py query "select count(*) from public.exercises"
python3 scripts/supabase_admin.py cleanup-demo-data   # remove conta/plano de teste
python3 scripts/supabase_admin.py drop-rpc             # remove o RPC auxiliar
```

## Requisitos

```bash
python3 -m pip install Pillow requests
```

A API do Wikimedia faz *rate limiting*: as chamadas são feitas em lotes de
≤ 40 títulos, com retry e backoff, e o User-Agent é identificado.

## Especificações dos GIFs

- 360 × 360 px (canvas quadrado, nada é cortado)
- 6 s a 12 fps — abaixo do limite de 8 s
- Loop infinito (`loop=0`), sem áudio, `disposal=2`
- ~122 KB em média (maior: ~409 KB), 12,6 MB no total
