#!/usr/bin/env python3
"""Helper de administração do Supabase para o projeto VITTA.

O RPC `execute_sql` instalado no projeto engole erros e sempre devolve
"OK", o que impede confirmar o resultado de um DELETE. Este script cria
um RPC auxiliar (`tmp_admin_query`) que devolve as linhas em JSON, usando
as mesmas credenciais (anon key) do resto do projeto.

Uso:
    python3 scripts/supabase_admin.py query "select ..."
    python3 scripts/supabase_admin.py sql   "update ..."
    python3 scripts/supabase_admin.py cleanup-demo-data
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, List

import requests

ROOT = Path(__file__).resolve().parent.parent
RPC_NAME = "tmp_admin_query"

CREATE_FN = """
create or replace function public.tmp_admin_query(q text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare r jsonb;
begin
  execute 'select coalesce(jsonb_agg(t), ''[]''::jsonb) from (' || q || ') t' into r;
  return r;
end
$fn$;
"""


def load_env() -> tuple[str, str]:
    import os

    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_ANON_KEY")
    for fname in (".env.local", ".vercel-env.tmp"):
        p = ROOT / fname
        if not p.exists():
            continue
        for line in p.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k in ("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL") and not url:
                url = v
            if k in ("NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY") and not key:
                key = v
    if not url or not key:
        raise SystemExit("ERRO: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.")
    return url.rstrip("/"), key


def _headers(key: str) -> dict:
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }


def ensure_rpc(url: str, key: str) -> None:
    """Cria o RPC auxiliar e recarrega o cache de schema do PostgREST."""
    h = _headers(key)
    requests.post(
        f"{url}/rest/v1/rpc/execute_sql", headers=h, json={"sql_text": CREATE_FN}, timeout=120
    )
    requests.post(
        f"{url}/rest/v1/rpc/execute_sql",
        headers=h,
        json={"sql_text": "notify pgrst, 'reload schema';"},
        timeout=120,
    )
    import time

    time.sleep(3)


def query(sql: str, url: str | None = None, key: str | None = None) -> List[Any]:
    url, key = url or load_env()
    h = _headers(key)
    r = requests.post(f"{url}/rest/v1/rpc/{RPC_NAME}", headers=h, json={"q": sql}, timeout=180)
    if r.status_code == 404:
        ensure_rpc(url, key)
        r = requests.post(f"{url}/rest/v1/rpc/{RPC_NAME}", headers=h, json={"q": sql}, timeout=180)
    if r.status_code >= 400:
        raise SystemExit(f"ERRO {r.status_code}: {r.text[:600]}")
    return r.json()


def exec_sql(sql: str) -> None:
    """Executa DDL/DML via execute_sql (não devolve linhas)."""
    url, key = load_env()
    h = _headers(key)
    requests.post(f"{url}/rest/v1/rpc/execute_sql", headers=h, json={"sql_text": sql}, timeout=180)


def drop_rpc() -> None:
    exec_sql(f"drop function if exists public.{RPC_NAME}(text);")
    print("RPC auxiliar removido.")


def main() -> int:
    cmd = sys.argv[1] if len(sys.argv) > 1 else "query"
    if cmd == "query":
        rows = query(sys.argv[2])
        print(json.dumps(rows, ensure_ascii=False, indent=1))
        return 0
    if cmd == "sql":
        exec_sql(sys.argv[2])
        print("OK")
        return 0
    if cmd == "drop-rpc":
        drop_rpc()
        return 0
    if cmd == "cleanup-demo-data":
        return cleanup_demo_data()
    print(__doc__)
    return 1


def cleanup_demo_data() -> int:
    """Remove o usuário e o plano de teste criados para validar os GIFs."""
    plan_id = "3a00a7a2-e1c3-45bc-9bea-544554ede4af"
    email = "vitta.demo.1792540334@teste.com"

    plans = query(f"select id, name from public.workout_plans where id = '{plan_id}'")
    users = query(f"select id, email from auth.users where email = '{email}'")
    print("plano :", plans)
    print("usuário:", users)
    if not plans and not users:
        print("Nada a limpar.")
        return 0

    user_ids = [u["id"] for u in users]
    if user_ids:
        ids = ", ".join(f"'{u}'" for u in user_ids)
        # Remove os registros do usuário (planos, exercícios, sessões...).
        # `profiles` usa o id do usuário como PK (não tem coluna user_id).
        exec_sql(
            "delete from public.workout_plan_exercises where workout_plan_id in "
            f"(select id from public.workout_plans where user_id in ({ids}));"
        )
        for table in (
            "public.workout_plans",
            "public.exercises",
            "public.workout_sessions",
            "public.cardio_sessions",
        ):
            exec_sql(f"delete from {table} where user_id in ({ids});")
        exec_sql(f"delete from public.profiles where id in ({ids});")
        # A conta em auth.users (cascateia para o resto).
        exec_sql(f"delete from auth.users where id in ({ids});")

    if plans:
        exec_sql(
            f"delete from public.workout_plan_exercises where workout_plan_id = '{plan_id}';"
        )
        exec_sql(f"delete from public.workout_plans where id = '{plan_id}';")

    after_plans = query(f"select id from public.workout_plans where id = '{plan_id}'")
    after_users = query(f"select id from auth.users where email = '{email}'")
    print("após limpeza -> plano:", after_plans, "| usuário:", after_users)
    return 0 if not after_plans and not after_users else 1


if __name__ == "__main__":
    raise SystemExit(main())
