#!/usr/bin/env python3
"""
VITTA — Exporta o catálogo de exercícios a partir das migrations SQL.

Gera `scripts/exercise-catalog.json` no formato:

    [{ "name": "...", "category": "quadriceps", "equipment": "maquina" }, ...]

Uso:
    python3 scripts/export_exercise_catalog.py

Nota: as migrations são a fonte de verdade do catálogo global. Depois de rodar
as migrations no Supabase, este catálogo pode ser conferido/atualizado com
`scripts/export_exercise_catalog.sql` (rodado no SQL Editor), que gera o
mesmo JSON direto do banco.
"""

from __future__ import annotations

import argparse
import glob
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional

ROOT = Path(__file__).resolve().parent.parent
MIGRATIONS = sorted(glob.glob(str(ROOT / "supabase" / "migrations" / "*.sql")))
OUT = ROOT / "scripts" / "exercise-catalog.json"

# Campos de interest no INSERT INTO public.exercises (name, equipment, category)
COLS = [
    "user_id", "name", "primary_muscle", "secondary_muscles", "equipment",
    "substitutes", "image_url", "category", "aliases", "machine_type",
    "laterality", "difficulty", "movement_pattern", "instructions",
    "common_mistakes",
]


def split_top_level(s: str) -> List[str]:
    """Divide uma lista de valores SQL respeitando parênteses, colchetes e aspas."""
    parts: List[str] = []
    depth = 0
    bracket = 0
    in_str = False
    buf: List[str] = []
    i = 0
    n = len(s)
    while i < n:
        ch = s[i]
        if in_str:
            if ch == "'":
                if i + 1 < n and s[i + 1] == "'":
                    buf.append("''")
                    i += 2
                    continue
                in_str = False
            buf.append(ch)
        else:
            if ch == "'":
                in_str = True
                buf.append(ch)
            elif ch == "(":
                depth += 1
                buf.append(ch)
            elif ch == ")":
                depth -= 1
                buf.append(ch)
            elif ch == "[":
                bracket += 1
                buf.append(ch)
            elif ch == "]":
                bracket -= 1
                buf.append(ch)
            elif ch == "," and depth == 0 and bracket == 0:
                parts.append("".join(buf).strip())
                buf = []
            else:
                buf.append(ch)
        i += 1
    if buf:
        parts.append("".join(buf).strip())
    return parts


def unquote(tok: str) -> Optional[str]:
    tok = tok.strip()
    if tok.upper() == "NULL":
        return None
    m = re.match(r"^'((?:[^']|'')*)'$", tok, re.S)
    if m:
        return m.group(1).replace("''", "'")
    return None


def iter_tuples(body: str):
    """Itera as tuplas `( ... )` de um bloco VALUES, respeitando strings."""
    i = 0
    n = len(body)
    while i < n:
        if body[i] != "(":
            i += 1
            continue
        start = i
        depth = 0
        in_str = False
        while i < n:
            ch = body[i]
            if in_str:
                if ch == "'":
                    if i + 1 < n and body[i + 1] == "'":
                        i += 2
                        continue
                    in_str = False
            else:
                if ch == "'":
                    in_str = True
                elif ch == "(":
                    depth += 1
                elif ch == ")":
                    depth -= 1
                    if depth == 0:
                        yield body[start + 1 : i]
                        i += 1
                        break
            i += 1
        else:
            return


def parse_inserts(sql: str) -> List[Dict[str, Optional[str]]]:
    """Extrai linhas de INSERT INTO public.exercises."""
    rows: List[Dict[str, Optional[str]]] = []
    rows += _parse_values_form(sql)
    rows += _parse_select_form(sql)
    return rows


def _parse_values_form(sql: str) -> List[Dict[str, Optional[str]]]:
    """INSERT INTO exercises (cols...) VALUES (...), (...);"""
    rows: List[Dict[str, Optional[str]]] = []
    pattern = re.compile(
        r"INSERT\s+INTO\s+(?:public\.)?exercises\s*\(([^)]*)\)\s*VALUES",
        re.S | re.I,
    )
    for m in pattern.finditer(sql):
        cols = [c.strip().lower() for c in m.group(1).split(",")]
        end = sql.find(";", m.end())
        if end == -1:
            continue
        body = sql[m.end() : end]
        for tup in iter_tuples(body):
            vals = split_top_level(tup)
            if len(vals) != len(cols):
                continue
            row = {c: unquote(v) for c, v in zip(cols, vals)}
            name = row.get("name")
            if not name:
                continue
            rows.append({
                "name": name,
                "category": row.get("category"),
                "equipment": row.get("equipment"),
                "primary_muscle": row.get("primary_muscle"),
            })
    return rows


