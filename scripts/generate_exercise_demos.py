#!/usr/bin/env python3
"""
VITTA — Gerador de GIFs demonstrativos de exercício.

Gera, para CADA exercício do catálogo, uma animação curta (≤ 8s, sem áudio,
loop perfeito) mostrando o movimento do exercício, no mesmo estilo visual das
silhuetas já usadas no projeto (stick figure, cabeça #E76F51, cor do traço
identificando o grupo muscular).

Estratégia de mapeamento
-------------------------
Cada exercício é classificado por:
  1. `motion`  — o padrão de movimento (squat, hinge, curl, ...). É o que
     define a animação dos braços/pernas/tronco.
  2. `equip`   — o equipamento (barra, haltere, cabo, elástico, máquina,
     nenhum). É o que adiciona o acessório desenhado.
  3. `group`   — o grupo muscular. Define a cor do traço e a legenda.

A animação é gerada interpolando entre poseskeyframes com easing senoidal,
o que produz um movimento contínuo e natural. O último frame conecta
perfeitamente com o primeiro (loop sem salto).

Saída
-----
    public/exercises-gifs/<slug-do-exercicio>.gif

Uso
---
    python3 scripts/generate_exercise_demos.py
    python3 scripts/generate_exercise_demos.py --limit 10 --dry-run
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import sys
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Dict, List, Optional, Sequence, Tuple

try:
    from PIL import Image, ImageDraw
except ImportError:  # pragma: no cover
    sys.exit("Pillow é obrigatório: python3 -m pip install Pillow")

# Motor de mídia Wikimedia Commons (personagem anatômico + máquina visível).
sys.path.insert(0, str(Path(__file__).resolve().parent))
try:
    import exercise_media as em
except Exception:  # pragma: no cover - fallback local continua funcionando
    em = None


# ─────────────────────────────────────────────────────────────────────────────
# Paleta — espelha `lib/exercise-image-map.ts` (STROKE) e o design do app.
# ─────────────────────────────────────────────────────────────────────────────
BG = "#F7F5F0"
HEAD = "#E76F51"
EQUIP = "#264653"
FLOOR = "#C9C2B4"

STROKE_BY_GROUP: Dict[str, str] = {
    "gluteos": "#E9C46A",
    "cardio": "#FF006E",
    "abdomen": "#3A86FF",
    "panturrilha": "#8338EC",
    "costas": "#2A9D8F",
    "bracos": "#F4A261",
    "pernas": "#264653",
    "outro": "#6C757D",
}

# Fallback: quando a categoria fina não existe, usa o primary_muscle legado.
STROKE_BY_PRIMARY: Dict[str, str] = {
    "pernas": STROKE_BY_GROUP["pernas"],
    "peito": STROKE_BY_GROUP["bracos"],
    "costas": STROKE_BY_GROUP["costas"],
    "ombros": STROKE_BY_GROUP["bracos"],
    "bracos": STROKE_BY_GROUP["bracos"],
    "core": STROKE_BY_GROUP["abdomen"],
    "cardio": STROKE_BY_GROUP["cardio"],
    "outro": STROKE_BY_GROUP["outro"],
}

# ─────────────────────────────────────────────────────────────────────────────
# Dimensões / timing
# ─────────────────────────────────────────────────────────────────────────────
CANVAS = 360
FPS = 12
DURATION_S = 6.0            # < 8s conforme requisito
FRAMES = int(round(FPS * DURATION_S))
MAX_DURATION_S = 8.0

STROKE_W = 7
HEAD_R = 15


# ─────────────────────────────────────────────────────────────────────────────
# Rig 2D
# ─────────────────────────────────────────────────────────────────────────────
@dataclass
class Rig:
    """Pontos-chave de um esqueleto 2D (coordenadas no canvas 0..360)."""

    head: Tuple[float, float]
    hip: Tuple[float, float]
    shoulder: Tuple[float, float]
    elbow_l: Tuple[float, float]
    elbow_r: Tuple[float, float]
    hand_l: Tuple[float, float]
    hand_r: Tuple[float, float]
    knee_l: Tuple[float, float]
    knee_r: Tuple[float, float]
    foot_l: Tuple[float, float]
    foot_r: Tuple[float, float]

    def lerp(self, other: "Rig", t: float) -> "Rig":
        def mix(a, b):
            return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)

        return Rig(
            head=mix(self.head, other.head),
            hip=mix(self.hip, other.hip),
            shoulder=mix(self.shoulder, other.shoulder),
            elbow_l=mix(self.elbow_l, other.elbow_l),
            elbow_r=mix(self.elbow_r, other.elbow_r),
            hand_l=mix(self.hand_l, other.hand_l),
            hand_r=mix(self.hand_r, other.hand_r),
            knee_l=mix(self.knee_l, other.knee_l),
            knee_r=mix(self.knee_r, other.knee_r),
            foot_l=mix(self.foot_l, other.foot_l),
            foot_r=mix(self.foot_r, other.foot_r),
        )


def _rig(**kw) -> Rig:
    """Atalho: cria um Rig com defaults e overrides."""
    base = dict(
        head=(180, 60),
        hip=(180, 160),
        shoulder=(180, 92),
        elbow_l=(156, 126),
        elbow_r=(204, 126),
        hand_l=(150, 158),
        hand_r=(210, 158),
        knee_l=(166, 214),
        knee_r=(194, 214),
        foot_l=(162, 296),
        foot_r=(198, 296),
    )
    base.update(kw)
    return Rig(**base)  # type: ignore[arg-type]


# ─────────────────────────────────────────────────────────────────────────────
# Poses base por padrão de movimento
# Cada padrão devolve (pose_a, pose_b): o ciclo vai A → B → A com easing.
# ─────────────────────────────────────────────────────────────────────────────
Poses = Tuple[Rig, Rig]
MotionFn = Callable[[], Poses]


def p_squat() -> Poses:
    top = _rig(
        head=(180, 62), hip=(180, 158), shoulder=(180, 90),
        elbow_l=(158, 122), elbow_r=(202, 122),
        hand_l=(152, 152), hand_r=(208, 152),
        knee_l=(172, 212), knee_r=(188, 212),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    bottom = _rig(
        head=(180, 112), hip=(180, 208), shoulder=(180, 140),
        elbow_l=(156, 170), elbow_r=(204, 170),
        hand_l=(150, 198), hand_r=(210, 198),
        knee_l=(150, 252), knee_r=(210, 252),
        foot_l=(156, 296), foot_r=(204, 296),
    )
    return top, bottom


def p_hinge() -> Poses:
    """Terra / stiff — quadril vai para trás, tronco inclina para frente."""
    top = _rig(
        head=(180, 62), hip=(180, 158), shoulder=(180, 90),
        elbow_l=(158, 122), elbow_r=(202, 122),
        hand_l=(152, 152), hand_r=(208, 152),
        knee_l=(172, 214), knee_r=(188, 214),
        foot_l=(162, 296), foot_r=(198, 296),
    )
    bottom = _rig(
        head=(112, 150), hip=(180, 196), shoulder=(146, 118),
        elbow_l=(126, 146), elbow_r=(166, 146),
        hand_l=(120, 172), hand_r=(160, 172),
        knee_l=(172, 240), knee_r=(188, 240),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    return top, bottom


def p_lunge() -> Poses:
    top = _rig(
        head=(180, 60), hip=(180, 156), shoulder=(180, 88),
        elbow_l=(158, 120), elbow_r=(202, 120),
        hand_l=(152, 150), hand_r=(208, 150),
        knee_l=(172, 212), knee_r=(188, 212),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    bottom = _rig(
        head=(196, 108), hip=(196, 202), shoulder=(196, 136),
        elbow_l=(174, 166), elbow_r=(218, 166),
        hand_l=(168, 194), hand_r=(224, 194),
        knee_l=(168, 248), knee_r=(232, 248),
        foot_l=(158, 296), foot_r=(238, 296),
    )
    return top, bottom


def p_push() -> Poses:
    """Supino / flexão — braços empurram."""
    a = _rig(
        head=(104, 150), hip=(206, 196), shoulder=(150, 158),
        elbow_l=(176, 132), elbow_r=(176, 184),
        hand_l=(202, 122), hand_r=(202, 196),
        knee_l=(230, 250), knee_r=(246, 250),
        foot_l=(262, 296), foot_r=(276, 296),
    )
    b = _rig(
        head=(104, 150), hip=(206, 196), shoulder=(150, 158),
        elbow_l=(168, 130), elbow_r=(168, 186),
        hand_l=(188, 116), hand_r=(188, 200),
        knee_l=(230, 250), knee_r=(246, 250),
        foot_l=(262, 296), foot_r=(276, 296),
    )
    return a, b


def p_pull() -> Poses:
    """Puxada frontal — braços descem até o peito."""
    a = _rig(
        head=(180, 58), hip=(180, 156), shoulder=(180, 86),
        elbow_l=(150, 60), elbow_r=(210, 60),
        hand_l=(152, 26), hand_r=(208, 26),
        knee_l=(172, 212), knee_r=(188, 212),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    b = _rig(
        head=(180, 66), hip=(180, 162), shoulder=(180, 92),
        elbow_l=(154, 96), elbow_r=(206, 96),
        hand_l=(164, 130), hand_r=(196, 130),
        knee_l=(172, 214), knee_r=(188, 214),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    return a, b


def p_row() -> Poses:
    """Remada baixa — tronco inclinado, cotovelos puxam para trás."""
    a = _rig(
        head=(112, 146), hip=(180, 196), shoulder=(146, 118),
        elbow_l=(176, 104), elbow_r=(176, 132),
        hand_l=(200, 108), hand_r=(200, 136),
        knee_l=(172, 240), knee_r=(188, 240),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    b = _rig(
        head=(112, 146), hip=(180, 196), shoulder=(146, 118),
        elbow_l=(168, 100), elbow_r=(168, 136),
        hand_l=(186, 96), hand_r=(186, 142),
        knee_l=(172, 240), knee_r=(188, 240),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    return a, b


def p_curl() -> Poses:
    """Rosca — cotovelo flexiona, antebraço sobe."""
    a = _rig(
        head=(180, 60), hip=(180, 156), shoulder=(180, 88),
        elbow_l=(154, 118), elbow_r=(206, 118),
        hand_l=(150, 158), hand_r=(210, 158),
        knee_l=(172, 212), knee_r=(188, 212),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    b = _rig(
        head=(180, 60), hip=(180, 156), shoulder=(180, 88),
        elbow_l=(154, 118), elbow_r=(206, 118),
        hand_l=(154, 80), hand_r=(206, 80),
        knee_l=(172, 212), knee_r=(188, 212),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    return a, b


def p_extend() -> Poses:
    """Tríceps — braço estende para frente/baixo."""
    a = _rig(
        head=(180, 60), hip=(180, 156), shoulder=(180, 88),
        elbow_l=(154, 118), elbow_r=(206, 118),
        hand_l=(150, 158), hand_r=(210, 158),
        knee_l=(172, 212), knee_r=(188, 212),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    b = _rig(
        head=(180, 60), hip=(180, 156), shoulder=(180, 88),
        elbow_l=(150, 106), elbow_r=(210, 106),
        hand_l=(140, 92), hand_r=(220, 92),
        knee_l=(172, 212), knee_r=(188, 212),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    return a, b


def p_lateral_raise() -> Poses:
    a = _rig(
        head=(180, 60), hip=(180, 156), shoulder=(180, 88),
        elbow_l=(154, 118), elbow_r=(206, 118),
        hand_l=(150, 158), hand_r=(210, 158),
        knee_l=(172, 212), knee_r=(188, 212),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    b = _rig(
        head=(180, 60), hip=(180, 156), shoulder=(180, 88),
        elbow_l=(132, 84), elbow_r=(228, 84),
        hand_l=(96, 68), hand_r=(264, 68),
        knee_l=(172, 212), knee_r=(188, 212),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    return a, b


def p_overhead_press() -> Poses:
    a = _rig(
        head=(180, 60), hip=(180, 156), shoulder=(180, 88),
        elbow_l=(154, 118), elbow_r=(206, 118),
        hand_l=(150, 158), hand_r=(210, 158),
        knee_l=(172, 212), knee_r=(188, 212),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    b = _rig(
        head=(180, 60), hip=(180, 156), shoulder=(180, 88),
        elbow_l=(150, 76), elbow_r=(210, 76),
        hand_l=(146, 30), hand_r=(214, 30),
        knee_l=(172, 212), knee_r=(188, 212),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    return a, b


def p_abduct() -> Poses:
    """Abdução de quadril — pernas abrem para os lados."""
    a = _rig(
        head=(180, 58), hip=(180, 152), shoulder=(180, 86),
        elbow_l=(158, 116), elbow_r=(202, 116),
        hand_l=(152, 146), hand_r=(208, 146),
        knee_l=(168, 208), knee_r=(192, 208),
        foot_l=(158, 296), foot_r=(202, 296),
    )
    b = _rig(
        head=(180, 58), hip=(180, 152), shoulder=(180, 86),
        elbow_l=(158, 116), elbow_r=(202, 116),
        hand_l=(152, 146), hand_r=(208, 146),
        knee_l=(128, 216), knee_r=(232, 216),
        foot_l=(100, 296), foot_r=(260, 296),
    )
    return a, b


def p_adduct() -> Poses:
    """Adução de quadril — pernas fecham para dentro."""
    a = _rig(
        head=(180, 58), hip=(180, 152), shoulder=(180, 86),
        elbow_l=(158, 116), elbow_r=(202, 116),
        hand_l=(152, 146), hand_r=(208, 146),
        knee_l=(128, 216), knee_r=(232, 216),
        foot_l=(100, 296), foot_r=(260, 296),
    )
    b = _rig(
        head=(180, 58), hip=(180, 152), shoulder=(180, 86),
        elbow_l=(158, 116), elbow_r=(202, 116),
        hand_l=(152, 146), hand_r=(208, 146),
        knee_l=(168, 208), knee_r=(192, 208),
        foot_l=(158, 296), foot_r=(202, 296),
    )
    return a, b


def p_hip_flex() -> Poses:
    """Flexão de quadril (GHD) — quadril sobe de quadrupede."""
    a = _rig(
        head=(150, 74), hip=(206, 132), shoulder=(176, 96),
        elbow_l=(150, 130), elbow_r=(202, 130),
        hand_l=(126, 160), hand_r=(178, 160),
        knee_l=(250, 152), knee_r=(262, 140),
        foot_l=(286, 200), foot_r=(296, 190),
    )
    b = _rig(
        head=(120, 66), hip=(206, 132), shoulder=(172, 92),
        elbow_l=(142, 126), elbow_r=(196, 126),
        hand_l=(118, 156), hand_r=(172, 156),
        knee_l=(252, 150), knee_r=(264, 138),
        foot_l=(288, 198), foot_r=(298, 188),
    )
    return a, b


def p_bridge() -> Poses:
    """Hip thrust / elevação pélvica — quadril sobe."""
    a = _rig(
        head=(96, 168), hip=(196, 196), shoulder=(140, 182),
        elbow_l=(120, 218), elbow_r=(160, 218),
        hand_l=(112, 254), hand_r=(152, 254),
        knee_l=(238, 236), knee_r=(258, 232),
        foot_l=(268, 290), foot_r=(286, 286),
    )
    b = _rig(
        head=(96, 152), hip=(196, 164), shoulder=(140, 156),
        elbow_l=(120, 200), elbow_r=(160, 200),
        hand_l=(112, 240), hand_r=(152, 240),
        knee_l=(238, 220), knee_r=(258, 216),
        foot_l=(268, 290), foot_r=(286, 286),
    )
    return a, b


def p_calf_raise() -> Poses:
    a = _rig(
        head=(180, 58), hip=(180, 154), shoulder=(180, 86),
        elbow_l=(158, 116), elbow_r=(202, 116),
        hand_l=(152, 146), hand_r=(208, 146),
        knee_l=(174, 210), knee_r=(186, 210),
        foot_l=(168, 292), foot_r=(192, 292),
    )
    b = _rig(
        head=(180, 48), hip=(180, 144), shoulder=(180, 76),
        elbow_l=(158, 106), elbow_r=(202, 106),
        hand_l=(152, 136), hand_r=(208, 136),
        knee_l=(174, 202), knee_r=(186, 202),
        foot_l=(170, 288), foot_r=(190, 288),
    )
    return a, b


def p_plank() -> Poses:
    """Prancha — contração lombar estática com leve pulsação."""
    a = _rig(
        head=(86, 138), hip=(180, 168), shoulder=(116, 152),
        elbow_l=(120, 190), elbow_r=(156, 190),
        hand_l=(98, 214), hand_r=(134, 214),
        knee_l=(232, 214), knee_r=(258, 210),
        foot_l=(272, 248), foot_r=(296, 244),
    )
    b = _rig(
        head=(86, 134), hip=(180, 164), shoulder=(116, 148),
        elbow_l=(120, 186), elbow_r=(156, 186),
        hand_l=(98, 210), hand_r=(134, 210),
        knee_l=(232, 210), knee_r=(258, 206),
        foot_l=(272, 244), foot_r=(296, 240),
    )
    return a, b


def p_crunch() -> Poses:
    a = _rig(
        head=(150, 108), hip=(206, 190), shoulder=(178, 138),
        elbow_l=(150, 168), elbow_r=(206, 168),
        hand_l=(136, 192), hand_r=(220, 192),
        knee_l=(250, 240), knee_r=(268, 234),
        foot_l=(280, 288), foot_r=(296, 282),
    )
    b = _rig(
        head=(176, 78), hip=(206, 190), shoulder=(188, 118),
        elbow_l=(158, 152), elbow_r=(214, 152),
        hand_l=(146, 178), hand_r=(228, 178),
        knee_l=(250, 240), knee_r=(268, 234),
        foot_l=(280, 288), foot_r=(296, 282),
    )
    return a, b


def p_leg_raise() -> Poses:
    a = _rig(
        head=(120, 150), hip=(196, 178), shoulder=(152, 160),
        elbow_l=(130, 194), elbow_r=(174, 194),
        hand_l=(120, 222), hand_r=(164, 222),
        knee_l=(236, 232), knee_r=(258, 230),
        foot_l=(262, 284), foot_r=(282, 282),
    )
    b = _rig(
        head=(120, 150), hip=(196, 178), shoulder=(152, 160),
        elbow_l=(130, 194), elbow_r=(174, 194),
        hand_l=(120, 222), hand_r=(164, 222),
        knee_l=(222, 210), knee_r=(244, 208),
        foot_l=(216, 246), foot_r=(238, 244),
    )
    return a, b


def p_fly() -> Poses:
    """Crucifixo — braços abrem e fecham no peito."""
    a = _rig(
        head=(84, 150), hip=(206, 196), shoulder=(134, 158),
        elbow_l=(160, 140), elbow_r=(160, 176),
        hand_l=(186, 132), hand_r=(186, 184),
        knee_l=(232, 250), knee_r=(248, 250),
        foot_l=(266, 296), foot_r=(280, 296),
    )
    b = _rig(
        head=(84, 150), hip=(206, 196), shoulder=(134, 158),
        elbow_l=(152, 128), elbow_r=(152, 188),
        hand_l=(170, 118), hand_r=(170, 198),
        knee_l=(232, 250), knee_r=(248, 250),
        foot_l=(266, 296), foot_r=(280, 296),
    )
    return a, b


def p_shrug() -> Poses:
    a = _rig(
        head=(180, 58), hip=(180, 158), shoulder=(180, 92),
        elbow_l=(158, 122), elbow_r=(202, 122),
        hand_l=(152, 152), hand_r=(208, 152),
        knee_l=(172, 214), knee_r=(188, 214),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    b = _rig(
        head=(180, 48), hip=(180, 158), shoulder=(180, 82),
        elbow_l=(158, 112), elbow_r=(202, 112),
        hand_l=(152, 142), hand_r=(208, 142),
        knee_l=(172, 214), knee_r=(188, 214),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    return a, b


def p_dip() -> Poses:
    a = _rig(
        head=(150, 96), hip=(178, 168), shoulder=(166, 124),
        elbow_l=(190, 156), elbow_r=(202, 156),
        hand_l=(206, 190), hand_r=(218, 190),
        knee_l=(210, 214), knee_r=(230, 212),
        foot_l=(238, 264), foot_r=(256, 262),
    )
    b = _rig(
        head=(150, 116), hip=(178, 168), shoulder=(166, 134),
        elbow_l=(192, 162), elbow_r=(204, 162),
        hand_l=(206, 194), hand_r=(218, 194),
        knee_l=(210, 214), knee_r=(230, 212),
        foot_l=(238, 264), foot_r=(256, 262),
    )
    return a, b


def p_twist() -> Poses:
    """Wood chop / rotação de tronco."""
    a = _rig(
        head=(180, 66), hip=(180, 158), shoulder=(180, 94),
        elbow_l=(206, 82), elbow_r=(206, 116),
        hand_l=(230, 60), hand_r=(230, 92),
        knee_l=(172, 214), knee_r=(188, 214),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    b = _rig(
        head=(180, 66), hip=(180, 158), shoulder=(180, 94),
        elbow_l=(154, 82), elbow_r=(154, 116),
        hand_l=(130, 60), hand_r=(130, 92),
        knee_l=(172, 214), knee_r=(188, 214),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    return a, b


def p_russian_twist() -> Poses:
    """Russian twist — sentado, tronco girando com o haltere nas mãos."""
    a = _rig(
        head=(202, 132), hip=(180, 212), shoulder=(198, 160),
        elbow_l=(222, 182), elbow_r=(230, 198),
        hand_l=(240, 188), hand_r=(242, 204),
        knee_l=(210, 246), knee_r=(238, 242),
        foot_l=(218, 296), foot_r=(250, 292),
    )
    b = _rig(
        head=(158, 132), hip=(180, 212), shoulder=(162, 160),
        elbow_l=(138, 182), elbow_r=(130, 198),
        hand_l=(120, 188), hand_r=(118, 204),
        knee_l=(210, 246), knee_r=(238, 242),
        foot_l=(218, 296), foot_r=(250, 292),
    )
    return a, b


def p_cardio() -> Poses:
    """Corrida / skipping — passadas alternadas."""
    a = _rig(
        head=(180, 58), hip=(180, 154), shoulder=(180, 86),
        elbow_l=(156, 116), elbow_r=(204, 116),
        hand_l=(150, 146), hand_r=(210, 146),
        knee_l=(160, 210), knee_r=(200, 210),
        foot_l=(150, 288), foot_r=(214, 288),
    )
    b = _rig(
        head=(180, 68), hip=(180, 160), shoulder=(180, 92),
        elbow_l=(156, 122), elbow_r=(204, 122),
        hand_l=(150, 152), hand_r=(210, 152),
        knee_l=(196, 216), knee_r=(166, 216),
        foot_l=(208, 292), foot_r=(156, 292),
    )
    return a, b


def p_walk() -> Poses:
    """Caminhada — passada curta, braços alternando com as pernas."""
    a = _rig(
        head=(180, 58), hip=(180, 152), shoulder=(180, 86),
        elbow_l=(154, 118), elbow_r=(206, 112),
        hand_l=(150, 146), hand_r=(212, 138),
        knee_l=(152, 210), knee_r=(202, 208),
        foot_l=(136, 290), foot_r=(228, 286),
    )
    b = _rig(
        head=(180, 58), hip=(180, 152), shoulder=(180, 86),
        elbow_l=(154, 112), elbow_r=(206, 118),
        hand_l=(148, 138), hand_r=(210, 146),
        knee_l=(158, 208), knee_r=(208, 210),
        foot_l=(132, 286), foot_r=(224, 290),
    )
    return a, b


def p_run() -> Poses:
    """Corrida — joelho alto, tronco levemente inclinado, braços dobrados."""
    a = _rig(
        head=(176, 58), hip=(180, 150), shoulder=(178, 84),
        elbow_l=(150, 110), elbow_r=(206, 108),
        hand_l=(162, 136), hand_r=(200, 134),
        knee_l=(150, 196), knee_r=(210, 212),
        foot_l=(140, 258), foot_r=(238, 282),
    )
    b = _rig(
        head=(184, 58), hip=(180, 150), shoulder=(182, 84),
        elbow_l=(154, 108), elbow_r=(210, 110),
        hand_l=(146, 134), hand_r=(198, 136),
        knee_l=(150, 212), knee_r=(210, 196),
        foot_l=(142, 282), foot_r=(220, 258),
    )
    return a, b


def p_jump_rope() -> Poses:
    """Pular corda — salto curto com os braços abertos segurando a corda."""
    a = _rig(
        head=(180, 58), hip=(180, 152), shoulder=(180, 86),
        elbow_l=(148, 112), elbow_r=(212, 112),
        hand_l=(122, 104), hand_r=(238, 104),
        knee_l=(166, 204), knee_r=(194, 204),
        foot_l=(160, 272), foot_r=(200, 272),
    )
    b = _rig(
        head=(180, 58), hip=(180, 154), shoulder=(180, 88),
        elbow_l=(150, 116), elbow_r=(210, 116),
        hand_l=(124, 110), hand_r=(236, 110),
        knee_l=(166, 208), knee_r=(194, 208),
        foot_l=(158, 298), foot_r=(202, 298),
    )
    return a, b


def p_treadmill() -> Poses:
    """Esteira — caminhada sobre a esteira rolante."""
    a = _rig(
        head=(180, 58), hip=(180, 152), shoulder=(180, 86),
        elbow_l=(154, 118), elbow_r=(206, 112),
        hand_l=(150, 146), hand_r=(212, 138),
        knee_l=(152, 210), knee_r=(202, 208),
        foot_l=(136, 282), foot_r=(228, 278),
    )
    b = _rig(
        head=(180, 58), hip=(180, 152), shoulder=(180, 86),
        elbow_l=(154, 112), elbow_r=(206, 118),
        hand_l=(148, 138), hand_r=(210, 146),
        knee_l=(158, 208), knee_r=(208, 210),
        foot_l=(132, 278), foot_r=(224, 282),
    )
    return a, b


def p_elliptical() -> Poses:
    """Elíptico — pernas alternando nos pedais, braços no manípulo."""
    a = _rig(
        head=(180, 60), hip=(180, 156), shoulder=(180, 90),
        elbow_l=(152, 116), elbow_r=(208, 116),
        hand_l=(140, 138), hand_r=(220, 138),
        knee_l=(158, 208), knee_r=(202, 208),
        foot_l=(150, 268), foot_r=(210, 268),
    )
    b = _rig(
        head=(180, 60), hip=(180, 156), shoulder=(180, 90),
        elbow_l=(152, 116), elbow_r=(208, 116),
        hand_l=(140, 138), hand_r=(220, 138),
        knee_l=(202, 208), knee_r=(158, 208),
        foot_l=(210, 268), foot_r=(150, 268),
    )
    return a, b


def p_row_ergometer() -> Poses:
    """Remo ergométrico — sentado, puxando a barra do remo."""
    a = _rig(
        head=(146, 96), hip=(196, 176), shoulder=(162, 118),
        elbow_l=(196, 136), elbow_r=(204, 168),
        hand_l=(228, 158), hand_r=(232, 190),
        knee_l=(238, 210), knee_r=(242, 226),
        foot_l=(258, 268), foot_r=(262, 284),
    )
    b = _rig(
        head=(140, 92), hip=(190, 174), shoulder=(156, 114),
        elbow_l=(188, 132), elbow_r=(196, 164),
        hand_l=(220, 154), hand_r=(224, 186),
        knee_l=(232, 208), knee_r=(236, 224),
        foot_l=(252, 266), foot_r=(256, 282),
    )
    return a, b


def p_bike() -> Poses:
    """Bicicleta ergométrica — sentado, pedalando."""
    a = _rig(
        head=(160, 88), hip=(186, 168), shoulder=(168, 116),
        elbow_l=(196, 138), elbow_r=(214, 150),
        hand_l=(214, 160), hand_r=(226, 168),
        knee_l=(206, 206), knee_r=(224, 214),
        foot_l=(212, 262), foot_r=(236, 274),
    )
    b = _rig(
        head=(160, 88), hip=(186, 168), shoulder=(168, 116),
        elbow_l=(196, 138), elbow_r=(214, 150),
        hand_l=(214, 160), hand_r=(226, 168),
        knee_l=(224, 214), knee_r=(206, 206),
        foot_l=(236, 274), foot_r=(212, 262),
    )
    return a, b


def p_stretch() -> Poses:
    a = _rig(
        head=(180, 60), hip=(180, 156), shoulder=(180, 88),
        elbow_l=(154, 118), elbow_r=(206, 118),
        hand_l=(150, 158), hand_r=(210, 158),
        knee_l=(172, 212), knee_r=(188, 212),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    b = _rig(
        head=(180, 60), hip=(180, 156), shoulder=(180, 88),
        elbow_l=(160, 112), elbow_r=(202, 118),
        hand_l=(206, 100), hand_r=(210, 158),
        knee_l=(172, 212), knee_r=(188, 212),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    return a, b


def p_kettlebell_swing() -> Poses:
    a = _rig(
        head=(180, 74), hip=(180, 160), shoulder=(180, 98),
        elbow_l=(160, 128), elbow_r=(200, 128),
        hand_l=(152, 158), hand_r=(208, 158),
        knee_l=(170, 216), knee_r=(190, 216),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    b = _rig(
        head=(180, 54), hip=(180, 156), shoulder=(180, 88),
        elbow_l=(158, 118), elbow_r=(202, 118),
        hand_l=(150, 148), hand_r=(210, 148),
        knee_l=(172, 212), knee_r=(188, 212),
        foot_l=(160, 296), foot_r=(200, 296),
    )
    return a, b


def p_bench_press() -> Poses:
    """Supino com banco — deitado, braços sobem e descem."""
    a = _rig(
        head=(70, 168), hip=(190, 196), shoulder=(120, 178),
        elbow_l=(160, 148), elbow_r=(160, 206),
        hand_l=(196, 136), hand_r=(196, 218),
        knee_l=(228, 236), knee_r=(250, 232),
        foot_l=(262, 286), foot_r=(282, 282),
    )
    b = _rig(
        head=(70, 168), hip=(190, 196), shoulder=(120, 178),
        elbow_l=(152, 146), elbow_r=(152, 210),
        hand_l=(182, 132), hand_r=(182, 222),
        knee_l=(228, 236), knee_r=(250, 232),
        foot_l=(262, 286), foot_r=(282, 282),
    )
    return a, b


def p_leg_press() -> Poses:
    """Leg press — deitado, pernas empurram."""
    a = _rig(
        head=(70, 150), hip=(196, 178), shoulder=(124, 166),
        elbow_l=(104, 200), elbow_r=(146, 200),
        hand_l=(96, 232), hand_r=(138, 232),
        knee_l=(248, 216), knee_r=(256, 214),
        foot_l=(286, 190), foot_r=(294, 188),
    )
    b = _rig(
        head=(70, 150), hip=(196, 178), shoulder=(124, 166),
        elbow_l=(104, 200), elbow_r=(146, 200),
        hand_l=(96, 232), hand_r=(138, 232),
        knee_l=(238, 202), knee_r=(246, 200),
        foot_l=(292, 170), foot_r=(300, 168),
    )
    return a, b


def p_row_machine() -> Poses:
    a = _rig(
        head=(120, 130), hip=(190, 196), shoulder=(152, 150),
        elbow_l=(186, 126), elbow_r=(186, 166),
        hand_l=(214, 116), hand_r=(214, 176),
        knee_l=(222, 240), knee_r=(240, 236),
        foot_l=(240, 290), foot_r=(258, 286),
    )
    b = _rig(
        head=(120, 130), hip=(190, 196), shoulder=(152, 150),
        elbow_l=(178, 122), elbow_r=(178, 170),
        hand_l=(202, 112), hand_r=(202, 180),
        knee_l=(222, 240), knee_r=(240, 236),
        foot_l=(240, 290), foot_r=(258, 286),
    )
    return a, b


MOTIONS: Dict[str, MotionFn] = {
    "squat": p_squat,
    "hinge": p_hinge,
    "lunge": p_lunge,
    "push": p_push,
    "bench_press": p_bench_press,
    "pull": p_pull,
    "row": p_row,
    "row_machine": p_row_machine,
    "curl": p_curl,
    "extend": p_extend,
    "lateral_raise": p_lateral_raise,
    "overhead_press": p_overhead_press,
    "abduct": p_abduct,
    "adduct": p_adduct,
    "hip_flex": p_hip_flex,
    "bridge": p_bridge,
    "calf_raise": p_calf_raise,
    "plank": p_plank,
    "crunch": p_crunch,
    "leg_raise": p_leg_raise,
    "fly": p_fly,
    "shrug": p_shrug,
    "dip": p_dip,
    "twist": p_twist,
    "cardio": p_cardio,
    "walk": p_walk,
    "run": p_run,
    "jump_rope": p_jump_rope,
    "treadmill": p_treadmill,
    "elliptical": p_elliptical,
    "row_ergometer": p_row_ergometer,
    "bike": p_bike,
    "russian_twist": p_russian_twist,
    "stretch": p_stretch,
    "kettlebell_swing": p_kettlebell_swing,
    "leg_press": p_leg_press,
}


# ─────────────────────────────────────────────────────────────────────────────
# Classificação dos exercícios
# ─────────────────────────────────────────────────────────────────────────────
# Regras em ordem de prioridade. Cada regra: (regex, motion, equipment, group)
# `group` = None → deduzido da categoria do exercício.
Rule = Tuple[str, str, str, Optional[str]]

RULES: List[Rule] = [
    # ── Panturrilha ──
    (r"panturrilha|calcanhar|calf", "calf_raise", "none", "panturrilha"),
    # ── Abdução / adução de quadril ──
    (r"abdu[çc][ãa]o.*m[áa]quina|abdutora|abduction machine", "abduct", "machine", "gluteos"),
    (r"adutora|aduction|ad[úu]tor", "adduct", "machine", "gluteos"),
    (r"abdu[çc][ãa]o|abduct", "abduct", "none", "gluteos"),
    # ── Flexão de quadril (GHD) — antes de "glúteo", senão "flexão de
    #    quadril no cabo" cairia em bridge. ──
    (r"flex[ãa]o do quadril|hip.?flex|back extension|ghd|hiperextens", "hip_flex", "none", "costas"),
    # ── Glúteos ──
    (r"gl[úu]teo.*m[áa]quina|multi-hip|hip.?thrust machine|glute machine",
     "bridge", "machine", "gluteos"),
    (r"panturrilha.*m[áa]quina", "calf_raise", "machine", "panturrilha"),
    (r"hip.?thrust|ponte de gl[úu]teo|glute drive|glute kickback|coice",
     "bridge", "bar", "gluteos"),
    (r"elev[ãa][çc][ãa]o p[ée]lvica|gl[úu]teo quatro apoios|extens[ãa]o de quadril|pelvic bridge|quadruped|frog.?pump",
     "bridge", "none", "gluteos"),
    # ── Afundo / Avanço / Step up (ANTES de agachamento) ──
    (r"afundo|avanço|lunge|step.?up|b[úu]lgaro|bulg[áa]rio",
     "lunge", "none", "pernas"),
    (r"afundo|avanço|lunge|step.?up|b[úu]lgaro.*(halter|barra|com halter)",
     "lunge", "dumbbell", "pernas"),
    (r"afundo|avanço|lunge|step.?up|b[úu]lgaro.*(cabo|polia|el[áa]stico)",
     "lunge", "cable", "pernas"),
    # ── Leg press (ANTES de agachamento) ──
    (r"leg press|pressa de perna|legpress", "leg_press", "machine", "pernas"),
    # ── Agachamento / pernas ──
    (r"agachamento|squat|v.?squat|sissy|sum[óo]", "squat", "none", "pernas"),
    (r"agachamento|squat|v.?squat|sissy|sum[óo].*(barra|smith|com halter|halter|bar)",
     "squat", "bar", "pernas"),
    (r"agachamento|squat|v.?squat|sissy|sum[óo].*(cabo|polia|el[áa]stico)",
     "squat", "cable", "pernas"),
    (r"hack squat|agachamento no hack", "leg_press", "machine", "quadriceps"),
    (r"cadeira extensora|leg extension|extens[ãa]o de joelho", "squat", "machine", "quadriceps"),
    # ── Posterior ──
    (r"mesa flexora|cadeira flexora|flexora|leg curl|flex[ãa]o de joelho|hamstring curl",
     "hinge", "machine", "posterior"),
    (r"stiff|romeno|deadlift|levantamento terra|bom dia|good morning|pull through|reverse hyper|nordic|glute ham",
     "hinge", "bar", "posterior"),
    (r"stiff|romeno|deadlift|levantamento terra|bom dia|good morning|pull through|reverse hyper|nordic|glute ham",
     "hinge", "none", "posterior"),
    # ── Peito ──
    (r"supino.*(barra|com barra|bar)|bench press.*bar|chest press.*barra|desenvolvimento.*barra",
     "bench_press", "bar", "peito"),
    (r"supino.*halter|bench press.*dumbbell|chest press.*halter|desenvolvimento.*halter",
     "bench_press", "dumbbell", "peito"),
    (r"supino.*cabo|bench press.*cable|chest press.*cabo|peck deck|ma[çc]quina.*peito|horizontal bench|iso-lateral|wide chest|super incline|super squat",
     "bench_press", "machine", "peito"),
    (r"supino|bench press|desenvolvimento.*peito|chest press|press.*peito",
     "bench_press", "none", "peito"),
    (r"flex[ãa]o declinada|push up.*(p[eé]s|feet|elevat)", "push", "none", "peito"),
    (r"flex[ãa]o de bra[çc]o|flex[ãa]o|push.?up|mergulho|dips|bosu",
     "push", "none", "peito"),
    (r"crucifixo.*cabo|crossover.*cabo|fly.*cable", "fly", "cable", "peito"),
    (r"crucifixo|fly|crossover|abdu[çc][ãa]o.*peito|voador", "fly", "none", "peito"),
    # ── Costas ──
    (r"puxada frontal|pulldown|pull.?down|pull.?up|chin.?up|barra fixa",
     "pull", "machine", "costas"),
    (r"puxada|pulldown|pull.?down|pull.?up|chin.?up|barra fixa|elev[ãa][çc][ãa]o.*costas",
     "pull", "none", "costas"),
    (r"remada baixa no cabo|low row|remada no cabo|remada no polia|pullover",
     "row", "cable", "costas"),
    (r"face pull|rear delt|pull.?face", "row", "cable", "ombros"),
    (r"remada curvada|remada baixa|remada unilateral|barbell row|remada com barra",
     "row", "bar", "costas"),
    (r"remada.*m[áa]quina|rowing machine|remada na m[áa]quina", "row_machine", "machine", "costas"),
    (r"remada|row", "row", "none", "costas"),
    (r"encolhimento|shrug", "shrug", "none", "costas"),
    # ── Ombros ──
    (r"desenvolvimento.*(barra|com barra)|shoulder press.*bar|military press.*bar",
     "overhead_press", "bar", "ombros"),
    (r"desenvolvimento.*halter|shoulder press.*dumbbell", "overhead_press", "dumbbell", "ombros"),
    (r"desenvolvimento.*cabo|shoulder press.*cable|elev[ãa][çc][ãa]o frontal.*cabo",
     "overhead_press", "cable", "ombros"),
    (r"desenvolvimento|shoulder press|military press|overhead press|elev[ãa][çc][ãa]o frontal",
     "overhead_press", "none", "ombros"),
    (r"elev[ãa][çc][ãa]o lateral.*(cabo|polia|halter|el[áa]stico)",
     "lateral_raise", "cable", "ombros"),
    (r"elev[ãa][çc][ãa]o lateral|elevacao lateral|lateral raise|ar{ñn}o lateral|elev[ãa][çc][ãa]o de bra[çc]o",
     "lateral_raise", "none", "ombros"),
    (r"upright row|remada alta", "row", "bar", "ombros"),
    # ── Braços ──
    (r"rosca.*(halter|com halter)|curl.*dumbbell|hammer curl|rosca martelo|rosca alternada|rosca concentrada|rosca inversa",
     "curl", "dumbbell", "bracos"),
    (r"rosca.*(barra|com barra)|curl.*bar", "curl", "bar", "bracos"),
    (r"rosca.*(cabo|polia|corda)|cable curl", "curl", "cable", "bracos"),
    (r"rosca|curl|biceps", "curl", "none", "bracos"),
    (r"tr[íi]ceps.*(barra|com barra|testa)|tricep.*bar|close grip", "extend", "bar", "bracos"),
    (r"tr[íi]ceps.*halter|tricep.*dumbbell", "extend", "dumbbell", "bracos"),
    (r"tr[íi]ceps.*cabo|tricep.*cable|pushdown", "extend", "cable", "bracos"),
    (r"tr[íi]ceps|tricep", "extend", "none", "bracos"),
    (r"mergulho|dips", "dip", "none", "peito"),
    (r"antec|br[çc]ao|panturrilha.*m[áa]quina|wrist", "curl", "machine", "bracos"),
    # ── Core ──
    (r"prancha|plank|dead bug", "plank", "none", "abdomen"),
    (r"abdominal|crunch|oblique|sant[óo]rio|roll up|curl up", "crunch", "none", "abdomen"),
    (r"elev[ãa][çc][ãa]o de pernas|leg raise|reverse crunch|ponto de joelho|double leg",
     "leg_raise", "none", "abdomen"),
    (r"wood chop|rotation|rota[çc][ãa]o|twist|pallof|farmer", "twist", "none", "abdomen"),
    (r"r[óo]tula do tronco|sant[óo]rio lateral", "twist", "none", "abdomen"),
    # ── Cardio / alongamento ──
    (r"caminhada|esteira|corrida|pular corda|skip|rem[óo]|bike|bicicleta|el[íi]ptic|rowing|p[óo]mbora|cardio|p[óo]lite|step",
     "cardio", "none", "cardio"),
    (r"alongamento|stretch|flex[ãa]o|distens[ãa]o|mobilidade", "stretch", "none", "cardio"),
    (r"kettlebell swing|balanço|swing", "kettlebell_swing", "kettlebell", "cardio"),
]

# Normalização do equipamento: o banco mistura o vocabulário pt-BR de
# `equipment` (maquina, cabo, haltere...) com o enum de `machine_type`
# (selectorized, plate_loaded, cable, smith...). Tudo cai em 6 buckets.
EQUIP_NORMALIZE: Dict[str, str] = {
    "nenhum": "none", "none": "none", "bodyweight": "none", "peso corporal": "none",
    "maquina": "machine", "machine": "machine", "selectorized": "machine",
    "plate_loaded": "machine", "smith": "machine", "cardio": "machine",
    "el[óo]tric": "machine", "erg[óô]metro": "machine", "bike": "machine",
    "remador": "machine", "aparelho": "machine",
    "cabo": "cable", "cable": "cable", "polia": "cable",
    "elastico": "band", "band": "band", "resistencia": "band",
    "haltere": "dumbbell", "dumbbell": "dumbbell",
    "barra": "bar", "barbell": "bar", "barra fixa": "bar",
    "kettlebell": "kettlebell",
    "outro": "none", "other": "none",
}

# Ordem de resolução: keywords do nome > valor normalizado do banco.
EQUIP_KEYWORDS: List[Tuple[str, str]] = [
    (r"kettlebell", "kettlebell"),
    (r"cabo|polia|cord[ãa]|cable", "cable"),
    (r"el[áa]stico|band|resist[êe]ncia", "band"),
    (r"halter|haltere|dumbbell", "dumbbell"),
    (r"barra|barbell|smith", "bar"),
    (r"m[áa]quina|machine|aparelho|equipment|selectorized|plate_loaded", "machine"),
    (r"el[óo]tric|erg[óô]metro|bike|remador", "machine"),
]


# ─────────────────────────────────────────────────────────────────────────────
# Renderização
# ─────────────────────────────────────────────────────────────────────────────
def draw_frame(
    rig: Rig,
    *,
    stroke: str,
    equipment: str,
    motion: str = "squat",
    floor_y: float = 300.0,
) -> Image.Image:
    img = Image.new("RGB", (CANVAS, CANVAS), BG)
    d = ImageDraw.Draw(img)

    # Piso
    d.line([(28, floor_y), (CANVAS - 28, floor_y)], fill=FLOOR, width=3)

    def bone(a, b, w=STROKE_W, color=None):
        d.line([a, b], fill=color or stroke, width=w)

    # Tronco e quadril
    bone(rig.shoulder, rig.hip)
    # Cabeça
    d.ellipse(
        [rig.head[0] - HEAD_R, rig.head[1] - HEAD_R,
         rig.head[0] + HEAD_R, rig.head[1] + HEAD_R],
        fill=HEAD,
    )
    # Pescoço
    bone(rig.head, rig.shoulder, w=4)

    # Braços
    bone(rig.shoulder, rig.elbow_l)
    bone(rig.elbow_l, rig.hand_l)
    bone(rig.shoulder, rig.elbow_r)
    bone(rig.elbow_r, rig.hand_r)

    # Pernas
    bone(rig.hip, rig.knee_l)
    bone(rig.knee_l, rig.foot_l)
    bone(rig.hip, rig.knee_r)
    bone(rig.knee_r, rig.foot_r)

    # ── Equipamento ──
    if equipment == "bar":
        p1, p2 = _bar_points(rig, motion)
        d.line([p1, p2], fill=EQUIP, width=8)
        for px, py in (p1, p2):
            d.ellipse([px - 9, py - 9, px + 9, py + 9], fill=EQUIP)
    elif equipment == "dumbbell":
        for hx, hy in (rig.hand_l, rig.hand_r):
            d.ellipse([hx - 11, hy - 11, hx + 11, hy + 11], fill=EQUIP)
            d.line([(hx, hy - 11), (hx, hy + 11)], fill=EQUIP, width=4)
    elif equipment == "kettlebell":
        for hx, hy in (rig.hand_l, rig.hand_r):
            d.ellipse([hx - 13, hy - 8, hx + 13, hy + 18], fill=EQUIP)
            d.arc([hx - 10, hy - 20, hx + 10, hy + 2], 180, 360, fill=EQUIP, width=4)
    elif equipment == "band":
        d.line([rig.hand_l, rig.hand_r], fill=EQUIP, width=6)
    elif equipment == "cable":
        # Torre/polia à direita + cabo até a mão mais próxima
        anchor_x, anchor_y = 318, 66
        d.line([(anchor_x, 18), (anchor_x, anchor_y)], fill=EQUIP, width=5)
        d.ellipse([anchor_x - 13, anchor_y - 13, anchor_x + 13, anchor_y + 13], fill=EQUIP)
        hand = rig.hand_r if abs(rig.hand_r[0] - anchor_x) < abs(rig.hand_l[0] - anchor_x) else rig.hand_l
        d.line([(anchor_x, anchor_y), hand], fill=EQUIP, width=3)
    elif equipment == "machine":
        _draw_machine(d, rig, stroke)
    elif equipment == "treadmill":
        _draw_treadmill(d, rig)
    elif equipment == "elliptical":
        _draw_elliptical(d, rig)
    elif equipment == "rope":
        _draw_rope(d, rig, motion)
    elif equipment == "rower":
        _draw_rower(d, rig)
    elif equipment == "bike":
        _draw_bike(d, rig)

    return img


def _draw_rower(d: ImageDraw.ImageDraw, rig: Rig) -> None:
    """Remo ergométrico — trilho com o carrinho e o cabo da barra."""
    base_y = 296
    d.line([(40, base_y + 18), (CANVAS - 46, base_y + 18)], fill=EQUIP, width=9)
    d.line([(40, base_y + 18), (40, base_y - 26)], fill=EQUIP, width=6)
    # Corrente da barra
    hand = rig.hand_l
    d.line([(CANVAS - 50, base_y - 20), hand], fill=EQUIP, width=3)
    # Seletor
    d.rounded_rectangle(
        [CANVAS - 62, base_y - 44, CANVAS - 34, base_y - 16], radius=5, fill=EQUIP
    )


def _draw_bike(d: ImageDraw.ImageDraw, rig: Rig) -> None:
    """Bicicleta ergométrica — quadro, pedais e guidão."""
    cx = (rig.foot_l[0] + rig.foot_r[0]) // 2
    base_y = 292
    # Quadro
    d.ellipse([cx - 30, base_y - 34, cx + 8, base_y + 8], outline=EQUIP, width=5)
    d.line([(cx - 12, base_y - 12), (cx + 34, base_y - 12)], fill=EQUIP, width=6)
    # Guidão
    d.line([(cx + 34, base_y - 12), (cx + 40, base_y - 62)], fill=EQUIP, width=6)
    d.line([(cx + 26, base_y - 64), (cx + 54, base_y - 64)], fill=EQUIP, width=5)
    # Suporte
    d.line([(cx - 26, base_y + 8), (cx + 44, base_y + 8)], fill=EQUIP, width=7)


def _draw_treadmill(d: ImageDraw.ImageDraw, rig: Rig) -> None:
    """Esteira: esteira rolante sob os pés + console na frente."""
    left = min(rig.foot_l[0], rig.foot_r[0])
    right = max(rig.foot_l[0], rig.foot_r[0])
    cx = (left + right) // 2
    belt_y = 288
    # Base (esteira rolante) em perspectiva, com a faixa logo sob os pés
    d.line([(cx - 86, belt_y + 12), (cx + 74, belt_y + 12)], fill=EQUIP, width=9)
    d.line([(cx - 78, belt_y), (cx + 66, belt_y)], fill=EQUIP, width=6)
    d.line([(cx + 66, belt_y), (cx + 74, belt_y + 12)], fill=EQUIP, width=5)
    # Haste e console
    d.line([(cx + 68, belt_y + 4), (cx + 82, belt_y - 74)], fill=EQUIP, width=6)
    d.line([(cx + 64, belt_y - 78), (cx + 104, belt_y - 78)], fill=EQUIP, width=7)


def _draw_elliptical(d: ImageDraw.ImageDraw, rig: Rig) -> None:
    """Elíptico: base, pedais e braços de impulso."""
    cx = (rig.foot_l[0] + rig.foot_r[0]) // 2
    base_y = 300
    # Pedais (dois, linked)
    d.ellipse([cx - 46, base_y - 12, cx - 14, base_y + 6], outline=EQUIP, width=5)
    d.ellipse([cx + 14, base_y - 12, cx + 46, base_y + 6], outline=EQUIP, width=5)
    # Haste central + braços de impulso
    d.line([(cx, base_y - 4), (cx, base_y - 92)], fill=EQUIP, width=6)
    d.line([(cx - 6, base_y - 92), (cx - 54, base_y - 108)], fill=EQUIP, width=5)
    d.line([(cx + 6, base_y - 92), (cx + 54, base_y - 108)], fill=EQUIP, width=5)
    # Punhos
    for px, py in ((cx - 54, base_y - 108), (cx + 54, base_y - 108)):
        d.line([(px, py), (px, py - 12)], fill=EQUIP, width=6)


def _draw_rope(d: ImageDraw.ImageDraw, rig: Rig, motion: str) -> None:
    """Corda de pular: arco que passa por cima e por baixo do corpo."""
    hl, hr = rig.hand_l, rig.hand_r
    top = min(hl[1], hr[1]) - 56
    bottom = min(max(rig.foot_l[1], rig.foot_r[1]) + 14, 288)
    airborne = rig.foot_l[1] < 292 and rig.foot_r[1] < 292
    if airborne:
        # No ar: a corda passa por baixo do corpo.
        d.arc([hl[0], top, hr[0], bottom], 180, 360, fill=EQUIP, width=5)
    else:
        d.arc([hl[0], top, hr[0], bottom], 0, 180, fill=EQUIP, width=5)


def _draw_machine(d: ImageDraw.ImageDraw, rig: Rig, stroke: str) -> None:
    """Desenha o equipamento de máquina (trilho + assento + peso).

    A máquina é o elemento que identifica o aparelho no GIF, então é
    desenhada com traço grosso e bem visível — como nas ilustrações do
    Wikimedia (puxador alto, leg press, etc.).
    """
    hipx, hipy = rig.hip
    rail_x = CANVAS - 26

    # Trilho vertical do aparelho (duplo, como nas máquinas reais)
    d.line([(rail_x, 26), (rail_x, CANVAS - 38)], fill=EQUIP, width=7)
    d.line([(rail_x - 13, 26), (rail_x - 13, CANVAS - 38)], fill=EQUIP, width=4)

    # Suporte onde a pessoa se apoia (assento encosto)
    d.line([(rail_x, hipy + 8), (hipx + 34, hipy + 8)], fill=EQUIP, width=7)

    # Seletor de peso no topo do trilho
    d.rounded_rectangle(
        [rail_x - 17, 44, rail_x + 17, 78], radius=7, fill=EQUIP
    )
    # Pé/encosto do aparelho
    d.line([(rail_x - 22, CANVAS - 38), (rail_x + 22, CANVAS - 38)], fill=EQUIP, width=7)


# Onde a barra é fixada, por padrão de movimento.
#   "shoulder" — sobre os ombros (agachamento, terra, supino com barra)
#   "hands"    — nas mãos (supino, landmine,military press)
#   "hip"      — sobre o quadril (hip thrust)
#   "low"      — à frente, na altura do quadril (stiff, deadlift)
BAR_ANCHOR: Dict[str, str] = {
    "bench_press": "hands",
    "bridge": "hip",
    "hinge": "low",
    "overhead_press": "hands",
    "row": "hands",
    "lateral_raise": "hands",
    "twist": "hands",
}


def _bar_points(rig: Rig, motion: str):
    """Pontos de fixação da barra, conforme o padrão de movimento."""
    anchor = BAR_ANCHOR.get(motion, "shoulder")
    if anchor == "hands":
        # Barra horizontal segurada pelas mãos (supino, landmine, etc.).
        # Usa a mão mais alta como centro para a barra ficar nivelada.
        top = rig.hand_r if rig.hand_r[1] <= rig.hand_l[1] else rig.hand_l
        return (top[0] - 42, top[1]), (top[0] + 42, top[1])
    if anchor == "hip":
        hx, hy = rig.hip
        return (hx - 48, hy - 6), (hx + 48, hy - 6)
    if anchor == "low":
        hx, hy = rig.hip
        return (hx - 44, hy + 18), (hx + 44, hy + 18)
    sx, sy = rig.shoulder
    return (sx - 46, sy - 16), (sx + 46, sy - 16)


def build_gif(
    motion: str,
    equipment: str,
    group: str,
) -> bytes:
    """Gera o GIF (bytes) para o par (motion, equipment, group)."""
    fn = MOTIONS[motion]
    pose_a, pose_b = fn()
    stroke = STROKE_BY_GROUP.get(group, STROKE_BY_GROUP["outro"])

    frames: List[Image.Image] = []
    for i in range(FRAMES):
        # Triangular: sobe até o meio e volta. Garante loop sem salto.
        t = i / FRAMES
        phase = 0.5 - 0.5 * math.cos(2 * math.pi * t)
        rig = pose_a.lerp(pose_b, phase)
        frames.append(draw_frame(rig, stroke=stroke, equipment=equipment, motion=motion))

    from io import BytesIO

    buf = BytesIO()
    frames[0].save(
        buf,
        format="GIF",
        save_all=True,
        append_images=frames[1:],
        duration=int(1000 / FPS),
        loop=0,
        optimize=True,
        disposal=2,
    )
    return buf.getvalue()


# ─────────────────────────────────────────────────────────────────────────────
# Classificação
# ─────────────────────────────────────────────────────────────────────────────
# Exercícios sem ilustração equivalente no Wikimedia Commons: cada um
# recebe um movimento e equipamento próprios, para que a animação mostre
# o movimento correto (e o aparelho, quando existir).
SPECIAL_MOTIONS: Dict[str, Tuple[str, str, str]] = {
    "caminhada": ("walk", "none", "cardio"),
    "caminhada com elástico": ("walk", "band", "cardio"),
    "corrida": ("run", "none", "cardio"),
    "esteira": ("treadmill", "treadmill", "cardio"),
    "elíptico": ("elliptical", "elliptical", "cardio"),
    "pular corda": ("jump_rope", "rope", "cardio"),
    "remo ergométrico": ("row_ergometer", "rower", "cardio"),
    "bicicleta ergométrica": ("bike", "bike", "cardio"),
    "prancha": ("plank", "none", "abdomen"),
    "russian twist": ("russian_twist", "dumbbell", "abdomen"),
    "swing de kettlebell": ("kettlebell_swing", "kettlebell", "posterior"),
    "glúteo na máquina": ("bridge", "machine", "gluteos"),
}


def classify(name: str, category: Optional[str], equipment: Optional[str]) -> Tuple[str, str, str]:
    """Retorna (motion, equipment, group) para um exercício."""
    n = name.lower()

    motion: Optional[str] = None
    eq: Optional[str] = None
    grp: Optional[str] = None

    for pattern, m, e, g in RULES:
        if re.search(pattern, n, re.I):
            motion, eq, grp = m, e, g
            break

    # ── Group: usa a categoria fina se existir, senão cai no legado ──
    if category:
        grp = category
    elif grp is None:
        grp = "outro"

    # ── Equipment: o do banco tem prioridade sobre o inferido pela regra ──
    eq_from_db = None
    if equipment:
        key = EQUIP_NORMALIZE.get(equipment.strip().lower())
        if key:
            eq_from_db = key
        else:
            for pattern, k in EQUIP_KEYWORDS:
                if re.search(pattern, equipment, re.I):
                    eq_from_db = k
                    break
        if eq_from_db is None:
            eq_from_db = "none"
    else:
        eq_from_db = "none"

    if eq_from_db != "none":
        eq = eq_from_db
    if eq is None:
        eq = "none"

    # Movimento padrão quando nada casou
    if motion is None:
        motion = "squat" if grp in ("pernas", "gluteos") else "curl"

    # ── Casos sem ilustração equivalente no Commons ──
    # Cada um tem o próprio movimento/equipamento, para que a animação
    # corresponda ao movimento real (nada de genérico).
    special = SPECIAL_MOTIONS.get(n.strip())
    if special:
        motion, eq, grp = special

    return motion, eq, grp


def slugify(name: str) -> str:
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    s = s.lower().replace("—", "-")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "exercise"


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────
def main() -> int:
    ap = argparse.ArgumentParser(description="Gera GIFs demonstrativos dos exercícios")
    ap.add_argument("--catalog", default="scripts/exercise-catalog.json",
                    help="JSON com [{name, category, equipment}]")
    ap.add_argument("--out", default="public/exercises-gifs",
                    help="Pasta de saída dos GIFs")
    ap.add_argument("--limit", type=int, default=0, help="Gera apenas N exercícios")
    ap.add_argument("--dry-run", action="store_true", help="Só mostra o mapeamento")
    ap.add_argument("--only", default="", help="Filtra por nome (regex)")
    ap.add_argument(
        "--source",
        choices=["auto", "wiki", "local"],
        default="auto",
        help="auto = Wikimedia Commons quando houver, senão vetor local; "
             "wiki = só Wikimedia; local = só vetor local",
    )
    args = ap.parse_args()

    catalog_path = Path(args.catalog)
    if not catalog_path.exists():
        print(f"ERRO: catálogo não encontrado: {catalog_path}", file=sys.stderr)
        print("Gere o catálogo antes (veja scripts/export_exercise_catalog.sql).", file=sys.stderr)
        return 1

    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    if args.only:
        rx = re.compile(args.only, re.I)
        catalog = [e for e in catalog if rx.search(e.get("name", ""))]
    if args.limit:
        catalog = catalog[: args.limit]

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Cache: um GIF por combinação (motion, equipment, group) — evita duplicatas.
    cache: Dict[Tuple[str, str, str], bytes] = {}
    # Cache do Wikimedia: um GIF por base de ilustração.
    wiki_cache: Dict[str, bytes] = {}
    media = em.load_media() if em else {}
    manifest: List[dict] = []
    total_bytes = 0
    stats = {"wiki": 0, "local": 0}

    for entry in catalog:
        name = entry.get("name") or ""
        if not name:
            continue
        category = entry.get("category") or None
        equipment = entry.get("equipment") or None
        motion, eq, grp = classify(name, category, equipment)
        key = (motion, eq, grp)

        # ── Fonte preferida: Wikimedia Commons (personagem + máquina) ──
        source = "local"
        data: Optional[bytes] = None
        if em is not None and args.source in ("auto", "wiki"):
            base = em.wiki_base_for(name)
            wiki_key = em.resolve_base(base, media) if base else None
            if wiki_key:
                if wiki_key not in wiki_cache:
                    try:
                        wiki_cache[wiki_key] = em.build_wikimedia_gif(wiki_key, media)
                    except Exception:
                        wiki_cache[wiki_key] = b""
                if wiki_cache.get(wiki_key):
                    data = wiki_cache[wiki_key]
                    source = "wiki"

        # ── Fallback: vetor local ──
        if data is None and args.source in ("auto", "local"):
            if key not in cache:
                cache[key] = build_gif(motion, eq, grp)
            data = cache[key]
            source = "local"

        if data is None:
            print(f"  ! sem GIF para {name}", file=sys.stderr)
            continue

        stats[source] = stats.get(source, 0) + 1
        fname = f"{slugify(name)}.gif"
        path = out_dir / fname
        if not args.dry_run:
            path.write_bytes(data)
        total_bytes += len(data)
        manifest.append({
            "name": name,
            "file": fname,
            "motion": motion,
            "equipment": eq,
            "group": grp,
            "source": source,
            "bytes": len(data),
        })

    if not args.dry_run:
        (out_dir / "manifest.json").write_text(
            json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8"
        )

    uniq = len(cache)
    avg = (total_bytes // len(manifest)) if manifest else 0
    print(f"Exercícios: {len(manifest)}  |  GIFs únicos (local): {uniq}  |  média: {avg/1024:.1f} KB")
    print(f"  fonte Wikimedia Commons: {stats.get('wiki', 0)}  |  vetor local: {stats.get('local', 0)}")
    print(f"Duração: {DURATION_S}s @ {FPS}fps (limite {MAX_DURATION_S}s)  |  sem áudio  |  loop infinito")
    if not args.dry_run:
        print(f"Saída: {out_dir}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
