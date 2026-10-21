#!/usr/bin/env python3
"""
VITTA — Inventário de mídias de exercício no Wikimedia Commons.

Objetivo: encontrar, para cada movimento do catálogo, uma mídia do Commons
que já tenha (a) personagem anatômico e (b) o equipamento/máquina visível
— que é o padrão de referência do app.

Estratégia
----------
O Commons hospeda as ilustrações de exercício como SVG numerados
(`<Exercício> 1.svg`, `<Exercício> 2.svg`), que representam as poses
inicial e final do mesmo movimento. Também existem poucos GIFs oficiais.

Para cada base candidata checamos, em lote:
  1. se existe um GIF animado oficial;
  2. quantos frames SVG numerados existem (2+ → dá para interpolar).

Saída: scripts/wikimedia-media.json
    { "<base>": { "gif": "File:...", "frames": ["File:... 1.svg", ...] } }
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

S = requests.Session()
S.headers["User-Agent"] = "VittaExerciseCatalog/1.0 (educational fitness app; contact: dev@vitta.app)"

# Bases candidatas no Commons (padrão "<Exercício> 1.svg" ou "<Exercício>_1.svg").
CANDIDATE_BASES = [
    # ── Costas ──
    "Wide_grip_lat_pull_down", "Lat_pull_down", "Narrow_grip_lat_pull_down",
    "Straight_arm_lat_pulldown", "Lat_pulldown", "Machine_lat_pull_down",
    "Upright_barbell_rows", "Upright_cable_row", "Bent_over_row",
    "Barbell_row", "Dumbbell_row", "Seated_cable_row", "One_arm_dumbbell_row",
    "T_bar_row", "Pendlay_row", "Chest_supported_row", "Inverted_row",
    "Straight_arm_pulldown", "Pullover", "Cable_pullover", "Deadlift",
    "Straight_leg_deadlift", "Romanian_deadlift", "Sumo_deadlift",
    "Stiff_leg_deadlift", "Deficit_deadlift", "Close_grip_deadlift",
    # ── Peito ──
    "Bench_press", "Bench_press_dumbbell", "Incline_bench_press",
    "Dumbbell_incline_bench_press", "Decline_barbell_bench_press",
    "Close_grip_barbell_bench_press", "Incline_dumbbell_bench_press",
    "Decline_dumbbell_bench_press", "Flat_bench_cable_flys",
    "Incline_cable_flys", "Cable_crossover", "Cable_fly",
    "Pec_deck_fly", "Bosu_ball_push_up", "Push_up", "Push_up_elevated",
    "Decline_push_up", "One_arm_bench_press", "Weighted_dip",
    "Chest_press_machine", "Machine_chest_press", "Smith_machine_chest_press",
    # ── Pernas ──
    "Squat", "Back_squat", "Barbell_squat", "Dumbbell_squat",
    "Overhead_squat_with_barbell", "Goblet_squat", "Smith_machine_hack_squat",
    "Hack_squat_with_barbell", "Leg_press", "Lying_squat", "Single_leg_squat_with_barbell",
    "Weighted_sissy_squat_with_weight_plate", "Bulgarian_split_squat",
    "Leg_extension", "Seated_leg_extension", "Lying_leg_extension",
    "Leg_curl", "Seated_leg_curl", "Lying_leg_curl", "Nordic_curl",
    "Standing_calf_raises", "Seated_calf_raise_using_machine",
    "Standing_calf_raise", "Leg_press_45", "Squat_to_bench_with_barbell",
    "Step_up", "Reverse_hyper", "Hip_thrust", "Glute_bridge",
    "Back_extension", "Hyperextensions", "Roman_chair_hyperextension_animation",
    # ── Ombros ──
    "Dumbbell_shoulder_press", "Barbell_shoulder_press",
    "Seated_shoulder_press_machine", "Machine_shoulder_press",
    "Military_press", "Arnold_press", "Lateral_raise",
    "Lying_rear_lateral_raise", "Seated_lateral_raise",
    "Upright_row", "Cable_lateral_raise", "Front_raise",
    # ── Braços ──
    "Biceps_curl_with_dumbbell", "Biceps_curl_reverse_with_dumbbells",
    "Standing_biceps_curl_with_cable", "Wide_grip_standing_biceps_curl_with_barbell",
    "Hammer_curl", "Preacher_curl", "Concentration_curl", "Cable_curl",
    "One_arm_tricep_extension_with_cable", "Overhead_triceps_extension",
    "Triceps_pushdown", "Skullcrusher", "Close_grip_bench_press",
    "Bench_press_dumbbell", "One_arm_pushdown",
    # ── Core ──
    "Plank", "Sit_up", "Crunch", "Abdominal_crank", "Woodchop",
    "Cable_woodchop", "Kettlebell_swing", "Russian_twist", "Hanging_leg_raise",
    "Dead_bug", "Side_plank", "Dip", "Parallel_bar_dip", "Dumbbell_deadlift",
    "Hip_flexion", "Glute_bridge_machine", "Abduction_machine",
    "Machine_glute_bridge", "Multi_hip_machine", "Adduction_machine",
    "Seated_row_machine", "Leg_curl_machine", "Calf_raise_machine",
    "Total_body", "Biceps", "Triceps", "Crunch_machine",
    "Pull_up", "Pullup", "Chin_up", "Machine_glute_bridge", "Glute_bridge_machine",
    "Cable_hip_extension", "Hip_abduction_machine", "Hip_adduction_machine",
    "Abduction_machine", "Adduction_machine", "French_press", "Kettlebell_swing",
    "Leg_raise", "Hanging_leg_raise", "Jogging", "Jump_rope", "Exercise_bike",
    "Treadmill", "Standing-calf-raises", "Standing_calf_raises",
    "Crunch_machine", "Abdominal_crunch_machine", "Cable_crunch", "Seated_crunch",
    "Triceps_french_press", "Barbell_triceps_extension", "Cable_triceps_pushdown",
    "Machine_triceps_extension", "Seated_tricep_extension", "Machine_leg_curl",
    "Leg_curl_machine", "Machine_leg_extension", "Machine_chest_press",
    "Machine_biceps_curl", "Machine_lateral_raise", "Machine_bench_press",
    "Machine_glute_kickback", "Cable_kickback", "Glute_kickback_machine",
    "Cable_pull_up", "Lat_pull_down_machine", "Machine_lat_pull_down",
]


def api(params: Dict, retries: int = 6) -> Dict:
    params = {"format": "json", **params}
    last = {}
    for attempt in range(retries):
        try:
            r = S.get(API, params=params, timeout=50)
            if r.status_code == 200:
                return r.json()
            last = {"status": r.status_code}
        except requests.RequestException as exc:
            last = {"error": str(exc)}
        time.sleep(1.5 * (attempt + 1) + random.random())
    return last


def exists(titles: List[str]) -> Dict[str, Dict]:
    """Retorna {titulo: {url, width, height}} dos que existem."""
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
        time.sleep(0.25)
    return found


def frame_titles(base: str, n: int) -> List[str]:
    """Títulos candidatos dos frames numerados de uma base."""
    b = base.replace("_", " ")
    out = []
    for i in range(1, n + 1):
        out.append(f"File:{b} {i}.svg")
    for i in range(1, n + 1):
        out.append(f"File:{base}_{i}.svg")
    return out


def main() -> int:
    # 1) Existência de todos os candidatos em lote.
    all_titles: List[str] = []
    for base in CANDIDATE_BASES:
        b = base.replace("_", " ")
        all_titles.append(f"File:{b}.gif")
        all_titles.append(f"File:{b} animation.gif")
        all_titles.append(f"File:{b} machine.gif")
        all_titles.append(f"File:Machine {b}.gif")
        all_titles.extend(frame_titles(base, 5))

    print(f"Checando {len(all_titles)} títulos no Commons…")
    found = exists(all_titles)
    print(f"  encontrados: {len(found)}")

    # 2) Monta o inventário por base.
    inventory: Dict[str, Dict] = {}
    for base in CANDIDATE_BASES:
        b = base.replace("_", " ")
        gif = next(
            (
                t
                for t in (
                    f"File:{b}.gif",
                    f"File:{b} animation.gif",
                    f"File:{b} machine.gif",
                    f"File:Machine {b}.gif",
                )
                if t in found
            ),
            None,
        )
        frames: List[str] = []
        hyphen = base.replace("_", "-")
        for i in range(1, 6):
            for t in (f"File:{b} {i}.svg", f"File:{base}_{i}.svg",
                      f"File:{hyphen}-{i}.svg", f"File:{hyphen} {i}.svg"):
                if t in found:
                    frames.append(t)
                    break
            else:
                break
        if gif or len(frames) >= 2:
            inventory[base] = {
                "gif": gif,
                "gif_info": found.get(gif),
                "frames": frames,
                "frames_info": [found.get(f) for f in frames],
            }

    OUT.write_text(json.dumps(inventory, ensure_ascii=False, indent=1), encoding="utf-8")
    com_gif = sum(1 for v in inventory.values() if v.get("gif"))
    com_frames = sum(1 for v in inventory.values() if len(v.get("frames", [])) >= 2)
    print(f"\nInventário: {len(inventory)} movimentos")
    print(f"  com GIF oficial: {com_gif}")
    print(f"  com 2+ frames SVG (interpoláveis): {com_frames}")
    print(f"→ {OUT.relative_to(ROOT)}")
    for base, v in sorted(inventory.items()):
        print(f"   {base:44s} gif={'S' if v.get('gif') else '-'} frames={len(v['frames'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
