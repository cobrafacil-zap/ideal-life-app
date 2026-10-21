#!/usr/bin/env python3
"""
VITTA — Inventário de mídias de exercício no Wikimedia Commons.

Objetivo: encontrar, para cada movimento do catálogo, uma mídia do Commons
que já tenha (a) personagem anatômico e (b) o equipamento/máquina visível
— que é o padrão de referência do app.

Fonte
-----
A série de ilustrações do Commons que usa esse estilo vive na categoria
**"Weight training diagrams"** (933 arquivos). Cada movimento aparece como
um par de SVG numerados — pose inicial e pose final:

    File:Wide grip lat pull down 1.svg
    File:Wide grip lat pull down 2.svg

Alguns movimentos só existem como par de PNG (mesma ilustração rasterizada).

Estratégia
----------
1. Lista os arquivos da categoria (paginado, com retry).
2. Agrupa por "base" do movimento (nome sem o sufixo numérico).
3. Para cada base, guarda os frames SVG (preferidos) e PNG (fallback).

Saída: scripts/wikimedia-media.json
    {
      "<base>": {
        "frames": ["File:... 1.svg", "File:... 2.svg"],
        "frames_info": [{url, width, height}, ...]
      }
    }
"""

from __future__ import annotations

import json
import random
import re
import time
from pathlib import Path
from typing import Dict, List

import requests

ROOT = Path(__file__).resolve().parent.parent
API = "https://commons.wikimedia.org/w/api.php"
OUT = ROOT / "scripts" / "wikimedia-media.json"
CATEGORY = "Category:Weight training diagrams"

S = requests.Session()
S.headers["User-Agent"] = "VittaExerciseCatalog/1.0 (educational fitness app; contact: dev@vitta.app)"


def api(params: Dict, retries: int = 6) -> Dict:
    params = {"format": "json", **params}
    for attempt in range(retries):
        try:
            r = S.get(API, params=params, timeout=50)
            if r.status_code == 200:
                return r.json()
        except requests.RequestException:
            pass
        time.sleep(1.2 * (attempt + 1) + random.random())
    return {}


def category_files(category: str = CATEGORY) -> List[str]:
    """Lista todos os arquivos (File:...) de uma categoria, paginando."""
    names: List[str] = []
    cont: Dict = {}
    while True:
        params: Dict = {
            "action": "query",
            "list": "categorymembers",
            "cmtitle": category,
            "cmlimit": "500",
            "cmtype": "file",
        }
        if cont:
            params.update(cont)
        data = api(params)
        members = data.get("query", {}).get("categorymembers", [])
        if not members:
            break
        names.extend(m["title"] for m in members)
        cont = data.get("continue", {})
        if not cont:
            break
        time.sleep(0.15)
    return names


def image_info(titles: List[str]) -> Dict[str, Dict]:
    """{título: {url, width, height}} dos que existem (lotes de 40)."""
    found: Dict[str, Dict] = {}
    for i in range(0, len(titles), 40):
        chunk = titles[i : i + 40]
        data = api(
            {
                "action": "query",
                "titles": "|".join(chunk),
                "prop": "imageinfo",
                "iiprop": "url|size|mime",
            }
        )
        pages = data.get("query", {}).get("pages", {})
        norm = {p.get("title", "").replace("_", " "): p for p in pages.values()}
        for t in chunk:
            p = norm.get(t.replace("_", " "))
            if not p or "imageinfo" not in p:
                continue
            ii = p["imageinfo"][0]
            found[t] = {
                "url": ii.get("url"),
                "width": ii.get("width"),
                "height": ii.get("height"),
                "mime": ii.get("mime"),
            }
        time.sleep(0.2)
    return found


def group_frames(files: List[str]) -> Dict[str, List[str]]:
    """Agrupa "<base> <n>.svg" / "<base>-<n>.png" por base, mantendo a ordem.

    A série usa duas convenções de nome para o mesmo desenho:
    "Thigh abductor 1.svg" (com espaço) e "Thigh-abductor-1.png" (com
    hífen). Espaços, hífens e sublinhados são equivalentes, então as
    variantes são unificadas — assim um movimento que só tem 1 frame SVG
    ainda aproveita o par de PNG.
    """
    grouped: Dict[str, Dict[int, Dict[str, str]]] = {}
    labels: Dict[str, str] = {}

    for title in files:
        name = title.replace("File:", "")
        m = re.match(r"^(.*?)[ _-](\d+)(\.(?:svg|png|gif))$", name, re.I)
        if not m:
            continue
        base, idx, ext = m.group(1).strip(), int(m.group(2)), m.group(3).lower().lstrip(".")
        key = re.sub(r"[_\s]+", "-", base).casefold()
        slot = grouped.setdefault(key, {}).setdefault(idx, {})
        # SVG tem prioridade sobre PNG/GIF (mesma ilustração, melhor escala).
        rank = {"svg": 0, "png": 1, "gif": 2}[ext]
        best = min((slot.get(k) for k, v in (("svg", 0), ("png", 1), ("gif", 2)) if k in slot),
                   key=lambda t: {"svg": 0, "png": 1, "gif": 2}[t.rsplit(".", 1)[1]], default=None)
        if best is None or rank < {"svg": 0, "png": 1, "gif": 2}[best.rsplit(".", 1)[1]]:
            slot[ext] = f"File:{name}"
        # Rótulo preferencial: variante com espaços (nome "oficial").
        prev = labels.get(key)
        if prev is None or (" " in base and " " not in prev):
            labels[key] = base

    out: Dict[str, List[str]] = {}
    for key, idxs in grouped.items():
        ordered = []
        for i in sorted(idxs):
            slot = idxs[i]
            ordered.append(slot.get("svg") or slot.get("png") or slot.get("gif"))
        out[labels.get(key, key)] = ordered
    return out


def main() -> int:
    print(f"Listando {CATEGORY}…")
    files = category_files()
    print(f"  {len(files)} arquivos")

    grouped = group_frames(files)
    print(f"  {len(grouped)} movimentos com frames numerados")

    # Só interessa base com 2+ frames (pose inicial e final).
    usable = {b: f for b, f in grouped.items() if len(f) >= 2}
    print(f"  {len(usable)} movimentos com 2+ frames (interpoláveis)")

    titles: List[str] = []
    for frames in usable.values():
        titles.extend(frames)
    print(f"Buscando metadados de {len(titles)} arquivos…")
    info = image_info(titles)

    inventory: Dict[str, Dict] = {}
    for base, frames in sorted(usable.items()):
        kept = [f for f in frames if f in info]
        if len(kept) < 2:
            continue
        inventory[base] = {
            "frames": kept,
            "frames_info": [info[f] for f in kept],
        }

    OUT.write_text(json.dumps(inventory, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\nInventário: {len(inventory)} movimentos → {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
