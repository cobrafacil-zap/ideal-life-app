#!/usr/bin/env python3
"""
VITTA — Motor de mídia demonstrativa (Wikimedia Commons + fallback local).

Duas fontes de imagem:

1. **Wikimedia Commons** (preferida) — as ilustrações de exercício do Commons
   têm personagem anatômico e o equipamento/máquina visível, que é o padrão
   de referência do app. Vários movimentos têm 2 frames SVG numerados
   (pose inicial e pose final); interpolamos os dois para gerar o GIF.

   O morph usa **posterização do canal alfa**: em vez de alpha-blend (que
   cria "fantasma" entre os desenhos), calculamos o alfa interpolado e
   cortamos num limiar. O resultado é uma transformação nítida entre as
   duas poses, sem duplicação de traço.

2. **Fallback local** — stick figure vetorial gerado por código, para
   movimentos sem ilustração equivalente no Commons. Mantém a cobertura
   de 100% do catálogo.

O GIF gerado tem 6 s a 12 fps, loop infinito e sem áudio.
"""

from __future__ import annotations

import io
import json
import math
import random
import re
import time
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

import requests
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".cache" / "wikimedia"
MEDIA_JSON = ROOT / "scripts" / "wikimedia-media.json"

CANVAS = 360
FPS = 12
DURATION_S = 6.0
FRAMES = int(round(FPS * DURATION_S))
ALPHA_THRESHOLD = 0.45
BG = "#F7F5F0"

S = requests.Session()
S.headers["User-Agent"] = "VittaExerciseCatalog/1.0 (educational fitness app)"


# ─────────────────────────────────────────────────────────────────────────────
# Download / rasterização
# ─────────────────────────────────────────────────────────────────────────────
def filepath_url(title: str, width: int = 720) -> str:
    """URL do Commons que rasteriza o arquivo (SVG → PNG) no tamanho pedido."""
    name = title.replace("File:", "").replace(" ", "_")
    return f"https://commons.wikimedia.org/wiki/Special:FilePath/{name}?width={width}"