def _parse_select_form(sql: str) -> List[Dict[str, Optional[str]]]:
    """INSERT INTO exercises (cols...) SELECT ... FROM (VALUES ...) AS t(a, b, ...);"""
    rows: List[Dict[str, Optional[str]]] = []
    # VALUESblock dentro de um FROM ( ... ) AS t(cols)
    pattern = re.compile(
        r"FROM\s*\(\s*VALUES\s*(.*?)\s*\)\s*(?:AS\s+)?t\s*\(([^)]*)\)",
        re.S | re.I,
    )
    for m in pattern.finditer(sql):
        body = m.group(1)
        tcols = [c.strip().lower() for c in m.group(2).split(",")]
        for tup in iter_tuples(body):
            vals = split_top_level(tup)
            if len(vals) != len(tcols):
                continue
            row = {c: unquote(v) for c, v in zip(tcols, vals)}
            name = row.get("name")
            if not name:
                continue
            rows.append({
                "name": name,
                "category": row.get("category"),
                "equipment": row.get("equipment"),
                "primary_mus muscle": None,
                "primary_muscle": row.get("primary") or row.get("primary_muscle"),
            })
    return rows


def main() -> int:
    ap = argparse.ArgumentParser(description="Exporta o catálogo de exercícios")
    ap.add_argument(
        "--from-db",
        action="store_true",
        help="Lê o catálogo real do Supabase (fonte de verdade) em vez das migrations",
    )
    ap.add_argument(
        "--output", default=str(OUT), help="Arquivo JSON de saída"
    )
    args = ap.parse_args()

    if args.from_db:
        out = fetch_from_db()
    else:
        catalog: Dict[str, Dict[str, Optional[str]]] = {}
        for path in MIGRATIONS:
            sql = Path(path).read_text(encoding="utf-8", errors="replace")
            for row in parse_inserts(sql):
                key = row["name"].strip().lower()
                prev = catalog.get(key)
                # Mantém a entry mais completa (com category) entre duplicatas.
                if prev is None or (not prev.get("category") and row.get("category")):
                    catalog[key] = row
        items = sorted(catalog.values(), key=lambda r: r["name"].lower())
        out = [
            {
                "name": r["name"],
                "category": r.get("category"),
                "equipment": r.get("equipment"),
                "primary_muscle": r.get("primary_muscle"),
            }
            for r in items
        ]

    out_path = Path(args.output)
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")

    with_cat = sum(1 for r in out if r.get("category"))
    print(f"Catálogo exportado: {len(out)} exercícios → {out_path}")
    print(f"  com category: {with_cat}  |  sem category: {len(out) - with_cat}")
    return 0


def fetch_from_db() -> List[Dict[str, Optional[str]]]:
    """Lê o catálogo global (user_id IS NULL) direto do Supabase."""
    import os

    import requests

    root = Path(__file__).resolve().parent.parent
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not url or not key:
        for fname in (".env.local", ".vercel-env.tmp"):
            p = root / fname
            if not p.exists():
                continue
            for line in p.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                v = v.strip().strip('"').strip("'")
                if k == "NEXT_PUBLIC_SUPABASE_URL" and not url:
                    url = v
                if k == "NEXT_PUBLIC_SUPABASE_ANON_KEY" and not key:
                    key = v
    if not url or not key:
        raise SystemExit("ERRO: NEXT_PUBLIC_SUPABASE_URL / ANON_KEY não definidos.")

    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    rows: List[Dict] = []
    offset = 0
    while True:
        r = requests.get(
            f"{url.rstrip('/')}/rest/v1/exercises",
            headers=headers,
            params={
                "select": "name,category,equipment,primary_muscle",
                "user_id": "is.null",
                "order": "name.asc",
                "limit": 1000,
                "offset": offset,
            },
            timeout=90,
        )
        r.raise_for_status()
        batch = r.json()
        rows.extend(batch)
        if len(batch) < 1000:
            break
        offset += 1000

    return [
        {
            "name": x["name"],
            "category": x.get("category"),
            "equipment": x.get("equipment"),
            "primary_muscle": x.get("primary_muscle"),
        }
        for x in rows
    ]


if __name__ == "__main__":
    raise SystemExit(main())
