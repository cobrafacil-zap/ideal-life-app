#!/usr/bin/env python3
"""
VITTA — Gera a migration que popula `demonstration_url` de TODOS os
exercícios do catálogo com o GIF correspondente.

Os GIFs são servidos como asset estático em `/exercises-gifs/<slug>.gif`
(CDN do Vercel), então o banco só precisa guardar o path — nenhuma
chamada ao Storage, nenhuma signed URL por exercício.

Uso:
    python3 scripts/emit_demonstration_migration.py

Saída:
    supabase/migrations/20261020_populate_demonstration_gifs.sql
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "public" / "exercises-gifs" / "manifest.json"
OUT = ROOT / "supabase" / "migrations" / "20261020_populate_demonstration_gifs.sql"

BUCKET_DIR = "/exercises-gifs"


def sql_str(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def main() -> int:
    if not MANIFEST.exists():
        raise SystemExit(
            f"ERRO: {MANIFEST} não encontrado.\n"
            "      Rode antes: python3 scripts/generate_exercise_demos.py"
        )

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

    # (nome do exercício, path do gif) — dedup por nome.
    pairs: dict[str, str] = {}
    for m in manifest:
        name = m["name"].strip()
        if not name:
            continue
        pairs.setdefault(name, f"{BUCKET_DIR}/{m['file']}")

    lines: list[str] = []
    ordered = sorted(pairs.items(), key=lambda kv: kv[0].lower())
    for i, (name, path) in enumerate(ordered):
        comma = "," if i < len(ordered) - 1 else ""
        lines.append(f"    ({sql_str(name)}, {sql_str(path)}){comma}")

    values_block = "\n".join(lines)

    sql = f"""/* =========================================================================
   VITTA - Popula a demonstração animada de TODOS os exercícios
   demonstration_url: path do GIF em /exercises-gifs/<slug>.gif
   demonstration_type: 'gif'

   Os GIFs são estáticos no app (servidos pelo CDN), então o path é
   suficiente — sem signed URL e sem chamada ao Storage.

   Gerado por scripts/emit_demonstration_migration.py
   ({len(pairs)} exercícios)
   ========================================================================= */

UPDATE public.exercises AS e
   SET demonstration_url = t.gif_path,
       demonstration_type = 'gif'
  FROM (VALUES
{values_block}
  ) AS t(name, gif_path)
 WHERE LOWER(TRIM(e.name)) = LOWER(TRIM(t.name));

-- Relatório: quantos exercícios ainda estão sem demonstração.
DO $$
DECLARE
  total INT;
  com_demo INT;
BEGIN
  SELECT COUNT(*) INTO total FROM public.exercises WHERE user_id IS NULL;
  SELECT COUNT(*) INTO com_demo FROM public.exercises
   WHERE user_id IS NULL AND demonstration_url IS NOT NULL;
  RAISE NOTICE 'Catálogo global: % exercícios, % com GIF demonstrativo (%)',
    total, com_demo, ROUND(100.0 * com_demo / GREATEST(total, 1));
END $$;
"""

    OUT.write_text(sql, encoding="utf-8")
    print(f"Migration gerada: {OUT.relative_to(ROOT)}")
    print(f"  {len(pairs)} exercícios mapeados")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