def fetch_png(title: str, width: int = 720) -> Optional[Image.Image]:
    """Baixa (com cache em disco) e devolve o PNG do arquivo do Commons."""
    CACHE.mkdir(parents=True, exist_ok=True)
    key = re.sub(r"[^A-Za-z0-9]+", "_", title.replace("File:", ""))[:110]
    cached = CACHE / f"{key}.png"
    if cached.exists():
        try:
            return Image.open(cached).convert("RGBA")
        except Exception:
            cached.unlink(missing_ok=True)

    url = filepath_url(title, width)
    for attempt in range(4):
        try:
            r = S.get(url, timeout=70, allow_redirects=True)
            if r.status_code == 200 and r.content:
                im = Image.open(io.BytesIO(r.content)).convert("RGBA")
                cached.write_bytes(r.content)
                return im
        except Exception:
            pass
        time.sleep(1.4 * (attempt + 1) + random.random())
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Morph
# ─────────────────────────────────────────────────────────────────────────────
def fit_canvas(im: Image.Image, size: int = CANVAS) -> Image.Image:
    """Centraliza a ilustração no canvas, mantendo a proporção e o topo."""
    w, h = im.size
    if w == 0 or h == 0:
        return Image.new("RGBA", (size, size), (0, 0, 0, 0))
    scale = min(size / w, size / h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    im = im.resize((nw, nh), Image.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(im, ((size - nw) // 2, (size - nh) // 2), im)
    return out


def morph(a: Image.Image, b: Image.Image, t: float) -> Image.Image:
    """Interpola duas poses com posterização do alfa (sem 'fantasma').

    O blend linear do PIL interpola cada canal (incluindo alfa). Em seguida
    cortamos o alfa num limiar: o traço resultante é nítido e as duas poses
    não se duplicam no meio do movimento.
    """
    if t <= 0:
        return a.copy()
    if t >= 1:
        return b.copy()
    blended = Image.blend(a, b, t)
    r, g, bl, alpha = blended.split()
    alpha = alpha.point(lambda v: 255 if v >= ALPHA_THRESHOLD * 255 else 0)
    return Image.merge("RGBA", (r, g, bl, alpha))


def frames_from_pair(a: Image.Image, b: Image.Image) -> List[Image.Image]:
    """Sequência de frames: pose A → pose B → pose A (loop sem salto).

    O crossfade é concentrado no meio da transição. As ilustrações do Commons
    não têm o equipamento perfeitamente alinhado entre os frames, então um
    blend espalhado duplicaria o trilho da máquina durante todo o movimento.
    Segurar a pose e cruzar rápido deixa o movimento legível e o fantasma
    some quase instantaneamente.
    """
    seq: List[Image.Image] = []
    half = FRAMES // 2
    blend_span = max(2, int(half * 0.34))  # ~1/3 do tempo em transição

    def ramp(i: int, n: int) -> float:
        """0→1 com easing suave, restrito à janela de blend."""
        if n <= 1:
            return 1.0
        t = i / (n - 1)
        return 0.5 - 0.5 * math.cos(math.pi * t)

    # A → B: segura A, cruza, segura B
    hold = (half - blend_span) // 2
    for i in range(half):
        if i < hold:
            seq.append(a.copy())
        elif i < hold + blend_span:
            seq.append(morph(a, b, ramp(i - hold, blend_span)))
        else:
            seq.append(b.copy())
    # B → A
    for i in range(FRAMES - half):
        if i < hold:
            seq.append(b.copy())
        elif i < hold + blend_span:
            seq.append(morph(b, a, ramp(i - hold, blend_span)))
        else:
            seq.append(a.copy())
    return seq[:FRAMES]


def build_gif_from_frames(frames: Sequence[Image.Image], bg: str = BG) -> bytes:
    """Monta o GIF (loop infinito, sem áudio) com fundo opaco."""
    rgb = [Image.alpha_composite(
        Image.new("RGBA", f.size, bg), f
    ).convert("RGB") for f in frames]
    buf = io.BytesIO()
    rgb[0].save(
        buf,
        format="GIF",
        save_all=True,
        append_images=rgb[1:],
        duration=int(1000 / FPS),
        loop=0,
        optimize=True,
        disposal=2,
    )
    return buf.getvalue()


# ─────────────────────────────────────────────────────────────────────────────
# Mapeamento exercício → base Wikimedia
# ─────────────────────────────────────────────────────────────────────────────
# (regex do nome do exercício, base no Commons)
WIKI_RULES: List[Tuple[str, str]] = [
    # ── Puxada frontal ──
    (r"puxada frontal|pulldown|pull.?down", "Wide_grip_lat_pull_down"),
    (r"puxada.*alta|high row", "Upright_barbell_rows"),
    (r"puxada.*cabo", "Wide_grip_lat_pull_down"),
    (r"barra fixa|pull.?up|chin.?up", "Pullup"),
    # ── Remada ──
    (r"remada baixa no cabo|low row", "Upright_cable_row"),
    (r"remada.*cabo|face pull|pullover", "Upright_cable_row"),
    (r"remada curvada|remada unilateral|remada com barra|barbell row", "Upright_barbell_rows"),
    (r"remada", "Upright_cable_row"),
    # ── Peito ──
    (r"supino.*(barra|com barra)", "Bench_press"),
    (r"supino.*halter", "Bench_press_dumbbell"),
    (r"supino.*cabo|peck deck", "Flat_bench_cable_flys"),
    (r"supino inclinado.*(barra|com barra)", "Incline_bench_press"),
    (r"supino inclinado.*halter", "Dumbbell_incline_bench_press"),
    (r"supino inclinado", "Incline_bench_press"),
    (r"supino declinado", "Decline_barbell_bench_press"),
    (r"supino fechado|close grip", "Close_grip_barbell_bench_press"),
    (r"crucifixo|crossover|voador|fly", "Cable_crossover"),
    (r"flex[ãa]o de bra[çc]o|flex[ãa]o|push.?up|mergulho|dip", "Bosu_ball_push_up"),
    # ── Pernas ──
    (r"agachamento.*(cabo|polia|el[áa]stico)", "Lying_squat"),
    (r"agachamento no hack|hack squat", "Hack_squat_with_barbell"),
    (r"agachamento.*(smith|m[áa]quina)", "Smith_machine_hack_squat"),
    (r"agachamento.*(barra|halter)", "Overhead_squat_with_barbell"),
    (r"agachamento|squat|sissy|sum[óo]", "Squat_to_bench_with_barbell"),
    (r"leg press|pressa de perna", "Lying_squat"),
    (r"cadeira extensora|leg extension|extens[ãa]o de joelho", "Lying_squat"),
    (r"afundo|avanço|lunge|step.?up|b[úu]lgaro", "Single_leg_squat_with_barbell"),
    (r"stiff|romeno|deadlift|levantamento terra|bom dia|good morning|pull through|reverse hyper|nordic|glute ham",
     "Squat_to_bench_with_barbell"),
    (r"mesa flexora|cadeira flexora|flexora|leg curl|flex[ãa]o de joelho|hamstring", "Seated_leg_curl"),
    (r"panturrilha.*sentada", "Seated_calf_raise_using_machine"),
    (r"panturrilha|calcanhar|calf", "Standing_calf_raises"),
    (r"elev[ãa][çc][ãa]o p[ée]lvica|gl[úu]teo quatro apoios|pelvic bridge|frog.?pump",
     "Squat_to_bench_with_barbell"),
    (r"hip.?thrust|ponte de gl[úu]teo|glute drive|glute kickback|coice", "Squat_to_bench_with_barbell"),
    (r"gl[úu]teo na m[áa]quina|multi-hip|glute machine", "Machine_glute_bridge"),
    (r"extens[ãa]o de quadril no cabo|cable hip extension", "Cable_hip_extension"),
    (r"back extension|hiperextens|ghd|flex[ãa]o do quadril", "Hyperextensions"),
    # ── Quadril / abdutores ──
    (r"abdu[çc][ãa]o|abdutora|abductor", "Hip_abduction_machine"),
    (r"adutora|adduction", "Hip_adduction_machine"),
    # ── Ombros ──
    (r"desenvolvimento.*(barra|com barra)", "Barbell_shoulder_press"),
    (r"desenvolvimento.*halter", "Dumbbell_shoulder_press"),
    (r"desenvolvimento.*cabo|elev[ãa][çc][ãa]o frontal", "Seated_shoulder_press_machine"),
    (r"desenvolvimento|shoulder press|military press|overhead press", "Barbell_shoulder_press"),
    (r"elev[ãa][çc][ãa]o lateral|ar{ñn}o lateral|elev[ãa][çc][ãa]o de bra[çc]o", "Lying_rear_lateral_raise"),
    (r"encolhimento|shrug|upright row|remada alta", "Upright_barbell_rows"),
    # ── Braços ──
    (r"rosca.*(cabo|polia|corda)", "Standing_biceps_curl_with_cable"),
    (r"rosca.*(barra|com barra)", "Wide_grip_standing_biceps_curl_with_barbell"),
    (r"rosca.*halter", "Biceps_curl_with_dumbbell"),
    (r"rosca|curl|biceps", "Biceps_curl_with_dumbbell"),
    (r"tr[íi]ceps.*(barra|com barra|testa)|close grip", "Close_grip_barbell_bench_press"),
    (r"tr[íi]ceps fran[çc]eis|french press", "French_press"),
    (r"tr[íi]ceps.*(cabo|polia)|pushdown", "One_arm_tricep_extension_with_cable"),
    (r"tr[íi]ceps|tricep", "One_arm_tricep_extension_with_cable"),
    (r"antec|br[çc]ao|wrist", "Biceps_curl_reverse_with_dumbbells"),
    # ── Core ──
    (r"prancha lateral|side plank", "Side_plank"),
    (r"prancha|plank|dead bug", "Bosu_ball_push_up"),
    (r"abdominal|crunch|oblique|sant[óo]rio|roll up", "Crunch"),
    (r"wood chop|rotation|rota[çc][ãa]o|twist|pallof", "Overhead_squat_with_barbell"),
    (r"kettlebell swing|balanço|swing", "Kettlebell_swing"),
    (r"elev[ãa][çc][ãa]o de pernas|leg raise|reverse crunch", "Leg_raise"),
    # ── Cardio ──
    (r"corrida|run|caminhada|jog", "Jogging"),
    (r"pular corda|skip|jump rope", "Jump_rope"),
    (r"bicicleta|el[íi]ptico|bike|remo ergom[ôo]rico|remador", "Exercise_bike"),
    (r"esteira", "Treadmill"),
]


def wiki_base_for(name: str) -> Optional[str]:
    n = name.lower()
    for pattern, base in WIKI_RULES:
        if re.search(pattern, n, re.I):
            return base
    return None


def load_media() -> Dict[str, Dict]:
    if not MEDIA_JSON.exists():
        return {}
    return json.loads(MEDIA_JSON.read_text(encoding="utf-8"))


def build_wikimedia_gif(base: str, media: Dict[str, Dict]) -> Optional[bytes]:
    """Gera o GIF a partir dos frames do Commons. Retorna None se falhar."""
    entry = media.get(base)
    if not entry:
        return None

    # 1) GIF oficial do Commons (melhor caso)
    gif_title = entry.get("gif")
    if gif_title:
        url = filepath_url(gif_title, width=CANVAS * 2)
        for attempt in range(3):
            try:
                r = S.get(url, timeout=70, allow_redirects=True)
                if r.status_code == 200 and r.content[:6] in (b"GIF87a", b"GIF89a"):
                    return r.content
            except Exception:
                pass
            time.sleep(1.2 * (attempt + 1))

    # 2) Interpola os frames SVG numerados
    frames = entry.get("frames") or []
    if len(frames) < 2:
        return None
    a = fetch_png(frames[0])
    b = fetch_png(frames[1])
    if a is None or b is None:
        return None
    a = fit_canvas(a)
    b = fit_canvas(b)
    seq = frames_from_pair(a, b)
    return build_gif_from_frames(seq)
