#!/usr/bin/env python3
"""
VITTA — Popula `instructions` (como executar) dos exercícios do catálogo.

O detalhe do exercício mostra o bloco "Como executar" logo depois das
séries/repetições, mas 84 dos 106 exercícios do catálogo global estavam com
o campo vazio. Este script gera a migration com o texto de cada movimento
e aplica no Supabase via RPC `execute_sql`.

Uso:
    python3 scripts/populate_instructions.py            # só gera a migration
    python3 scripts/populate_instructions.py --apply    # gera e aplica
    python3 scripts/populate_instructions.py --verify   # confere o estado
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from exercise_instructions import INSTRUCTIONS  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "supabase" / "migrations" / "20261021_populate_exercise_instructions.sql"


def sql_str(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def build_sql() -> str:
    ordered = sorted(INSTRUCTIONS.items(), key=lambda kv: kv[0].lower())
    lines = []
    for i, (name, text) in enumerate(ordered):
        comma = "," if i < len(ordered) - 1 else ""
        lines.append(f"    ({sql_str(name)}, {sql_str(text)}){comma}")
    values = "\n".join(lines)

    return f"""/* =========================================================================
   VITTA - Popula as instruções de execução do catálogo global
   instructions: como executar o movimento (passos + cues)

   Gerado por scripts/populate_instructions.py
   ({len(ordered)} exercícios)
   ========================================================================= */

UPDATE public.exercises AS e
   SET instructions = t.txt
  FROM (VALUES
{values}
  ) AS t(name, txt)
 WHERE LOWER(TRIM(e.name)) = LOWER(TRIM(t.name))
   AND e.user_id IS NULL;

-- Relatório: quantos exercícios têm instruções.
DO $$
DECLARE
  total INT;
  com_instr INT;
BEGIN
  SELECT COUNT(*) INTO total FROM public.exercises WHERE user_id IS NULL;
  SELECT COUNT(*) INTO com_instr FROM public.exercises
   WHERE user_id IS NULL AND instructions IS NOT NULL AND instructions <> '';
  RAISE NOTICE 'Catálogo global: % exercícios, % com instruções (%)',
    total, com_instr, ROUND(100.0 * com_instr / GREATEST(total, 1));
END $$;
"""


def main() -> int:
    ap = argparse.ArgumentParser(description="Popula as instruções de execução")
    ap.add_argument("--apply", action="store_true", help="Aplica no Supabase")
    ap.add_argument("--verify", action="store_true", help="Só confere o estado")
    args = ap.parse_args()

    OUT.write_text(build_sql(), encoding="utf-8")
    print(f"Migration gerada: {OUT.relative_to(ROOT)} ({len(INSTRUCTIONS)} exercícios)")

    if args.verify:
        import supabase_admin

        rows = supabase_admin.query(
            "select count(*)::int as total, "
            "count(instructions) filter (where instructions is not null and instructions <> '')::int as com_instr "
            "from public.exercises where user_id is null"
        )
        print("Estado:", rows)
        return 0

    if args.apply:
        import supabase_admin

        supabase_admin.exec_sql(build_sql())
        print("Aplicado.")
        rows = supabase_admin.query(
            "select count(*)::int as total, "
            "count(instructions) filter (where instructions is not null and instructions <> '')::int as com_instr "
            "from public.exercises where user_id is null"
        )
        print("Verificação:", rows)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
