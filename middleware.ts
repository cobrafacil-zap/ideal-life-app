import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Matcher positivo: o middleware só roda nas rotas que precisam decidir
  // entre redirecionar logado/deslogado. Páginas públicas (incluindo a raiz
  // `/`, que tem auth própria em app/page.tsx) e assets ficam de fora,
  // evitando o round-trip ao Supabase Auth em toda requisição — o que
  // causava 504 MIDDLEWARE_INVOCATION_TIMEOUT na Vercel.
  matcher: [
    "/hoje/:path*",
    "/saude/:path*",
    "/alimentacao/:path*",
    "/treinos/:path*",
    "/ciclo/:path*",
    "/perfil/:path*",
    "/login",
    "/signup",
    "/forgot-password",
  ],
};
