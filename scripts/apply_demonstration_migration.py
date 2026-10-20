#!/usr/bin/env python3
"""
VITTA — Aplica a migration que popula a demonstração animada de TODOS os
exercícios do catálogo.

Usa a função RPC `execute_sql(sql_text TEXT)` criada no Supabase, então
basta ter a URL + anon key (já estão no Vercel).

Uso:
    python3 scripts/apply_demonstration_migration.py
    python3 scripts/apply_demonstration_migration.py --dry-run

Alternativa: rodar o arquivo
    supabase/migrations/20261020_populate_demonstration_gifs.sql
no SQL Editor do Supabase (é idempotente).
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
MIGRATION = ROOT / "supabase" / "migrations" / "20261020_populate_demonstration_gifs.sql"


def load_env() -> tuple[str, str]:
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_ANON_KEY")

    if not url or not key:
        for fname in (".env.local", ".vercel-env.tmp"):
            p = ROOT / fname
            if not p.exists():
                continue
            for line in p.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                v = v.strip().strip('"').strip("'")
                k = k.strip()
                if k == "NEXT_PUBLIC_SUPABASE_URL" and not url:
                    url = v
                if k == "NEXT_PUBLIC_SUPABASE_ANON_KEY" and not key:
                    key = v

    if not url or not key:
        raise SystemExit(
            "ERRO: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
        )
    return url.rstrip("/"), key


def main() -> int:
    ap = argparse.ArgumentParser(description="Aplica a migration de GIFs demonstrativos")
    ap.add_argument("--dry-run", action="store_true", help="Só mostra o SQL")
    ap.add_argument("--verify", action="store_true", help="Só consulta o estado atual")
    args = ap.parse_args()

    url, key = load_env()
    sql = MIGRATION.read_text(encoding="utf-8")

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }

    def rpc(sql_text: str):
        r = requests.post(
            f"{url}/rest/v1/rpc/execute_sql",
            headers=headers,
            json={"sql_text": sql_text},
            timeout=120,
        )
        return r

    if args.dry_run:
        print(sql)
        return 0

    if args.verify:
        q = (
            "select count(*) filter (where demonstration_url is not null)::int as com_demo, "
            "count(*)::int as total from public.exercises where user_id is null"
        )
        r = rpc(q)
        if r.status_code >= 400:
            print(f"ERRO {r.status_code}: {r.text[:400]}", file=sys.stderr)
            return 1
        print("Estado atual:", r.text[:500])
        return 0

    print(f"Aplicando {MIGRATION.name}…")
    r = rpc(sql)
    if r.status_code >= 400:
        print(f"ERRO {r.status_code}: {r.text[:600]}", file=sys.stderr)
        return 1
    print("OK:", r.text[:400])

    # Confere o resultado.
    r2 = rpc(
        "select count(*) filter (where demonstration_url is not null)::int as com_demo, "
        "count(*)::int as total from public.exercises where user_id is null"
    )
    if r2.status_code < 400:
        print("Verificação:", r2.text[:500])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
