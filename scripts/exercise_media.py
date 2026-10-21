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
    """Baixa (com cache em disco) e devolve a imagem do arquivo do Commons.

    Aceita SVG (rasterizado pelo Commons), PNG e GIF — a série de ilustrações
    usa os três formatos para o mesmo desenho.
    """
    CACHE.mkdir(parents=True, exist_ok=True)
    name = title.replace("File:", "")
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else "png"
    if ext not in ("svg", "png", "gif", "jpg", "jpeg"):
        ext = "png"
    key = re.sub(r"[^A-Za-z0-9]+", "_", name)[:110]
    cached = CACHE / f"{key}.{ext}"
    if cached.exists():
        try:
            im = Image.open(cached)
            im.seek(0)
            return im.convert("RGBA")
        except Exception:
            cached.unlink(missing_ok=True)

    url = filepath_url(title, width)
    for attempt in range(4):
        try:
            r = S.get(url, timeout=70, allow_redirects=True)
            if r.status_code == 200 and r.content:
                im = Image.open(io.BytesIO(r.content))
                im.seek(0)
                out = im.convert("RGBA")
                cached.write_bytes(r.content)
                return out
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


def build_gif_from_frames(
    frames: Sequence[Image.Image], bg: str = BG, colors: int = 64
) -> bytes:
    """Monta o GIF (loop infinito, sem áudio) com fundo opaco.

    As ilustrações são traço preto sobre fundo creme, então uma paleta
    compartilhada de poucas cores reduz o arquivo sem perder qualidade.
    A paleta é única para todos os frames — assim o dithering não pisca
    entre um frame e outro.
    """
    rgb = [Image.alpha_composite(
        Image.new("RGBA", f.size, bg), f
    ).convert("RGB") for f in frames]
    if not rgb:
        return b""

    # Paleta compartilhada, construída a partir de uma amostra dos frames.
    sample = rgb[:: max(1, len(rgb) // 6)][:6]
    w, h = rgb[0].size
    strip = Image.new("RGB", (w, h * len(sample)))
    for i, f in enumerate(sample):
        strip.paste(f, (0, i * h))
    palette = strip.quantize(colors=colors, method=Image.MEDIANCUT)

    indexed = [
        f.quantize(palette=palette, dither=Image.FLOYDSTEINBERG) for f in rgb
    ]
    buf = io.BytesIO()
    indexed[0].save(
        buf,
        format="GIF",
        save_all=True,
        append_images=indexed[1:],
        duration=int(1000 / FPS),
        loop=0,
        optimize=True,
        disposal=2,
    )
    return buf.getvalue()


# ─────────────────────────────────────────────────────────────────────────────
# Mapeamento exercício → base Wikimedia
# ─────────────────────────────────────────────────────────────────────────────
# Mapeamento exato do catálogo (nome do exercício → base na série de
# ilustrações "Weight training diagrams" do Wikimedia Commons).
#
# Cada base tem 2 frames SVG (pose inicial e pose final) que são
# interpolados para formar o GIF. As ilustrações já trazem o personagem
# anatômico e o equipamento/máquina do exercício.
WIKI_EXACT: Dict[str, str] = {
    # ── Abdômen / core ──
    "Abdominal canivete": "Cross body crunch",
    "Abdominal crunch": "Crunches",
    "Abdominal na roda": "Flutter kicks",
    "Abdominal supra": "Stability ball abdominal crunch",
    "Dead bug": "Ab rollout with barbell",
    "Elevação de pernas": "Flat bench leg raises",
    "Prancha lateral": "Side plank",
    # ── Coxas / glúteos ──
    "Abdução de quadril": "Thigh abductor",
    "Abdução de quadril com elástico": "Thigh abductor",
    "Afundo búlgaro": "Single leg squat with barbell",
    "Afundo com halteres": "Lunges",
    "Agachamento búlgaro com halteres": "Single leg squat with barbell",
    "Agachamento com elástico": "Squats with exercise bands",
    "Agachamento com halteres": "Squats using dumbbells",
    "Agachamento livre": "Wide stance squat with barbell",
    "Agachamento no hack": "Hack squat with barbell",
    "Agachamento no smith": "Smith machine squats",
    "Agachamento smith sumô": "Wide stance squat with barbell",
    "Agachamento sumô": "Wide stance squat with barbell",
    "Avanço": "Walking lunges",
    "Bom dia": "Good-mornings",
    "Cadeira abdutora": "Thigh abductor",
    "Cadeira adutora": "Hip adduction",
    "Cadeira extensora": "Leg extensions",
    "Coice com elástico": "One legged cable kickback",
    "Elevação pélvica": "Bent knee hip raise",
    "Extensão de quadril no cabo": "One legged cable kickback",
    "Flexora em pé": "Standing leg curls",
    "Flexora em pé unilateral": "Standing leg curls",
    "Hack squat": "Hack squat with barbell",
    "Hip thrust": "Bridging",
    "Leg press 45": "Lying squat",
    "Leg press 45 unilateral": "Lying squat",
    "Mesa flexora": "Lying leg curl machine",
    "Mesa flexora unilateral": "Lying leg curl machine",
    "Panturrilha em pé": "Standing-calf-raises",
    "Panturrilha no leg press": "Calves press on leg machine",
    "Panturrilha sentada": "Seated calf raise using machine",
    "Ponte de glúteo com barra": "Bridging",
    "Ponte de glúteo com halteres": "Bridging",
    "Sissy squat": "Weighted sissy squat with weight plate",
    "Step up com halteres": "Step ups with dumbbells",
    "Stiff": "Romanian dead lift",
    "Stiff com halteres": "Romanian dead lift",
    # ── Costas ──
    "Barra fixa": "Pull ups",
    "Face pull": "Bent over rear deltoid raise with head on bench",
    "Hiperextensão": "Hyperextensions",
    "Pulldown com corda": "V bar pull down",
    "Puxada frontal": "Wide grip lat pull down",
    "Puxada frontal pegada supinada": "Underhand pull downs",
    "Remada alta": "Upright barbell rows",
    "Remada baixa no cabo": "Seated cable rows",
    "Remada cavalinho": "T bar rows",
    "Remada curvada": "Reverse grips bent over barbell rows",
    "Remada unilateral": "One arm upright row",
    # ── Peito ──
    "Crossover": "Cable crossover",
    "Crucifixo inclinado": "Incline dumbbell flys",
    "Crucifixo reto": "Dumbbell flys",
    "Flexão de braço": "Push ups",
    "Flexão declinada": "Push up feet elevated 2",
    "Mergulho": "Chest dips",
    "Peck deck": "Butterfly machine",
    "Supino declinado": "Decline barbell bench press",
    "Supino inclinado com barra": "Incline bench press",
    "Supino inclinado com halteres": "Dumbbell incline bench press",
    "Supino reto com barra": "Bench press",
    "Supino reto com halteres": "Bench press dumbbell",
    # ── Ombros ──
    "Crucifixo inverso": "Bent over rear deltoid raise with head on bench",
    "Crucifixo inverso na máquina": "Lying rear lateral raise",
    "Desenvolvimento com barra": "Barbell shoulder press",
    "Desenvolvimento com halteres": "Dumbbell shoulder press",
    "Desenvolvimento máquina": "Seated shoulder press machine",
    "Elevação frontal": "Front raises",
    "Elevação frontal com barra": "Front barbell raises",
    "Elevação lateral": "Lateral dumbbell raises",
    "Elevação lateral unilateral no cabo": "Cable-seated-rear-lateral-raise",
    "Encolhimento": "Barbell shrugs",
    "Remada alta": "Upright barbell rows",
    # ── Braços ──
    "Rosca alternada": "Alternating bicep curl with dumbbell",
    "Rosca concentrada": "Concentration curls with dumbbell",
    "Rosca direta": "Bicep curls with barbell",
    "Rosca inversa": "Biceps curl reverse with dumbbells",
    "Rosca martelo": "Bicep hammer curl with dumbbell",
    "Rosca no cabo": "Standing biceps curl with cable",
    "Rosca scott": "Preacher curl with machine",
    "Supino fechado": "Close grip barbell bench press",
    "Tríceps coice": "Triceps kickback with dumbbell",
    "Tríceps francês": "Lying triceps extension with dumbbells",
    "Tríceps na polia": "Triceps pushdown with cable",
    "Tríceps testa": "Lying close grip triceps extension behind the head with barbell",
    # ── Costas / posterior ──
    "Levantamento terra": "Barbell dead lifts",
    "Levantamento terra com halteres": "Dumbbell dead lifts",
    # ── Cardio ──
    "Bicicleta ergométrica": "Air bike",
    "Remo ergométrico": "Body row",
}

# Regras por padrão, usadas quando o nome não está no mapa exato.
# (regex do nome do exercício, base no Commons)
WIKI_RULES: List[Tuple[str, str]] = [
    (r"barra fixa|pull.?up|chin.?up", "Pull ups"),
    (r"puxada frontal|pulldown|pull.?down", "Wide grip lat pull down"),
    (r"supino.*(barra|com barra)", "Bench press"),
    (r"supino.*halter", "Bench press dumbbell"),
    (r"supino inclinado", "Incline bench press"),
    (r"supino declinado", "Decline barbell bench press"),
    (r"supino fechado", "Close grip barbell bench press"),
    (r"crucifixo reto", "Dumbbell flys"),
    (r"crucifixo inclinado", "Incline dumbbell flys"),
    (r"crossover|voador", "Cable crossover"),
    (r"peck deck", "Butterfly machine"),
    (r"flex[ãa]o de bra[çc]o|flex[ãa]o|push.?up", "Push ups"),
    (r"mergulho|dip", "Chest dips"),
    (r"agachamento.*(hack)", "Hack squat with barbell"),
    (r"agachamento.*smith", "Smith machine squats"),
    (r"agachamento", "Wide stance squat with barbell"),
    (r"afundo|lunge|avanço", "Lunges"),
    (r"step up", "Step ups with dumbbells"),
    (r"leg press", "Lying squat"),
    (r"cadeira extensora|extens[ãa]o de joelho", "Leg extensions"),
    (r"mesa flexora|flexora", "Lying leg curl machine"),
    (r"panturrilha.*sentada", "Seated calf raise using machine"),
    (r"panturrilha", "Standing-calf-raises"),
    (r"elev[ãa][çc][ãa]o p[ée]lvica", "Bent knee hip raise"),
    (r"ponte de gl[úu]teo|bridging", "Bridging"),
    (r"stiff|romeno|romanian", "Romanian dead lift"),
    (r"levantamento terra|deadlift|dead lift", "Barbell dead lifts"),
    (r"bom dia|good morning", "Good-mornings"),
    (r"remada alta|remada alta", "Upright barbell rows"),
    (r"remada cavalinho|t bar|t-bar", "T bar rows"),
    (r"remada curvada", "Reverse grips bent over barbell rows"),
    (r"remada baixa", "Seated cable rows"),
    (r"remada unilateral", "One arm upright row"),
    (r"remada", "Seated cable rows"),
    (r"desenvolvimento.*barra", "Barbell shoulder press"),
    (r"desenvolvimento.*halter", "Dumbbell shoulder press"),
    (r"desenvolvimento", "Seated shoulder press machine"),
    (r"elev[ãa][çc][ãa]o frontal", "Front raises"),
    (r"elev[ãa][çc][ãa]o lateral", "Lateral dumbbell raises"),
    (r"encolhimento|shrug", "Barbell shrugs"),
    (r"rosca.*(cabo|polia)", "Standing biceps curl with cable"),
    (r"rosca.*(barra|com barra)", "Bicep curls with barbell"),
    (r"rosca concentrada", "Concentration curls with dumbbell"),
    (r"rosca alternada", "Alternating bicep curl with dumbbell"),
    (r"rosca inversa", "Biceps curl reverse with dumbbells"),
    (r"rosca martelo|hammer", "Bicep hammer curl with dumbbell"),
    (r"rosca|preacher|scott", "Preacher curl with machine"),
    (r"tr[íi]ceps coice|kickback", "Triceps kickback with dumbbell"),
    (r"tr[íi]ceps fran[çc]eis|french press", "Lying triceps extension with dumbbells"),
    (r"tr[íi]ceps testa|skull", "Lying close grip triceps extension behind the head with barbell"),
    (r"tr[íi]ceps.*(cabo|polia)|pushdown", "Triceps pushdown with cable"),
    (r"tr[íi]ceps", "Triceps pushdown with cable"),
    (r"hiperextens", "Hyperextensions"),
    (r"abdu[çc][ãa]o|abdutora|abductor", "Thigh abductor"),
    (r"adutora|adduction", "Hip adduction"),
    (r"bicicleta|air bike", "Air bike"),
    (r"remo ergom", "Body row"),
    (r"abdominal|obl[íi]quo", "Crunches"),
    (r"prancha lateral|side plank", "Side plank"),
    (r"dead bug|ab rollout", "Ab rollout with barbell"),
]


def wiki_base_for(name: str) -> Optional[str]:
    """Base da ilustração do Commons para um exercício do catálogo.

    Primeiro tenta o mapa exato (nome do catálogo → base) e, se não houver,
    cai nas regras por padrão de nome.
    """
    key = name.strip()
    if key in WIKI_EXACT:
        return WIKI_EXACT[key]
    # tolerância a variações de caixa/espaços do catálogo
    norm = re.sub(r"\s+", " ", key).casefold()
    for k, v in WIKI_EXACT.items():
        if re.sub(r"\s+", " ", k).casefold() == norm:
            return v
    n = name.lower()
    for pattern, base in WIKI_RULES:
        if re.search(pattern, n, re.I):
            return base
    return None


def load_media() -> Dict[str, Dict]:
    if not MEDIA_JSON.exists():
        return {}
    return json.loads(MEDIA_JSON.read_text(encoding="utf-8"))


def normalize_gif(data: bytes, size: int = CANVAS, bg: str = BG) -> bytes:
    """Normaliza um GIF externo (Wikimedia) para o canvas quadrado do app.

    Os GIFs oficiais do Commons têm proporções variadas (ex.: 528x269). Para
    manter o estilo visual padronizado — e não cortar nada do movimento —
    compomos cada frame sobre o fundo do app e centralizamos mantendo a
    proporção original.
    """
    src = Image.open(io.BytesIO(data))
    frames: List[Image.Image] = []
    n = getattr(src, "n_frames", 1)
    for i in range(n):
        src.seek(i)
        frame = src.convert("RGBA")
        w, h = frame.size
        if w == 0 or h == 0:
            continue
        scale = min(size / w, size / h)
        nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
        frame = frame.resize((nw, nh), Image.LANCZOS)
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        canvas.paste(frame, ((size - nw) // 2, (size - nh) // 2), frame)
        frames.append(canvas)
    if not frames:
        return data
    return build_gif_from_frames(frames, bg=bg)


def _norm_base(name: str) -> str:
    """Normaliza o rótulo da base para comparar variantes de nome."""
    return re.sub(r"[^a-z0-9]+", "", name.lower())


def resolve_base(base: str, media: Dict[str, Dict]) -> Optional[str]:
    """Encontra a chave real da base no inventário (aceita variações de nome)."""
    if base in media:
        return base
    target = _norm_base(base)
    for key in media:
        if _norm_base(key) == target:
            return key
    return None


def build_wikimedia_gif(base: str, media: Dict[str, Dict]) -> Optional[bytes]:
    """Gera o GIF a partir dos frames do Commons. Retorna None se falhar."""
    key = resolve_base(base, media)
    entry = media.get(key) if key else None
    if not entry:
        return None

    # Interpola os frames numerados da ilustração (personagem + máquina).
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
