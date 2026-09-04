import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy para imagens externas de exercícios (Wikimedia Commons).
 *
 * Por que existe:
 * A Wikimedia serve SVGs com `Content-Type: text/plain` (decisão interna
 * deles). O navegador exige `image/svg+xml` para renderizar via `<img>`,
 * então sem este proxy o `onError` dispara e cai no placeholder SVG (as
 * iniciais coloridas). Aqui re-servimos o conteúdo com o content-type
 * correto, e o `<img>` renderiza normalmente.
 *
 * Restrições:
 * - Apenas hosts confiáveis (Wikimedia + Wikimedia thumb CDN).
 * - Cache imutável de 7 dias; CDN pode reaproveitar agressivamente.
 * - Bloqueia qualquer outra origem para evitar SSRF/abuso.
 */
const ALLOWED_HOSTS = new Set([
  "upload.wikimedia.org",
  "commons.wikimedia.org",
]);

const ALLOWED_PATH_PREFIXES = [
  "/wikipedia/commons/",
  "/wikipedia/commons/thumb/",
];

const ALLOWED_EXTENSIONS = [".svg", ".png", ".jpg", ".jpeg", ".webp"];

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  if (parsed.protocol !== "https:") {
    return NextResponse.json({ error: "https only" }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 403 });
  }

  const pathOk = ALLOWED_PATH_PREFIXES.some((p) => parsed.pathname.startsWith(p));
  if (!pathOk) {
    return NextResponse.json({ error: "path not allowed" }, { status: 403 });
  }

  const extOk = ALLOWED_EXTENSIONS.some((ext) =>
    parsed.pathname.toLowerCase().endsWith(ext),
  );
  if (!extOk) {
    return NextResponse.json({ error: "extension not allowed" }, { status: 403 });
  }

  const upstream = await fetch(parsed.toString(), {
    // User-Agent identifica a origem para a Wikimedia não recusar
    // (eles rejeitam requisições com UA genérico "node" em algumas rotas
    // de thumb). Accept prioriza imagem.
    headers: {
      Accept: "image/avif,image/webp,image/png,image/svg+xml,image/*,*/*;q=0.8",
      "User-Agent": "VITTA-App/1.0 (https://ideal-life-app.vercel.app)",
    },
    // Sem seguir redirecionamentos para destinos fora da allowlist.
    redirect: "follow",
    // Cacheable no edge.
    next: { revalidate: 60 * 60 * 24 * 7 },
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "upstream failed", status: upstream.status },
      { status: 502 },
    );
  }

  // Tenta preservar o content-type, mas força image/* quando o upstream
  // entrega text/plain (caso Wikimedia).
  const upstreamType = upstream.headers.get("content-type") ?? "";
  const lower = parsed.pathname.toLowerCase();
  let type = upstreamType;
  if (!type.startsWith("image/") || upstreamType === "text/plain") {
    if (lower.endsWith(".svg")) type = "image/svg+xml; charset=utf-8";
    else if (lower.endsWith(".png")) type = "image/png";
    else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) type = "image/jpeg";
    else if (lower.endsWith(".webp")) type = "image/webp";
    else type = "application/octet-stream";
  }

  const headers = new Headers();
  headers.set("Content-Type", type);
  headers.set("Cache-Control", "public, max-age=604800, immutable");
  // Permite embedding de qualquer origem (uso em <img>).
  headers.set("Access-Control-Allow-Origin", "*");

  return new NextResponse(upstream.body, { status: 200, headers });
}
