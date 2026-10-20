#!/usr/bin/env python3
"""
VITTA — Upload dos GIFs demonstrativos para o Supabase Storage.

Faz duas coisas:

  1. Sobe cada GIF único para o bucket privado `exercise-demonstrations`
     (path: `catalog/<slug>.gif`).
  2. Atualiza `exercises.demonstration_url` (+ `demonstration_type='gif'`)
     de TODOS os exercícios do catálogo que têm GIF.

Os GIFs são gerados por `scripts/generate_exercise_demos.py` em
`public/exercises-gifs/`.

Requisitos
----------
    export NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co"
    export SUPABASE_SERVICE_ROLE_KEY="eyJ..."   # service_role, não anon!

A service role é necessária porque o bucket é privado e a tabela
`exercises` tem RLS que só permite escrita do próprio usuário — aqui
escrevemos no catálogo global (user_id IS NULL), o que exige bypass.

Uso
---
    python3 scripts/upload_exercise_demos.py
    python3 scripts/upload_exercise_demos.py --dry-run
    python3 scripts/upload_exercise_demos.py --only "supino|rosca"
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import unicodedata
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import requests

ROOT = Path(__file__).resolve().parent.parent
GIF_DIR = ROOT / "public" / "exercises-gifs"
BUCKET = "exercise-demonstrations"

API = "https://api.supabase.com/v1"


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def slugify(name: str) -> str:
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    s = s.lower().replace("—", "-")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "exercise"


def load_env() -> Tuple[str, str]:
    """Lê URL e service role key do ambiente (ou do .env.local)."""
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
    key = (
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        or os.environ.get("SERVICE_ROLE_KEY")
        or os.environ.get("SUPABASE_KEY")
    )

    # Fallback: .env.local / .vercel-env.tmp
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
                if k in ("SUPABASE_SERVICE_ROLE_KEY", "SERVICE_ROLE_KEY") and not key:
                    key = v

    if not url or not key:
        raise SystemExit(
            "ERRO: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.\n"
            "      A service role é necessária (bucket privado + escrita no catálogo global)."
        )
    return url.rstrip("/"), key


def headers(key: str) -> Dict[str, str]:
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }


# ─────────────────────────────────────────────────────────────────────────────
# API
# ─────────────────────────────────────────────────────────────────────────────
def fetch_exercises(url: str, key: str) -> List[Dict]:
    """Busca o catálogo global (user_id IS NULL)."""
    out: List[Dict] = []
    page = 0
    page_size = 1000
    while True:
        r = requests.get(
            f"{url}/rest/v1/exercises",
            headers=headers(key),
            params={
                "select": "id,name,category,equipment,demonstration_url",
                "user_id": "is.null",
                "order": "name",
                "limit": page_size,
                "offset": page * page_size,
            },
            timeout=60,
        )
        if r.status_code >= 400:
            raise SystemExit(f"ERRO ao listar exercícios: {r.status_code} {r.text[:400]}")
        batch = r.json()
        out.extend(batch)
        if len(batch) < page_size:
            break
        page += 1
    return out


def upload_gif(url: str, key: str, path: str, data: bytes) -> Tuple[bool, str]:
    """Sobe (upsert) um objeto no bucket. Retorna (ok, mensagem)."""
    r = requests.post(
        f"{url}/storage/v1/object/{BUCKET}/{path}",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "image/gif",
            "x-upsert": "true",
        },
        data=data,
        timeout=180,
    )
    if r.status_code < 300:
        return True, "ok"
    return False, f"{r.status_code} {r.text[:200]}"


def update_exercise(url: str, key: str, exercise_id: str, path: str) -> Tuple[bool, str]:
    """Grava demonstration_url + demonstration_type no exercício."""
    r = requests.patch(
        f"{url}/rest/v1/exercises",
        headers=headers(key),
        params={"id": f"eq.{exercise_id}"},
        json={"demonstration_url": path, "demonstration_type": "gif"},
        timeout=60,
    )
    if r.status_code < 300:
        return True, "ok"
    return False, f"{r.status_code} {r.text[:200]}"


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────
def main() -> int:
    ap = argparse.ArgumentParser(description="Upload dos GIFs demonstrativos")
    ap.add_argument("--dry-run", action="store_true", help="Não faz upload nem update")
    ap.add_argument("--only", default="", help="Filtra exercícios por nome (regex)")
    ap.add_argument("--no-update", action="store_true", help="Só faz upload, não popula o banco")
    args = ap.parse_args()

    manifest_path = GIF_DIR / "manifest.json"
    if not manifest_path.exists():
        raise SystemExit(
            f"ERRO: {manifest_path} não encontrado.\n"
            "      Rode antes: python3 scripts/generate_exercise_demos.py"
        )
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    url, key = load_env()
    print(f"Supabase: {url}")

    exercises = fetch_exercises(url, key)
    print(f"Exercícios no catálogo global: {len(exercises)}")

    by_name = {e["name"].strip().lower(): e for e in exercises}

    if args.only:
        rx = re.compile(args.only, re.I)
        manifest = [m for m in manifest if rx.search(m["name"])]

    # ── 1. Upload dos GIFs únicos ──
    unique: Dict[str, Dict] = {}
    for m in manifest:
        unique.setdefault(m["file"], m)

    uploaded: Dict[str, str] = {}  # file -> storage path
    if args.dry_run:
        print(f"\n[DRY-RUN] {len(unique)} GIFs únicos seriam enviados:")
        for f in sorted(unique)[:10]:
            print(f"  {f}  ({unique[f]['bytes']/1024:.0f} KB)")
        if len(unique) > 10:
            print(f"  ... e mais {len(unique) - 10}")
    else:
        print(f"\nEnviando {len(unique)} GIFs para o bucket '{BUCKET}'…")
        for i, (fname, m) in enumerate(sorted(unique.items()), 1):
            src = GIF_DIR / fname
            if not src.exists():
                print(f"  [{i}/{len(unique)}] {fname}: ARQUIVO AUSENTE — pulando")
                continue
            storage_path = f"catalog/{fname}"
            ok, msg = upload_gif(url, key, storage_path, src.read_bytes())
            if ok:
                uploaded[fname] = storage_path
                print(f"  [{i}/{len(unique)}] ✓ {fname} ({src.stat().st_size/1024:.0f} KB)")
            else:
                print(f"  [{i}/{len(unique)}] ✗ {fname}: {msg}")

    # ── 2. Popula demonstration_url ──
    if args.no_update:
        return 0

    print(f"\nPopulando demonstration_url…")
    updated = 0
    missing = 0
    for m in manifest:
        fname = m["file"]
        ex = by_name.get(m["name"].strip().lower())
        if ex is None:
            missing += 1
            continue
        storage_path = uploaded.get(fname) or f"catalog/{fname}"
        if args.dry_run:
            print(f"  {m['name']}  ->  {storage_path}")
            updated += 1
            continue
        ok, msg = update_exercise(url, key, ex["id"], storage_path)
        if ok:
            updated += 1
        else:
            print(f"  ✗ {m['name']}: {msg}")

    if not args.dry_run:
        print(f"\nConcluído: {updated} exercícios atualizados, {missing} sem GIF (não encontrados no banco).")
    else:
        print(f"\n[DRY-RUN] {updated} exercícios seriam atualizados, {missing} sem correspondência.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
